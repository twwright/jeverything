# Jev API, SDK, adapter, and Gateway research

Retrieved: 2026-09-18 (America/New_York)

This note covers TypeSafe's direct HTTP API, the official JavaScript/TypeScript and Python SDKs, TypeSafe's System One LLM adapter, current model aliases and operating limits, and the distinct Vercel AI Gateway integration. No paid Jev or third-party model calls were made. Source-code observations are pinned to repository commits. Live contract claims are labeled so later course material can distinguish a documented promise from an implementation detail or an observation.

## Claim labels

- `current`: verified against a live first-party page, registry, endpoint, or current repository on 2026-09-18
- `public-contract`: stated in current official documentation or the live OpenAPI document
- `observed`: directly reproduced without a paid inference call
- `implementation-observed`: read from current source; useful for behavior and diagnostics but not necessarily a stable public promise
- `historical`: previous behavior documented by a migration guide or changelog
- `inferred`: conclusion from multiple sources, clearly separated from a promise
- `unknown`: not established by the public evidence reviewed

## Executive findings

- `current`, `public-contract`: The direct TypeSafe evaluation endpoint is `POST https://api.typesafe.ai/v1/systemone`. Authentication is `Authorization: Bearer <API_KEY>`. `GET https://api.typesafe.ai/v1/models` lists model aliases available to the authenticated account
- `current`, `public-contract`: The current versioned model is `jev-1.13.0`. Both `jev-latest` and `jev-preview` resolve to it. There is no separate preview build at retrieval time. SDKs default to `jev-latest`
- `current`, `public-contract`: Native pricing is $42 per billion input tokens, equivalently $0.042 per million. Output tokens are free. The Vercel public catalog exposes the exact same input price as `0.000000042` dollars per token; its webpage rounds that to `$0.04/M`
- `current`, `public-contract`: Direct TypeSafe limits are 250,000 tokens per second and 1,200 requests per minute. TypeSafe explicitly says these limits are dynamic and can change without notice. Higher limits are available on custom and enterprise plans
- `current`, `public-contract`: Jev 1.13 has a 64k-token request budget across `state` plus all questions and a separate 32k-token limit for `state` plus the single longest question. The model ingests state once and evaluates questions in parallel
- `current`, `public-contract`: Input is text. Top-level state may be a string, JSON object, or JSON array. Structured values preserve relationships, but image, audio, video, and binary inputs must be preprocessed into text or structured fields
- `current`, `public-contract`: English is the primary and best-supported language. Other languages, including CJK scripts, are accepted but are not equally accurate and need workload-specific evaluation
- `current`: Official JavaScript SDK is `@typesafe-ai/sdk@0.6.0`, requiring Node.js 20 or newer. Source/tag SHA: `66880ccded6cb642dc1809620c2b108c33730214`
- `current`: Official Python SDK is `typesafe-sdk==0.7.0`, requiring Python 3.10 or newer. Source/tag SHA: `2ce5c65f13646cab6e6f782328194c9d85f3300a`
- `current`: Official LLM comparison adapter is `system-one-adapter==0.2.0`, requiring Python 3.10 or newer and `typesafe-sdk>=0.7.0`. Source/tag SHA: `adffc2eab300a4fa3c0e92252d4ffd6ceaa53700`
- `current`, `public-contract`: Vercel AI Gateway exposes Jev as the evaluation model `typesafe-ai/jev` through AI SDK 7's experimental `evaluate` API. It is not available through Gateway's OpenAI-compatible, Anthropic-compatible, Cohere-compatible, or general REST generation endpoints
- `current`, `public-contract`: AI SDK support begins at `ai@7.0.105`. The current npm release at retrieval time was `ai@7.0.106`, requiring Node.js 22 or newer
- `current`, `public-contract`: Gateway uses question type `boolean` and returns `{ type: "boolean", probability }`, while TypeSafe's native API/SDK uses `noul` and returns `{ type: "noul", noul }`. Gateway omits Choice/Score confidence from the answer objects and puts it in `result.providerMetadata.typesafe.confidence`

## Which integration to choose

For a TypeScript application already using Vercel AI Gateway, prefer AI SDK `experimental_evaluate` with `typesafe-ai/jev`. This follows the user's stated preference and gives unified Gateway authentication, budgets, logs, usage, reporting, and per-request policy controls. It is a distinct API surface, so native TypeSafe request and response code cannot simply be pointed at a Gateway base URL.

Use the direct TypeSafe JavaScript SDK when the application needs the native `noul` terminology, native SDK retry controls, raw HTTP response access, or direct TypeSafe account limits. Use the direct Python SDK for Python services; Gateway's Jev evaluation interface is documented as AI SDK-only, so Python code currently has no documented Gateway evaluation path.

Use TypeSafe's System One adapter for controlled comparisons between Jev and ordinary LLMs. It does not call Jev and does not prove parity. It translates the same question shapes into prompts and provider JSON schemas, then computes TypeSafe-shaped answers locally. It is an evaluation instrument, not a Jev substitute with identical semantics.

## Direct HTTP API contract

### Request

`public-contract` request shape:

