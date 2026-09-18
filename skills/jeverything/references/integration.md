# Jev integration reference

Verified 2026-09-18. Recheck versions, aliases, prices, limits, and legal terms before implementing because Jev and AI SDK evaluation are changing quickly. The examples here use no real credential.

## Choose the integration boundary

| Need | Use | Model identifier | Credential |
| --- | --- | --- | --- |
| Native response contract, version pinning, direct request IDs, or official TypeSafe SDKs | TypeSafe HTTP, JavaScript SDK, or Python SDK | `jev-1.13.0`, `jev-latest`, or `jev-preview` | `TYPESAFE_API_KEY` |
| Existing Vercel AI Gateway billing, OIDC, budgets, logs, or per-request Gateway ZDR | AI SDK evaluation through Gateway | `typesafe-ai/jev` | `AI_GATEWAY_API_KEY` or supported Vercel OIDC |
| Direct TypeSafe provider through Vercel AI SDK without Gateway | `@ai-sdk/typesafe-ai` | provider-specific | `TYPESAFE_AI_API_KEY` |

Do not interchange these environment variables. Gateway evaluation is available through AI SDK's evaluation API. Vercel does not document a compatible OpenAI, Anthropic, or Cohere HTTP endpoint for evaluation calls.

Prefer a versioned native model ID when replaying an old decision or controlling an upgrade. As of the verification date, TypeSafe documents `jev-latest` and `jev-preview` as resolving to `jev-1.13.0`. Gateway documents `typesafe-ai/jev`, without a public version-pinned Gateway ID. A Gateway result's `modelId` may echo the requested Gateway ID and does not prove which native Jev build served it.

## Native HTTP

Send `POST https://api.typesafe.ai/v1/systemone`. Keep credentials on the server.

```sh
curl https://api.typesafe.ai/v1/systemone \
  -H "Authorization: Bearer $TYPESAFE_API_KEY" \
  -H "Content-Type: application/json" \
  --data '{
    "model": "jev-1.13.0",
    "state": {
      "message": "My card was charged twice. Please refund one charge.",
      "account": { "refundEligible": true }
    },
    "questions": {
      "refund_intent": {
        "type": "noul",
        "instructions": "Is the customer asking for a refund?",
        "criteria": {
          "true": "The customer asks to reverse or return a charge",
          "false": "The customer does not ask to reverse or return a charge"
        }
      },
      "queue": {
        "type": "choice",
        "instructions": "Which queue should handle this ticket?",
        "criteria": {
          "billing": "Charges, invoices, or refunds",
          "technical": "Product behavior or errors",
          "other": "None of the listed specialist queues"
        }
      },
      "frustration": {
        "type": "score",
        "instructions": "How frustrated is the customer?",
        "criteria": [
          "Calm and factual",
          "Frustrated but civil",
          "Very angry or threatening"
        ]
      }
    }
  }'
```

The response has `model`, `answers`, and `usage`. A Noul answer returns `noul`, a probability-like value from 0 to 1, without a separate confidence field. Choice returns `choice`, `probabilities`, and `confidence`. Score returns a probability-weighted `score`, `legend`, `probabilities`, and `confidence`. The application still owns thresholds, authorization, deterministic checks, side effects, fallback, and human review.

Use `GET https://api.typesafe.ai/v1/models` with the same bearer credential to inspect models available to the account. Record the requested model, returned model, question-definition version, application policy version, safe state hash, request ID, latency, and usage. Do not log raw sensitive state or entire response bodies by default.

## Native JavaScript and TypeScript

