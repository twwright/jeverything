import test from "node:test";
import assert from "node:assert/strict";
import { experimental_evaluate as evaluate } from "ai";
import { Experimental_EvaluationMockModelV4 } from "ai/test";
import { chooseAction, evaluateTicket, examplePolicy, questions } from "./triage.js";

const ticket = { id: "synthetic-1", message: "Please refund the duplicate charge.", accountVerified: true };
const model = new Experimental_EvaluationMockModelV4({
  doEvaluate: async () => ({
    answers: {
      route: { type: "choice", choice: "billing", probabilities: { billing: 0.95, technical: 0.01, review: 0.04 } },
      refundIntent: { type: "boolean", probability: 0.98 },
      currentImpact: { type: "boolean", probability: 0.02 },
      frustration: { type: "score", score: 0.3, probabilities: { "0": 0.7, "1": 0.3, "2": 0 } },
    },
    warnings: [],
    usage: { inputTokens: 300, outputTokens: 20 },
  }),
});

test("valid typed answers route according to application policy", async () => {
  const result = await evaluateTicket(ticket, model);
  assert.deepEqual(chooseAction(ticket, result, examplePolicy), { queue: "billing", reason: "evaluated-routing-policy" });
  assert.equal(result.usage.totalTokens, 320);
});

test("a confident judgment cannot bypass account verification", async () => {
  const result = await evaluateTicket(ticket, model);
  assert.equal(chooseAction({ ...ticket, accountVerified: false }, result, examplePolicy).queue, "human");
});

test("missing distributions and current impact require review", async () => {
  const result = await evaluateTicket(ticket, model);
  delete result.answers.route.probabilities;
  assert.equal(chooseAction(ticket, result, examplePolicy).queue, "human");
  result.answers.currentImpact.probability = 0.99;
  assert.equal(chooseAction(ticket, result, examplePolicy).reason, "current-impact");
});

test("threshold boundary is explicit and invalid policy is rejected", async () => {
  const result = await evaluateTicket(ticket, model);
  assert.equal(chooseAction(ticket, result, { ...examplePolicy, routeProbability: 0.95 }).queue, "billing");
  assert.equal(chooseAction(ticket, result, { ...examplePolicy, routeProbability: 0.96 }).queue, "human");
  assert.throws(() => chooseAction(ticket, result, { ...examplePolicy, routeProbability: NaN }));
});

test("core rejects an incomplete provider answer without retrying", async () => {
  let calls = 0;
  const malformed = new Experimental_EvaluationMockModelV4({ doEvaluate: async () => {
    calls += 1;
    return { answers: {}, warnings: [] };
  } });
  await assert.rejects(evaluate({ model: malformed, state: "synthetic", questions }));
  assert.equal(calls, 1);
});

test("an aborted request never calls the provider", async () => {
  let calls = 0;
  const canceled = new Experimental_EvaluationMockModelV4({ doEvaluate: async () => {
    calls += 1;
    return { answers: {}, warnings: [] };
  } });
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(evaluateTicket(ticket, canceled, controller.signal));
  assert.equal(calls, 0);
});