```json
{
  "state": {
    "ticket": "My card was charged twice.",
    "account": { "plan": "pro", "refundEligible": true }
  },
  "model": "jev-1.13.0",
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
      "criteria": ["Calm", "Frustrated", "Very angry"]
    }
  }
}
```

- `state`: required. Live OpenAPI accepts a string, object, or array. Objects and arrays can contain nested JSON values. The model page describes the semantic input as text and warns that non-text modalities require preprocessing
- `model`: required by HTTP. Use an alias for automatic upgrades or a versioned ID for controlled reproducibility
- `questions`: required, nonempty map. Keys are caller-owned identifiers. TypeSafe states that these keys are not sent to the model and do not affect inference
- Questions are independent over the same state. One question cannot consume another answer in the same request
- `instructions`: string, object, array, or null according to live OpenAPI and SDK types. Structured instructions are supported
- Noul `criteria`: optional object with optional `true` and `false` descriptions
- Choice `criteria`: map from exact label to string/object/array/null description
- Score `criteria`: ordered list. The array position is the score, starting at zero

### Response

`public-contract` response shape:

```json
{
  "model": "jev-1.13.0",
  "answers": {
    "refund_intent": { "type": "noul", "noul": 0.93 },
    "queue": {
      "type": "choice",
      "choice": "billing",
      "probabilities": { "billing": 0.96, "technical": 0.02, "other": 0.02 },
      "confidence": 0.94
    },
    "frustration": {
      "type": "score",
      "score": 1.2,
      "legend": { "0": "Calm", "1": "Frustrated", "2": "Very angry" },
      "probabilities": { "0": 0.1, "1": 0.6, "2": 0.3 },
      "confidence": 0.61
    }
  },
  "usage": { "input_tokens": 312, "output_tokens": 48 }
}
```

- `model` reports the model that answered. The model docs say this is the resolved versioned ID when an alias is requested. Log it with the question version and policy version
- Noul returns only `noul`, the probability of yes/true. It has no separate confidence field
- Choice returns the highest-probability `choice`, all option probabilities, and confidence derived from the distribution
- Score returns a probability-weighted expected `score`, a `legend`, a probability per rung, and confidence derived from the distribution. The expected score may be between integer levels
- `usage.input_tokens` is billable. `usage.output_tokens` is reported but currently free

### Errors and request IDs

`public-contract` documentation names:

- `401 Unauthorized`: missing or invalid API key
- `422 Unprocessable Entity`: request validation failure with a body that identifies the offending field
- `429 Too Many Requests`: rate limit exceeded
- `529 Overloaded`: temporary overload

The official SDKs additionally classify 400, 403, 404, all 5xx responses, connection failures, and timeouts. Both SDKs read `x-typesafe-request-id`. Preserve this ID in incident logs.

`observed`: an unauthenticated `GET /v1/models` returned HTTP 403 on 2026-09-18, not the 401 stated in the API prose. The JSON was:

```json
{
  "detail": {
    "error_type": "authentication_error",
    "message": "Must supply an API key! Check your request and try again."
  }
}
```

It also returned `x-typesafe-request-id`. Production code should classify by SDK exception or by status families and structured error body rather than assuming every authentication failure is 401.

### Current contract inconsistencies

These should become validation rules in `/jeverything`, with the conservative behavior favored:

- `current`, `public-contract conflict`: API prose marks `instructions` required, while live OpenAPI and both SDKs allow omission/null. Always provide explicit instructions. This is better question design and avoids dependence on an ambiguous contract edge
- `current`, `public-contract conflict`: API prose and JavaScript SDK require at least two Score criteria. Live OpenAPI declares `minItems: 1`, and Python SDK 0.7.0 only rejects an empty Score list. Always require at least two Score levels because a one-rung ordered rubric is not a meaningful judgment
- `current`, `implementation-observed`: JavaScript's `EntryType` includes top-level `null`, so TypeScript permits `state: null`; the live HTTP OpenAPI excludes null state. Do not send null state
- `current`, `implementation-observed`: Live OpenAPI does not declare a minimum Choice option count. The adapter requires at least two. `/jeverything` should require at least two and encourage a complete answer space
- `current`, `public-contract conflict`: API examples sometimes show the response model as `jev-latest`, while the Models page says the response reports the resolved versioned ID. Treat the actual returned value as authoritative and log it

## Models, aliases, price, and limits

### Current values

| Item | Current value | Claim status |
| --- | --- | --- |
| Stable alias | `jev-latest` -> `jev-1.13.0` | `current`, `public-contract` |
| Preview alias | `jev-preview` -> `jev-1.13.0` | `current`, `public-contract` |
| Versioned ID | `jev-1.13.0` | `current`, `public-contract` |
| Direct input price | $42/B tokens; $0.042/M tokens | `current`, `public-contract` |
| Direct output price | Free | `current`, `public-contract` |
| Direct rate limits | 250,000 tokens/s and 1,200 requests/min | `current`, `public-contract`, dynamic |
| Request context | 64k state + all questions | `current`, `public-contract` |
| Per-question context | 32k state + longest question | `current`, `public-contract` |
| Input modality | Text only; string/object/array containers | `current`, `public-contract` |
| Best-supported language | English | `current`, `public-contract` |