Use `@typesafe-ai/sdk@0.6.0` with Node 20 or newer. A complete typechecked example is in [`examples/native/javascript/evaluate-ticket.ts`](https://github.com/twwright/jeverything/blob/master/examples/native/javascript/evaluate-ticket.ts).

```ts
import { choice, noul, score, TypeSafeClient } from "@typesafe-ai/sdk";

const client = new TypeSafeClient({
  defaultModel: "jev-1.13.0",
  timeout: 8_000,
  retry: { maxRetries: 2 },
});

const { data, requestId } = await client.systemOne(
  {
    state: { message: "Please refund the duplicate charge." },
    questions: {
      refundIntent: noul("Is the customer asking for a refund?"),
      queue: choice("Which queue should handle this?", {
        billing: "Charges, invoices, or refunds",
        technical: "Product behavior or errors",
        other: "None of the listed queues",
      }),
      frustration: score("How frustrated is the customer?", [
        "Calm",
        "Frustrated",
        "Very angry",
      ] as const),
    },
  },
  { signal: AbortSignal.timeout(15_000) },
).withResponse();

console.log(data.model, requestId, data.answers.refundIntent.noul);
```

SDK behavior observed in the pinned 0.6.0 source:

- Default model is `jev-latest`; the example pins `jev-1.13.0`
- Default timeout is 10 seconds per attempt and includes reading the response body
- Default retry policy makes up to three attempts: the first call plus two retries
- Retryable cases are 408, 429, all 5xx responses, connection errors, and timeouts
- Backoff begins at 500 ms, doubles to a 5 second cap, and subtracts up to 25% jitter
- `retry-after-ms` takes precedence over `Retry-After`; server delays above 60 seconds are ignored in favor of local backoff
- There is no total retry-time budget. Use an outer `AbortSignal` when the workflow has a deadline
- `.withResponse()` exposes parsed data, the final `Response`, and `x-typesafe-request-id`
- The SDK blocks browser use by default because a browser would expose the API key. Do not use `dangerouslyAllowBrowser` in a production web client
- Successful response bodies are TypeScript-cast rather than runtime-validated
- Debug logs include request and response bodies. Header redaction does not make body logging safe

Catch `APIError` to inspect `status` and `requestId`. More specific subclasses cover 400, 401, 403, 404, 422, 429, and all 5xx responses. `APIConnectionError`, `APITimeoutError`, and `APIUserAbortError` separate transport failure, timeout, and caller cancellation.

## Native Python

Use `typesafe-sdk==0.7.0`. A complete checked example is in [`examples/native/python/evaluate_ticket.py`](https://github.com/twwright/jeverything/blob/master/examples/native/python/evaluate_ticket.py).

```python
from typesafe_sdk import Choice, Noul, RetryPolicy, TypeSafeClient

with TypeSafeClient(
    model="jev-1.13.0",
    timeout=8.0,
    retry=RetryPolicy(max_retries=2, timeout=20.0),
) as client:
    result = client.system_one(
        state={"message": "Please refund the duplicate charge."},
        questions={
            "refund_intent": Noul(
                instructions="Is the customer asking for a refund?"
            ),
            "queue": Choice(
                instructions="Which queue should handle this?",
                criteria={
                    "billing": "Charges, invoices, or refunds",
                    "technical": "Product behavior or errors",
                    "other": "None of the listed queues",
                },
            ),
        },
    )
    print(result.model, result.request_id, result.nouls["refund_intent"].noul)
```

`AsyncTypeSafeClient` has the matching async interface. Close either client with its context manager. SDK behavior observed in the pinned 0.7.0 source:

- The per-operation timeout defaults to 10 seconds
- Retryable conditions and initial backoff match the JavaScript SDK
- Python adds a 30 second total retry budget by default. It does not have JavaScript's explicit 60 second `Retry-After` cap; it skips a retry whose delay would reach or exceed the budget
- Per-call `retry=` replaces the client policy
- Parsed responses are strict, immutable Pydantic models. Invalid successful payloads raise `TypeSafeAPIResponseValidationError`
- `result.nouls`, `result.choices`, and `result.scores` are typed filtered views
- `result.request_id` comes from `x-typesafe-request-id` and raises if the header is absent
- Python has no `AbortSignal`; async cancellation and HTTPX timeout behavior provide cancellation boundaries
- Debug logging includes bodies, so use the same safe-logging policy as JavaScript

Catch `TypeSafeAPIError` for HTTP failures and inspect its status and request ID. Specific subclasses cover 400, 401, 403, 404, 422, 429, and all 5xx responses. `TypeSafeAPIConnectionError`, `TypeSafeAPITimeoutError`, and `TypeSafeAPIResponseValidationError` identify transport, timeout, and response-contract failures.

## Vercel AI Gateway

Use AI SDK 7.0.105 or newer and `experimental_evaluate`. At verification, the public registries reported `ai@7.0.106`, `@ai-sdk/gateway@4.0.86`, and `@ai-sdk/typesafe-ai@3.0.3`. Pin an exact AI SDK version while this API is experimental. The public catalog, launch announcement, and evaluation documentation use `typesafe-ai/jev`.

```ts
import { experimental_evaluate as evaluate, gateway } from "ai";

const result = await evaluate({
  model: gateway.evaluationModel("typesafe-ai/jev"),
  state: { message: "Please refund the duplicate charge." },
  questions: {
    refundIntent: {
      type: "boolean",
      instructions: "Is the customer asking for a refund?",
      criteria: {
        true: "The customer requests a charge reversal",
        false: "No charge reversal is requested",
      },
    },
    queue: {
      type: "choice",
      instructions: "Which queue should handle this?",
      criteria: {
        billing: "Charges, invoices, or refunds",
        technical: "Product behavior or errors",
        other: "None of the listed queues",
      },
    },
  },
  providerOptions: {
    gateway: { zeroDataRetention: true },
  },
  abortSignal: AbortSignal.timeout(15_000),
});

console.log(result.answers.refundIntent.probability);
console.log(result.answers.queue.probabilities);
console.log(result.providerMetadata?.typesafe?.confidence);
```

Verify the installed AI SDK signature before copying the cancellation property: the inspected implementation accepts an `abortSignal`, and experimental patch releases can change. Gateway's normalized interface differs from native TypeSafe:

| Concept | Native TypeSafe | Gateway AI SDK |
| --- | --- | --- |
| Yes/no question | `type: "noul"` | `type: "boolean"` |
| Yes/no answer | `noul` | `probability` |
| Choice/Score confidence | On each answer | `providerMetadata.typesafe.confidence`, keyed by question ID |
| Usage | `input_tokens`, `output_tokens` | `inputTokens`, `outputTokens`, `totalTokens` |
| Model evidence | Response can expose resolved native ID | `modelId` may only echo `typesafe-ai/jev` |

AI SDK core validates inputs and output consistency. For example, a Choice distribution must cover its options, select a maximum-probability option, and sum to one within tolerance. Structural output validation happens after the retry wrapper, so invalid returned data is not automatically retried.

AI SDK core defaults to two retries, starts exponential backoff at 2 seconds, and doubles it. It respects `Retry-After-MS` before `Retry-After`. Abort errors are not retried. The inspected evaluation API has no dedicated timeout option; pass an abort signal. Do not describe native SDK retry defaults as Gateway defaults.

Gateway errors include local `InvalidArgumentError`, returned-data `InvalidResponseDataError`, `Experimental_EvaluationUnsupportedQuestionTypeError`, and provider/model resolution errors such as `NoSuchProviderError`, `NoSuchModelError`, and `UnsupportedModelVersionError`.

## Limits and pricing

Current native model documentation lists:

- `jev-1.13.0`
- 64,000 tokens across state and all questions
- 32,000 tokens across state and the longest single question
- 250,000 tokens per second and 1,200 requests per minute, subject to change and account limits
- Text input only; images, audio, video, and documents require preprocessing
- $0.042 per million input tokens and no output-token charge

The live Gateway catalog reports `0.000000042` USD per input token, which is also $0.042 per million. Its model page rounds the display to $0.04 per million. Catalog values `context_window: 0` and `max_tokens: 0` do not establish a zero-token limit for an evaluation model; use TypeSafe's native limits until Gateway documents a different one.

## Privacy and data handling

TypeSafe says it does not train or fine-tune models on customer input. Its public privacy policy gives purpose-based retention language but no fixed ordinary-account retention duration. Native zero-data-retention terms are offered to enterprise customers by arrangement. TypeSafe says the hosted API runs in the United States. Confirm the governing agreement and current account terms before sending regulated or sensitive state.

Gateway's catalog marks Jev as supporting ZDR and no training. `providerOptions.gateway.zeroDataRetention: true` requests the Gateway's per-request ZDR route. Vercel documents this for Pro and Enterprise and says a request fails when no compliant provider is available. This does not prevent the application, its telemetry, or custom Gateway reporting from retaining sensitive data. Review each logging boundary separately.

The current TypeSafe Master Customer Agreement, section 2.3, applies restrictions to the customer, its applications, and users. Among them, it prohibits using the Services or Output to "perform model distillation" or develop a similar or competing product, and prohibits "publish benchmarks or performance information about the Services." The clause's scope is publication; it does not say that every internal evaluation is prohibited. Attribute existing vendor claims, and obtain contract or legal confirmation before publishing original Jev benchmark or performance results.

## Contract conflicts to handle conservatively

The live documentation, OpenAPI schema, and SDKs disagree at several edges. Do not rely on the most permissive version:

- API prose says `instructions` is required, while OpenAPI and SDK types allow it to be absent or null. Always provide explicit instructions
- API prose and JavaScript require two or more Score levels, while OpenAPI and Python accept one. Always provide at least two ordered levels
- JavaScript types allow top-level null state, while live OpenAPI rejects null. Never send null state
- Live OpenAPI does not require two Choice options, while the comparison adapter does. Use at least two and cover `other`, `unknown`, or `review` when the workflow needs them
- Some API examples show a response model alias, while model documentation says responses identify the resolved version. Treat the actual returned field as evidence and log it
- One AI SDK documentation example has used `typesafe-ai/jev-latest`; the current Gateway catalog, announcement, and evaluation page use `typesafe-ai/jev`. Prefer the catalog ID and verify it at implementation time
- An unauthenticated observed `GET /v1/models` returned 403, while the API reference describes 401 for invalid or missing credentials. Handle both as authentication/permission failures

## Production policy

1. Keep all credentials server-side
2. Pin native models for controlled releases and evaluate aliases before upgrading
3. Give every workflow an outer deadline; count retries when calculating latency and capacity
4. Retry only transport, throttling, overload, and documented transient server failures
5. Honor `Retry-After`, add jitter, and prevent retries across layers from multiplying load
6. Keep deterministic authorization and side-effect rules in application code
7. Route low-confidence or missing-evidence cases to clarification, fallback, or human review
8. Log model and question versions, thresholds, request ID, safe state hash, usage, latency, answer distributions, and final application action
9. Distinguish API failure, response-contract failure, semantic error, policy error, and downstream action error
10. Evaluate threshold performance against labeled workflow data; a confidence number is not whole-workflow correctness

## Current primary sources

- [TypeSafe API reference](https://docs.typesafe.ai/api.md)
- [TypeSafe live OpenAPI](https://api.typesafe.ai/openapi.json)
- [TypeSafe models](https://docs.typesafe.ai/models.md)
- [TypeSafe JavaScript SDK docs](https://docs.typesafe.ai/sdk/javascript.md)
- [TypeSafe JavaScript SDK 0.6.0 client source](https://github.com/typesafe-ai/typesafe-sdk-js/blob/66880ccded6cb642dc1809620c2b108c33730214/src/client.ts)
- [TypeSafe JavaScript SDK 0.6.0 retry source](https://github.com/typesafe-ai/typesafe-sdk-js/blob/66880ccded6cb642dc1809620c2b108c33730214/src/retry.ts)
- [TypeSafe Python SDK docs](https://docs.typesafe.ai/sdk/python.md)
- [TypeSafe Python SDK 0.7.0 sync client source](https://github.com/typesafe-ai/typesafe-sdk-python/blob/2ce5c65f13646cab6e6f782328194c9d85f3300a/src/typesafe_sdk/_core/client/sync/client.py)
- [TypeSafe Python SDK 0.7.0 retry source](https://github.com/typesafe-ai/typesafe-sdk-python/blob/2ce5c65f13646cab6e6f782328194c9d85f3300a/src/typesafe_sdk/_core/retry.py)
- [Vercel AI Gateway evaluation](https://vercel.com/docs/ai-gateway/modalities/evaluation)
- [Vercel Jev launch announcement](https://vercel.com/changelog/typesafe-ai-jev-now-available-on-ai-gateway)
- [Vercel Gateway live model catalog](https://ai-gateway.vercel.sh/v1/models)
- [AI SDK evaluation source at inspected commit](https://github.com/vercel/ai/blob/9528712c364c6cb46caf97b901bb742d0c623cd7/packages/ai/src/evaluate/evaluate.ts)
- [AI SDK Gateway evaluation provider at inspected commit](https://github.com/vercel/ai/blob/9528712c364c6cb46caf97b901bb742d0c623cd7/packages/gateway/src/gateway-evaluation-model.ts)
- [TypeSafe Privacy Policy](https://typesafe.ai/legal/privacy-policy)
- [TypeSafe Data Processing Addendum](https://typesafe.ai/legal/data-processing)
- [TypeSafe Master Customer Agreement](https://typesafe.ai/legal/mca)
