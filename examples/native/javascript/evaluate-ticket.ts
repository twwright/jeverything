import {
  APIConnectionError,
  APIError,
  choice,
  noul,
  score,
  TypeSafeClient,
} from "@typesafe-ai/sdk";

const client = new TypeSafeClient({
  defaultModel: "jev-1.13.0",
  timeout: 8_000,
  retry: {
    maxRetries: 2,
  },
});

async function evaluateTicket() {
  const result = await client.systemOne(
    {
      state: {
        message: "My card was charged twice. Please refund one charge.",
        account: {
          refundEligible: true,
        },
      },
      questions: {
        refundIntent: noul("Is the customer asking for a refund?", {
          true: "The customer asks to reverse or return a charge",
          false: "The customer does not ask to reverse or return a charge",
        }),
        queue: choice("Which queue should handle this ticket?", {
          billing: "Charges, invoices, or refunds",
          technical: "Product behavior or errors",
          other: "None of the listed specialist queues",
        }),
        frustration: score("How frustrated is the customer?", [
          "Calm and factual",
          "Frustrated but civil",
          "Very angry or threatening",
        ] as const),
      },
    },
    {
      signal: AbortSignal.timeout(15_000),
    },
  ).withResponse();

  const shouldReviewRefund = result.data.answers.refundIntent.noul >= 0.85;

  console.log({
    model: result.data.model,
    requestId: result.requestId,
    usage: result.data.usage,
    queue: result.data.answers.queue.choice,
    queueProbabilities: result.data.answers.queue.probabilities,
    frustration: result.data.answers.frustration.score,
    shouldReviewRefund,
  });
}

try {
  await evaluateTicket();
} catch (error) {
  if (error instanceof APIError) {
    console.error({
      status: error.status,
      requestId: error.requestId,
      message: error.message,
    });
  } else if (error instanceof APIConnectionError) {
    console.error({ message: error.message });
  }
  throw error;
}