Pin `jev-1.13.0` for a production policy whose thresholds were measured against that version. Use `jev-latest` for development or when automatic upgrades are intentional. Before moving a pin, replay a labeled set, compare accuracy/calibration and policy actions, canary the new version, and retain a rollback path. Replaying an old request through a moved alias is not a reproduction of the original model call.

`unknown`: The authenticated `GET /v1/models` response was not called because no TypeSafe credential was used. Official docs say it currently lists aliases, not versioned IDs, even though versioned IDs are accepted. Release dates and descriptions available to this specific account were therefore not observed.

## JavaScript and TypeScript SDK 0.6.0

### Installation and surface

```sh
npm install @typesafe-ai/sdk
```

```ts
import { choice, noul, score, TypeSafeClient } from "@typesafe-ai/sdk";

const client = new TypeSafeClient({
  defaultModel: "jev-1.13.0",
  timeout: 10_000,
});

const request = client.systemOne({
  state: { message: "I was charged twice. Please refund one charge." },
  questions: {
    refundIntent: noul("Is the customer asking for a refund?"),
    queue: choice("Which queue should handle this?", {
      billing: "Charges, invoices, refunds",
      technical: "Product failures",
      other: "None of the listed queues",
    }),
    frustration: score("How frustrated is the customer?", [
      "Calm",
      "Frustrated",
      "Very angry",
    ] as const),
  },
});

const { data, requestId, response } = await request.withResponse();
console.log(data.answers.queue.choice, requestId, response.status);
```

`implementation-observed` behavior:

- Package ships ESM, CommonJS, and declarations. Question keys and Choice criteria keys flow into inferred answer types. A fixed Score tuple infers its score keys
- Defaults: base URL `https://api.typesafe.ai`, model `jev-latest`, API key from `TYPESAFE_API_KEY`, base URL override from `TYPESAFE_BASE_URL`, model override from `TYPESAFE_DEFAULT_MODEL`, log level from `TYPESAFE_LOG_LEVEL`
- `systemOne(request, options)` returns an `APIPromise`. Await it for parsed data; `.withResponse()` returns `{ data, response, requestId }`; `.asResponse()` returns the buffered raw `Response`. Do not both take `.asResponse()` and expect the same body to remain usable through parsing
- Caller cancellation uses `RequestOptions.signal: AbortSignal`. Cancellation also stops pending retry waits and raises `APIUserAbortError`
- Timeout is per attempt, defaults to 10,000ms, and covers receiving the full response body. There is no total retry budget
- The SDK rejects browser execution by default because it would expose the API key. `dangerouslyAllowBrowser: true` bypasses the guard and should not be used for production web clients
- Browser, Node, Deno, Bun, Vercel Edge, and Cloudflare runtime identifiers are added to `X-TypeSafe-Runtime`; package support is formally declared as Node >=20
- Protected headers are set after user headers, so callers cannot replace Authorization, content type, SDK metadata, or retry count
- Default log level is `warn`. `info` logs request summaries. `debug` logs headers and request/response bodies. Known credential headers and cookies are redacted, but bodies are not. Do not enable debug logging around sensitive state without a separate safe-logging policy
- The client parses JSON leniently and TypeScript-casts it to the expected result. It does not runtime-validate successful response fields. A malformed successful payload may surface as bad data rather than a dedicated response-validation exception

### Retry behavior

Defaults:

```ts
{
  maxRetries: 2,
  backoffInitialMs: 500,
  backoffMaxMs: 5000,
  backoffJitter: 0.25,
  httpStatuses: new Set([408, 429, ...allStatusesFrom500Through599]),
  respectRetryAfter: true,
  maxRetryAfterMs: 60000,
  apiConnectionError: true,
  apiTimeoutError: true
}
```

- Two retries means up to three attempts
- Backoff doubles from 500ms up to 5s. Jitter subtracts up to 25% of the computed delay
- `retry-after-ms` takes precedence over `Retry-After`. `Retry-After` may be seconds or an HTTP date
- A server-requested delay above 60s is ignored and local exponential backoff is used
- `X-TypeSafe-Retry-Count` is attached to retry attempts
- Because there is no total budget, worst-case wall time must include three per-attempt timeouts plus retry delays. Use an outer application deadline when a workflow has a strict SLO

### Errors

- `TypeSafeError`: SDK configuration or local validation
- `APIError`: generic non-2xx with status, headers, parsed/text body, and optional request ID
- `BadRequestError` (400)
- `AuthenticationError` (401)
- `PermissionDeniedError` (403)
- `NotFoundError` (404)
- `UnprocessableEntityError` (422)
- `RateLimitError` (429), with parsed `retryAfterMs`
- `InternalServerError` (all 5xx, including 529)
- `APIConnectionError`: DNS/TLS/connection/body-delivery failures
- `APITimeoutError`: timeout; subclass of connection error
- `APIUserAbortError`: caller cancellation

## Python SDK 0.7.0

### Installation and surface

```sh
pip install typesafe-sdk
```

Synchronous:

