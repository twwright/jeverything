import { experimental_evaluate as evaluate, type Experimental_EvaluationModel } from "ai";
import { gateway } from "@ai-sdk/gateway";

export const questionVersion = "support-triage-v1";
export const questions = {
  route: {
    type: "choice",
    instructions: "Choose the primary team for `ticket.message`. If multiple unrelated requests need different teams, choose review.",
    criteria: {
      billing: "Only billing, invoice, payment, or refund assistance",
      technical: "Only application malfunction or service availability assistance",
      review: "Multiple unrelated requests, insufficient evidence, or anything outside the other categories",
    },
  },
  refundIntent: {
    type: "boolean",
    instructions: "Does `ticket.message` ask for money to be returned? An account fact or a quoted request by another person is not the customer's current request.",
  },
  currentImpact: {
    type: "boolean",
    instructions: "Does `ticket.message` report that the customer currently cannot use the service? Distinguish current impact from resolved or hypothetical impact.",
  },
  frustration: {
    type: "score",
    instructions: "Rate expressed frustration in `ticket.message`, using only the customer's wording.",
    criteria: [
      "Neutral request or factual report without expressed dissatisfaction",
      "Explicit dissatisfaction, disappointment, or impatience",
      "Strong anger or repeated urgent demands about an unresolved issue",
    ],
  },
} as const;

export type Ticket = { id: string; message: string; accountVerified: boolean };
export type Policy = { routeProbability: number; impactReviewProbability: number };

// Illustrative configuration, not thresholds validated for a real business.
export const examplePolicy: Policy = { routeProbability: 0.9, impactReviewProbability: 0.8 };

export async function evaluateTicket(
  ticket: Ticket,
  model: Experimental_EvaluationModel = gateway.evaluationModel("typesafe-ai/jev"),
  signal: AbortSignal = AbortSignal.timeout(5_000),
) {
  if (!ticket.message.trim() || ticket.message.length > 12_000) {
    throw new Error("Ticket message must contain 1 to 12000 characters");
  }
  return evaluate({
    model,
    state: { ticket: { message: ticket.message } },
    questions,
    maxRetries: 1,
    abortSignal: signal,
    providerOptions: { gateway: { zeroDataRetention: true } },
  });
}

export type TriageResult = Awaited<ReturnType<typeof evaluateTicket>>;
export type Action = { queue: "billing" | "technical" | "human"; reason: string };

export function chooseAction(ticket: Ticket, result: TriageResult, policy: Policy): Action {
  for (const threshold of [policy.routeProbability, policy.impactReviewProbability]) {
    if (!Number.isFinite(threshold) || threshold < 0 || threshold > 1) {
      throw new Error("Policy thresholds must be finite probabilities");
    }
  }
  if (!ticket.accountVerified) return { queue: "human", reason: "account-unverified" };
  if (result.answers.currentImpact.probability >= policy.impactReviewProbability) {
    return { queue: "human", reason: "current-impact" };
  }
  const route = result.answers.route;
  const selected = route.probabilities?.[route.choice];
  if (route.choice === "review" || selected == null || selected < policy.routeProbability) {
    return { queue: "human", reason: "uncertain-or-outside-scope" };
  }
  // This function selects a queue. It never authorizes or issues a refund.
  return { queue: route.choice, reason: "evaluated-routing-policy" };
}

export async function triage(ticket: Ticket, policy: Policy = examplePolicy): Promise<Action> {
  try {
    return chooseAction(ticket, await evaluateTicket(ticket), policy);
  } catch {
    // Real integrations should log a sanitized error category and correlation ID.
    return { queue: "human", reason: "evaluation-unavailable" };
  }
}