```python
from typesafe_sdk import Choice, Noul, Score, TypeSafeClient

with TypeSafeClient(model="jev-1.13.0") as client:
    result = client.system_one(
        state={"message": "I was charged twice. Please refund one charge."},
        questions={
            "refund_intent": Noul(instructions="Is the customer asking for a refund?"),
            "queue": Choice(
                instructions="Which queue should handle this?",
                criteria={
                    "billing": "Charges, invoices, refunds",
                    "technical": "Product failures",
                    "other": "None of the listed queues",
                },
            ),
            "frustration": Score(
                instructions="How frustrated is the customer?",
                criteria=["Calm", "Frustrated", "Very angry"],
            ),
        },
    )
    print(result.nouls["refund_intent"].noul)
    print(result.choices["queue"].choice)
    print(result.request_id)
```

Asynchronous:

```python
from typesafe_sdk import AsyncTypeSafeClient, Noul

async with AsyncTypeSafeClient(model="jev-1.13.0") as client:
    result = await client.system_one(
        state="Please refund the duplicate charge.",
        questions={"refund_intent": Noul(instructions="Is a refund requested?")},
    )
```

`implementation-observed` behavior:

- `TypeSafeClient` and `AsyncTypeSafeClient` have matching APIs. Use context managers or explicitly `close()` / `await aclose()`; closing also closes a caller-supplied HTTP client
- Defaults mirror JavaScript for API key, base URL, model, and 10-second per-operation timeout
- Question inputs can be Pydantic-backed `Noul`, `Choice`, and `Score` objects or raw dictionaries
- Responses are immutable strict Pydantic models. Invalid successful responses raise `TypeSafeAPIResponseValidationError` with `field_path`
- `result.answers` contains all recognized answers. `result.nouls`, `.choices`, and `.scores` are typed filtered views
- Score legend and probability JSON keys are converted to integer Python keys
- Unknown future answer types are warned about and omitted from parsed `answers`; the raw body remains available as `result.raw_http_response`
- `result.request_id` reads `x-typesafe-request-id` and raises if the header was absent
- `system_one(..., response_model=MyPydanticModel)` validates the full response against a custom model. This was added in 0.7.0
- `extra_headers` and `extra_body` exist as extension seams. `extra_body` is shallow, last-write-wins, and can override `state`, `model`, or `questions`; treat that as advanced behavior and review uses carefully
- Python has no JavaScript-style `AbortSignal`. Async task cancellation and HTTPX timeout/cancellation behavior are the practical cancellation mechanisms
- Debug logging redacts known secret headers but not request or response bodies

### Retry behavior

Defaults:

```python
RetryPolicy(
    max_retries=2,
    backoff_initial=0.5,
    backoff_max=5.0,
    backoff_jitter=0.25,
    http_statuses={408, 429, *range(500, 600)},
    respect_retry_after=True,
    api_connection_error=True,
    api_timeout_error=True,
    exceptions=set(),
    predicate=None,
    timeout=30.0,
)
```

- Like JavaScript, two retries means up to three attempts and uses subtractive jitter
- It honors `retry-after-ms`, numeric/date `Retry-After`, connection errors, and timeouts
- Unlike JavaScript, there is no explicit maximum accepted `Retry-After`; the 30-second total retry budget stops before a retry whose delay would reach or exceed the budget
- The retry budget determines whether another attempt begins; per-operation HTTP timeouts still govern the active request
- Per-call `retry=` replaces the client's policy for that call

### Errors

Python exposes the TypeSafe-prefixed equivalents of the JavaScript hierarchy:

- `TypeSafeError`
- `TypeSafeAPIError`
- `TypeSafeBadRequestError` (400)
- `TypeSafeAuthenticationError` (401)
- `TypeSafePermissionDeniedError` (403)
- `TypeSafeNotFoundError` (404)
- `TypeSafeUnprocessableEntityError` (422)
- `TypeSafeRateLimitError` (429), with `retry_after_ms`
- `TypeSafeInternalServerError` (all 5xx)
- `TypeSafeAPIConnectionError`
- `TypeSafeAPITimeoutError`
- `TypeSafeAPIResponseValidationError`

## Vercel AI Gateway interface

### Contract and naming differences

`current`, `public-contract`:

```ts
import { experimental_evaluate as evaluate } from "ai";

const result = await evaluate({
  model: "typesafe-ai/jev",
  state: {
    message: "My card was charged twice. Please refund one charge.",
  },
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
        billing: "Charges, invoices, refunds",
        technical: "Product failures",
        other: "None of the listed queues",
      },
    },
    frustration: {
      type: "score",
      instructions: "How frustrated is the customer?",
      criteria: ["Calm", "Frustrated", "Very angry"],
    },
  },
  providerOptions: {
    gateway: {
      zeroDataRetention: true,
    },
  },
});

console.log(result.answers.refundIntent.probability);
console.log(result.answers.queue.probabilities);
console.log(result.providerMetadata?.typesafe?.confidence);
```

Mapping from native TypeSafe to Gateway AI SDK:

| Concept | Native TypeSafe | Gateway AI SDK |
| --- | --- | --- |
| Model | `jev-latest` / `jev-1.13.0` | `typesafe-ai/jev` |
| Yes/no type | `noul` | `boolean` |
| Yes/no value | `answer.noul` | `answer.probability` |
| Choice confidence | `answer.confidence` | `providerMetadata.typesafe.confidence` |
| Score confidence | `answer.confidence` | `providerMetadata.typesafe.confidence` |
| Direct endpoint | `/v1/systemone` | AI SDK evaluation transport only |
| Credential | `TYPESAFE_API_KEY` | Gateway credential/environment |

The Gateway provider instance form is `gateway.evaluationModel("typesafe-ai/jev")`. Evaluation accepts several typed questions over one string/object/array state. Gateway reports `{ inputTokens, outputTokens }` usage and bills by the model's token rates.

`observed`: The live public Gateway model endpoint returned:

```json
{
  "id": "typesafe-ai/jev",
  "type": "evaluation",
  "zdr": "all",
  "no_training": "all",
  "supported_specifications": ["v4"],
  "context_window": 0,
  "max_tokens": 0,
  "pricing": { "input": "0.000000042", "output": "0" }
}
```

`inferred`: `context_window: 0` and `max_tokens: 0` are missing/not-represented sentinels for this non-generative model, not literal zero-token limits. Use TypeSafe's 64k/32k documentation as the current limit source.

### Gateway privacy controls

- `current`, `public-contract`: Jev is marked ZDR and no-training capable in the live Gateway model API
- `current`, `public-contract`: `providerOptions.gateway.zeroDataRetention: true` enforces per-request ZDR. ZDR is available to Pro and Enterprise users and per-request ZDR has no added charge
- `current`, `public-contract`: If no compliant provider exists, Gateway fails with 400 `no_providers_available`; it does not silently route to a non-ZDR provider
- `current`, `public-contract`: ZDR also implies prompt-training disallowance. Gateway says it does not retain prompts, outputs, or sensitive data under ZDR and deletes user data after completion
- `current`, `public-contract`: Evaluation calls appear in Gateway logs and custom reporting, count toward budgets, and accept Gateway provider options. Build a logging policy that does not retain sensitive state merely because provider inference is ZDR

## TypeSafe System One adapter 0.2.0

The adapter is a TypeSafe-authored comparison tool that presents a `system_one`-like Python interface backed by OpenAI or Anthropic LLM APIs.

### What it can compare

It lets the same state and TypeSafe question objects drive four broad configurations:

- native provider structured output vs prompt-and-validate JSON
- probability distributions vs one discrete answer per question
- OpenAI/compatible APIs vs native Anthropic Messages
- normalization enabled vs preserving invalid probability sums for diagnostics

Basic shape:

```python
from system_one_adapter import SystemOneAdapterClient, Noul

with SystemOneAdapterClient(
    structured_outputs=True,
    llm_answer_mode="probabilities",
    normalize_probabilities=True,
    n_retry_malformed_structure=1,
) as client:
    result = client.system_one(
        state="This book was a delight to read.",
        questions={"positive": Noul(instructions="The review is positive.")},
        provider="openai",
        model="gpt-4o-mini",
    )
```

### Provider behavior

- OpenAI proper defaults to the Responses API. Other OpenAI-compatible base URLs default to Chat Completions. Callers may force `api="responses"` or `api="chat_completions"`
- OpenAI Responses requests set `store=False`. Structured mode uses strict JSON Schema. Prompted mode uses JSON object mode and includes the schema in the prompt
- Native Anthropic uses `output_config.format` JSON Schema. It defaults to 4,096 maximum output tokens; truncation raises a `TypeSafeError` and does not consume malformed-structure retries
- Provider SDK retries are disabled so the adapter's retry policy owns retries
- Providers created by the adapter are cached by `(provider, model)` and closed with the adapter. Injected provider instances remain caller-owned

### Semantics and diagnostics

- The system prompt says to use only the supplied document, treat the document as untrusted, ignore instructions inside it, and return every requested answer
- State is JSON-serialized inside `<document>` tags with `<` and `>` escaped. This is a mitigation, not proof of adversarial robustness
- Probability mode asks for every allowed label with values in [0,1] summing to one. The local Pydantic schema validates individual bounds
- Discrete mode converts Noul booleans to 0/1 and Choice/Score selections to one-hot probabilities. This makes confidence artificial for discrete mode and must not be compared as though the LLM emitted calibrated probabilities
- Choice confidence is computed by scaling peak probability from the uniform baseline to certainty
- Score confidence is computed from concentration around the modal score using mean absolute distance, not TypeSafe's undocumented native computation
- Score is the expected rubric index. If normalization is disabled, the adapter still rescales internally for expected-score calculation while reporting original probabilities
- `response.usage` includes final-attempt input/output, totals across returned attempts, transient and malformed retry counts, and latency
- `response.debug` includes every LLM attempt, messages, schema parameters, raw provider response, provider request arguments, finish reason, retry reasons, probability-sum errors, and original probabilities when normalization changed them
- Terminal `TypeSafeError` instances receive the same attempt history as `error.debug`

### Retry behavior

The adapter defaults to `RetryPolicy(max_retries=0)`, unlike the direct Python SDK's default two retries. A supplied TypeSafe `RetryPolicy` governs transient provider failures separately for each provider request. `n_retry_malformed_structure` governs corrective conversations after schema failures. Consequently, one logical evaluation can create multiple provider calls from both transient retries and corrective retries; count all attempts for latency and cost.

### Comparison cautions

- The adapter's TypeSafe-shaped response establishes interface comparability, not semantic equivalence
- Its confidence formulas are local adapter algorithms, not Jev's current confidence algorithm
- Structured and prompted modes have different malformed-output risks and provider capabilities
- OpenAI and Anthropic provider parameters, model versions, tokenization, and prices must be logged alongside each trial
- Compare equivalent state, exact questions, exact answer spaces, retries, timeouts, failure accounting, and downstream policy outcomes. Do not compare only a chosen label or a successful subset

## Privacy, retention, and legal boundaries

### Direct TypeSafe

- `current`, `public-contract`: TypeSafe states that it does not train or fine-tune models on customer requests, responses, prompts, or other input
- `current`, `public-contract`: The Privacy Policy says TypeSafe collects prompts, data, instructions, and other input to provide the service, may use personal data to maintain/improve/debug/administer services and generate anonymized or aggregate data, and may disclose input to service providers
- `current`, `public-contract`: The public Privacy Policy does not promise a fixed general retention duration. It says personal data is retained as long as reasonably necessary for services or business/commercial purposes, subject to deletion/anonymization requests and legal retention obligations
- `current`, `public-contract`: The DPA similarly says customer personal data is retained as long as necessary for processing purposes and applicable law
- `current`, `public-contract`: TypeSafe docs say ZDR is available for enterprise customers by arrangement through `privacy@typesafe.ai`. Do not claim direct API ZDR for an ordinary account unless the account contract confirms it
- `current`, `public-contract`: Services are hosted in the United States; the Privacy Policy says EEA/UK/other-region users transfer data to the US for storage and processing
- `current`, `public-contract`: The MCA permits processing customer data to provide the service and derive telemetry. It defines telemetry broadly, including technical logs, hashes, summary statistics, classifications, metrics, and learnings, and permits TypeSafe to process telemetry to improve services

Application implication: minimize state, redact or tokenize data before inference when meaning is preserved, keep credentials server-side, define a state-retention policy independently of provider retention, and verify enterprise ZDR contract terms before sending regulated or highly sensitive content directly.

### Legal caution for the planned course and eval work

`current`, `public-contract`: TypeSafe's Master Customer Agreement section 2.3 prohibits publishing benchmarks or performance information about the Services and prohibits using the Service or outputs for model distillation or training an imitator/competing service. Public TypeSafe-authored benchmark claims can be quoted with attribution and claim labels. Before publishing original Jev benchmark results, obtain legal/contract confirmation or permission. This note is technical research and contains no paid-model benchmark.

## Production implementation guidance derived from the contracts

1. Pin the model version and version the full question definitions. Log both requested and returned model IDs
2. Build state from the smallest relevant records. Log a safe state hash and retrieval/version metadata, not necessarily raw sensitive state
3. Use at least two Choice options and two Score levels. Include `other`, `unknown`, or `review` when the real answer space requires it
4. Set an end-to-end application deadline around SDK retries. The JavaScript SDK has no total retry budget; Python's 30-second retry budget is not a universal workflow deadline
5. Treat 429 and 529 as service/capacity failures, not semantic model failures. Respect `Retry-After`, bound retries, and prevent retry amplification across queues and callers
6. Log request ID, requested/returned model, question version, safe state identifier/hash, usage, latency, raw probabilities, confidence where present, threshold/policy version, action, and downstream outcome
7. Separate four failure boundaries: API/transport failure, semantic judgment failure, policy/threshold failure, and downstream action failure
8. Never let a model answer authorize a side effect by itself. Check identity, permissions, idempotency, current records, and deterministic invariants in code
9. Calibrate thresholds on labeled workflow data. Noul probability, Choice/Score confidence, and whole-workflow correctness are different quantities
10. Keep debug body logging off in production unless state and responses have an explicit safe-logging transform

## Unknowns and follow-up tests

- `unknown`: Direct TypeSafe's exact ordinary-account retention duration. The public policy gives purpose-based retention, not a number
- `unknown`: Service-level availability commitment, if any, for the direct API
- `unknown`: Exact server behavior for omitted instructions, a one-level Score, an empty/single-option Choice, and top-level null state. Current docs/schema/SDKs conflict; do not spend inference calls solely to test malformed boundaries without an explicit test budget
- `unknown`: Actual alias entries returned for this account by authenticated `GET /v1/models`
- `unknown`: Native Jev determinism across identical requests. The public materials emphasize consistency/calibration but do not promise byte-identical responses
- `unknown`: Whether server-side request IDs are stable across retries. SDKs surface the final response request ID; retry attempt IDs are only visible if the server returns/logs them per failure
- `unknown`: Gateway retry and timeout behavior specifically for the evaluation transport. Use AI SDK/Gateway documentation and source before teaching concrete defaults
- `unknown`: Gateway's representation of the resolved native Jev version. `typesafe-ai/jev` is a Gateway model ID; capture provider metadata from a controlled call before claiming that it exposes `jev-1.13.0`

## Source ledger

All sources were retrieved on 2026-09-18 unless a page's own update date is stated.

### TypeSafe live documentation and contracts

- Official TypeSafe agent skill: https://raw.githubusercontent.com/typesafe-ai/skills/main/skills/typesafe-ai/SKILL.md
  - Commit pinned: https://github.com/typesafe-ai/skills/blob/65a39f393687675ce170e6094757de20370365b9/skills/typesafe-ai/SKILL.md
  - Use: workflow guidance, direct docs as source of truth, design rules, credential placement
- Documentation index: https://docs.typesafe.ai/llms.txt
  - Use: discover current pages and reference surface
- API reference: https://docs.typesafe.ai/api.md
  - Use: endpoint, request/answer prose, documented error statuses, rate-limit handling
- Live OpenAPI: https://api.typesafe.ai/openapi.json
  - OpenAPI title `TypeSafe`, version `0.2.0`
  - Use: live server request/response schemas and discovered contract discrepancies
- Models: https://docs.typesafe.ai/models.md
  - Use: version, aliases, pricing, rate/context limits, modalities, language, data handling, model listing
- SDK overview: https://docs.typesafe.ai/sdk.md
- JavaScript SDK: https://docs.typesafe.ai/sdk/javascript.md
- Python SDK: https://docs.typesafe.ai/sdk/python.md
- Python retries: https://docs.typesafe.ai/sdk/python/api/retries.md
- Python exceptions: https://docs.typesafe.ai/sdk/python/api/exceptions.md
- Migration to v1: https://docs.typesafe.ai/migrating-to-v1.md
  - Use: historical preview-to-v1 field and endpoint changes
- Jev 1.13 jaggedness: https://docs.typesafe.ai/model-jaggedness/jev-1.13.md
  - Last reviewed by TypeSafe: 2026-09-17
  - Use: version scope and architectural limits referenced by model docs
- Legal index: https://docs.typesafe.ai/legal.md
- Privacy Policy: https://typesafe.ai/legal/privacy-policy
  - Page updated 2025-11-19
- Data Processing Addendum: https://typesafe.ai/legal/data-processing
  - Page updated 2026-04-24
- Master Customer Agreement: https://typesafe.ai/legal/mca
  - Page updated 2026-08-27

### JavaScript SDK source

Repository: https://github.com/typesafe-ai/typesafe-sdk-js

Commit/tag: `v0.6.0`, `66880ccded6cb642dc1809620c2b108c33730214`

- Client and transport: https://github.com/typesafe-ai/typesafe-sdk-js/blob/66880ccded6cb642dc1809620c2b108c33730214/src/client.ts
- Retry defaults: https://github.com/typesafe-ai/typesafe-sdk-js/blob/66880ccded6cb642dc1809620c2b108c33730214/src/retry.ts
- Error hierarchy: https://github.com/typesafe-ai/typesafe-sdk-js/blob/66880ccded6cb642dc1809620c2b108c33730214/src/errors.ts
- Public types: https://github.com/typesafe-ai/typesafe-sdk-js/blob/66880ccded6cb642dc1809620c2b108c33730214/src/types.ts
- Question builders/validation: https://github.com/typesafe-ai/typesafe-sdk-js/blob/66880ccded6cb642dc1809620c2b108c33730214/src/questions.ts
- Response/request ID wrapper: https://github.com/typesafe-ai/typesafe-sdk-js/blob/66880ccded6cb642dc1809620c2b108c33730214/src/api-promise.ts
- Models resource: https://github.com/typesafe-ai/typesafe-sdk-js/blob/66880ccded6cb642dc1809620c2b108c33730214/src/resources/models.ts
- Logging/redaction: https://github.com/typesafe-ai/typesafe-sdk-js/blob/66880ccded6cb642dc1809620c2b108c33730214/src/logging.ts
- Package metadata: https://github.com/typesafe-ai/typesafe-sdk-js/blob/66880ccded6cb642dc1809620c2b108c33730214/package.json
- npm registry: https://registry.npmjs.org/%40typesafe-ai%2Fsdk/latest

### Python SDK source

Repository: https://github.com/typesafe-ai/typesafe-sdk-python

Commit/tag: `v0.7.0`, `2ce5c65f13646cab6e6f782328194c9d85f3300a`

- Sync client: https://github.com/typesafe-ai/typesafe-sdk-python/blob/2ce5c65f13646cab6e6f782328194c9d85f3300a/src/typesafe_sdk/_core/client/sync/client.py
- Async client: https://github.com/typesafe-ai/typesafe-sdk-python/blob/2ce5c65f13646cab6e6f782328194c9d85f3300a/src/typesafe_sdk/_core/client/aio/client.py
- Retry policy: https://github.com/typesafe-ai/typesafe-sdk-python/blob/2ce5c65f13646cab6e6f782328194c9d85f3300a/src/typesafe_sdk/_core/retry.py
- Transport: https://github.com/typesafe-ai/typesafe-sdk-python/blob/2ce5c65f13646cab6e6f782328194c9d85f3300a/src/typesafe_sdk/_core/transport.py
- Error hierarchy: https://github.com/typesafe-ai/typesafe-sdk-python/blob/2ce5c65f13646cab6e6f782328194c9d85f3300a/src/typesafe_sdk/_core/errors.py
- Question types: https://github.com/typesafe-ai/typesafe-sdk-python/blob/2ce5c65f13646cab6e6f782328194c9d85f3300a/src/typesafe_sdk/_core/question_types.py
- Question validation: https://github.com/typesafe-ai/typesafe-sdk-python/blob/2ce5c65f13646cab6e6f782328194c9d85f3300a/src/typesafe_sdk/_core/questions.py
- Response types: https://github.com/typesafe-ai/typesafe-sdk-python/blob/2ce5c65f13646cab6e6f782328194c9d85f3300a/src/typesafe_sdk/_core/response_types.py
- Response validation/raw metadata: https://github.com/typesafe-ai/typesafe-sdk-python/blob/2ce5c65f13646cab6e6f782328194c9d85f3300a/src/typesafe_sdk/_core/schemas/base.py
- Generated OpenAPI models: https://github.com/typesafe-ai/typesafe-sdk-python/blob/2ce5c65f13646cab6e6f782328194c9d85f3300a/src/typesafe_sdk/_schemas/models.py
- Constants: https://github.com/typesafe-ai/typesafe-sdk-python/blob/2ce5c65f13646cab6e6f782328194c9d85f3300a/src/typesafe_sdk/constants.py
- Changelog: https://github.com/typesafe-ai/typesafe-sdk-python/blob/2ce5c65f13646cab6e6f782328194c9d85f3300a/docs/changelog.md
- Package metadata: https://github.com/typesafe-ai/typesafe-sdk-python/blob/2ce5c65f13646cab6e6f782328194c9d85f3300a/pyproject.toml
- PyPI registry: https://pypi.org/pypi/typesafe-sdk/json

### System One adapter source

Repository: https://github.com/typesafe-ai/system-one-adapter-python

Commit/tag: `v0.2.0`, `adffc2eab300a4fa3c0e92252d4ffd6ceaa53700`

- README and behavior overview: https://github.com/typesafe-ai/system-one-adapter-python/blob/adffc2eab300a4fa3c0e92252d4ffd6ceaa53700/README.md
- Client/prompt/conversion logic: https://github.com/typesafe-ai/system-one-adapter-python/blob/adffc2eab300a4fa3c0e92252d4ffd6ceaa53700/src/system_one_adapter/_client.py
- Dynamic JSON schema: https://github.com/typesafe-ai/system-one-adapter-python/blob/adffc2eab300a4fa3c0e92252d4ffd6ceaa53700/src/system_one_adapter/_schema.py
- Response diagnostics: https://github.com/typesafe-ai/system-one-adapter-python/blob/adffc2eab300a4fa3c0e92252d4ffd6ceaa53700/src/system_one_adapter/_response.py
- OpenAI providers: https://github.com/typesafe-ai/system-one-adapter-python/blob/adffc2eab300a4fa3c0e92252d4ffd6ceaa53700/src/system_one_adapter/providers/openai.py
- Anthropic providers: https://github.com/typesafe-ai/system-one-adapter-python/blob/adffc2eab300a4fa3c0e92252d4ffd6ceaa53700/src/system_one_adapter/providers/anthropic.py
- Provider trace/lifecycle seam: https://github.com/typesafe-ai/system-one-adapter-python/blob/adffc2eab300a4fa3c0e92252d4ffd6ceaa53700/src/system_one_adapter/providers/base.py
- Confidence formulas: https://github.com/typesafe-ai/system-one-adapter-python/blob/adffc2eab300a4fa3c0e92252d4ffd6ceaa53700/src/system_one_adapter/_utils/confidence_metrics.py
- Probability normalization: https://github.com/typesafe-ai/system-one-adapter-python/blob/adffc2eab300a4fa3c0e92252d4ffd6ceaa53700/src/system_one_adapter/_utils/probability_normalization.py
- Retry/error translation: https://github.com/typesafe-ai/system-one-adapter-python/blob/adffc2eab300a4fa3c0e92252d4ffd6ceaa53700/src/system_one_adapter/_utils/error_handling.py
- Package metadata: https://github.com/typesafe-ai/system-one-adapter-python/blob/adffc2eab300a4fa3c0e92252d4ffd6ceaa53700/pyproject.toml
- PyPI registry: https://pypi.org/pypi/system-one-adapter/json

### Vercel AI Gateway and AI SDK

- Evaluation modality: https://vercel.com/docs/ai-gateway/modalities/evaluation
  - Page updated 2026-09-16
  - Use: AI SDK-only transport, question/answer mapping, structured state, Gateway provider instance, usage
- Launch changelog: https://vercel.com/changelog/typesafe-ai-jev-now-available-on-ai-gateway
  - Published 2026-09-16
  - Use: minimum AI SDK version, provider metadata confidence, ZDR/no-training support
- Jev model page: https://vercel.com/ai-gateway/models/jev
  - Use: current Gateway ID and displayed price
- Public Gateway model API: https://ai-gateway.vercel.sh/v1/models
  - Use: observed exact price, evaluation type, ZDR/no-training flags, supported spec
- Gateway ZDR: https://vercel.com/docs/ai-gateway/security-and-compliance/zdr
  - Use: per-request/team behavior, availability, failure behavior, retention statement
- Disallow prompt training: https://vercel.com/docs/ai-gateway/security-and-compliance/disallow-prompt-training
- AI npm registry: https://registry.npmjs.org/ai/latest

