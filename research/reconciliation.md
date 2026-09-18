# Jev source reconciliation

**Research date:** 2026-09-18 (America/New_York)  
**Purpose:** Reconcile claims that could otherwise be copied inconsistently into `/jeverything`, the course, or an implementation. Sources compared: `research/gateway.md`, `research/api-sdk.md`, `research/semantics-patterns.md`, and `research/community.md`.  
**Important observation:** Root ran three native TypeSafe Playground Noul tutorial examples. Those are small native playground observations only. No Gateway inference calls were made. Gateway findings below come from public documentation, source inspection, and the unauthenticated public model catalog, not from a Gateway inference response.

## Evidence policy

Use this order when a claim conflicts:

1. Current first-party contract or source for the interface being implemented
2. Current first-party model/limits/privacy documentation
3. Current SDK and provider source observations, labeled as implementation behavior
4. First-party worked examples and dated cookbook measurements
5. Community artifacts and articles, labeled as community evidence
6. Inference, clearly identified as inference

Do not resolve a conflict by silently choosing the most convenient number. Preserve the disagreement, select conservative implementation behavior, and record the next verification needed.

## Reconciled current claims

### Model IDs and aliases

**Evidence:**

- Native research records `jev-1.13.0` as the current versioned Jev ID and both `jev-latest` and `jev-preview` resolving to it on the research date: [TypeSafe models](https://docs.typesafe.ai/models.md), [API/SDK research](https://docs.typesafe.ai/api.md), and the current model notes in `research/api-sdk.md`
- The native SDK defaults to `jev-latest`; the HTTP API requires a model and accepts aliases or versioned IDs
- Community articles independently repeat `jev-1.13.0`, `jev-latest`, and `jev-preview`, but they are corroboration/discovery rather than contract evidence: [Flavio Copes](https://flaviocopes.com/jev/), [Daniel Ch](https://x.com/chddaniel/article/2100925069765534024), and [MindStudio classification](https://www.mindstudio.ai/blog/jev-system-one-model-classification)
- Gateway's public model ID is `typesafe-ai/jev`: [Vercel Jev listing](https://vercel.com/ai-gateway/models/jev), [Gateway catalog](https://ai-gateway.vercel.sh/v1/models), and [Gateway provider source](https://github.com/vercel/ai/blob/9528712c364c6cb46caf97b901bb742d0c623cd7/packages/gateway/src/gateway-evaluation-model.ts)

**Reconciliation:**

- For native TypeSafe, teach `jev-1.13.0` as the current versioned model and `jev-latest`/`jev-preview` as aliases that, at this retrieval, both resolve to it. This is a current snapshot, not a promise that `jev-preview` has no separate build later.
- For Vercel AI Gateway, teach `typesafe-ai/jev` as the Gateway provider/model ID. It is not interchangeable with the native alias strings.
- Gateway source sets the normalized result's `modelId` to the requested Gateway model ID. That field does not prove that the underlying native evaluator was `jev-1.13.0`. The native TypeSafe provider preserves the native response model when present.
- If immutable backend selection is required, native direct `jev-1.13.0` is the only versioned path established by this research. Gateway pinning to a native Jev version is unresolved. Do not describe Gateway responses as resolved `jev-1.13.0` without a controlled, credentialed observation or documented provider metadata.
- Any production policy measured against a model version must log requested provider/model, returned metadata, question version, and policy version. Alias replay is not reproducible after alias movement.

**Status:** Reconciled for teaching and implementation. Gateway's native resolution remains unresolved.

### Price and display rounding

**Evidence:**

- Native TypeSafe docs/API research report `$42` per billion input tokens, equivalent to `$0.042` per million input tokens, with output tokens free: [TypeSafe models](https://docs.typesafe.ai/models.md), [TypeSafe API](https://docs.typesafe.ai/api.md)
- The live Gateway catalog returned the exact decimal input price `0.000000042` USD per token and output `0`: [Gateway catalog](https://ai-gateway.vercel.sh/v1/models). Multiplying by 1,000,000 gives `$0.042/M`.
- The Vercel web model listing rounds that display to `$0.04/M`: [Vercel Jev listing](https://vercel.com/ai-gateway/models/jev)
- Community articles commonly quote `$0.042/M` or `$42/billion`; their numbers agree directionally but are not primary evidence: [MindStudio launch](https://www.mindstudio.ai/blog/jev-system-one-model-launch), [Anthony Maio](https://anthonymaio.substack.com/p/jev-the-language-model-that-wont), [Flavio Copes](https://flaviocopes.com/jev/)

**Reconciliation:**

- Use `$0.042` per million input tokens as the precise converted rate and record the exact Gateway catalog value when discussing Gateway billing.
- Explain `$0.04/M` as a rounded Vercel display, not a different rate.
- Output is currently listed as free in both native and Gateway sources, while usage still reports output tokens in some interfaces. Free output does not mean output tokens are absent or that downstream generation is free.
- Do not turn a model-token rate into cost per successful workflow. State construction, retries, fallback models, human review, Gateway budgets, and downstream actions may dominate.
- Cookbook costs are dated examples. Recompute with current usage and pricing when doing an implementation estimate.

**Status:** Reconciled. Exact catalog price and rounded website display are both correct at different precision.

### Context limits: 64k aggregate, 32k per longest question, and the primitives-page approximation

**Evidence:**

- The current API/model research reports a 64k request budget across `state` plus all questions and a separate 32k limit for `state` plus the single longest question: [TypeSafe models](https://docs.typesafe.ai/models.md), [TypeSafe API](https://docs.typesafe.ai/api.md)
- The primitives page summarizes the state/questions budget as approximately 32,000 tokens in its speculative-question section: [Primitives](https://docs.typesafe.ai/primitives.md#ask-speculative-questions)
- Community summaries repeat a 64k total plus roughly 32k state/longest-question limit: [Flavio Copes](https://flaviocopes.com/jev/), [Daniel Ch](https://x.com/chddaniel/article/2100925069765534024)
- Gateway's public catalog returns `context_window: 0` and `max_tokens: 0`: [Gateway catalog](https://ai-gateway.vercel.sh/v1/models). Source inspection and research classify these as missing/not-represented sentinels for a non-generative evaluation provider, not literal zero capacity: [Gateway provider source](https://github.com/vercel/ai/blob/9528712c364c6cb46caf97b901bb742d0c623cd7/packages/gateway/src/gateway-evaluation-model.ts)

**Reconciliation:**

- Teach the native model limit as 64k for the complete request (`state` plus all questions), with a separate 32k bound for `state` plus the longest individual question. This permits several questions only when their aggregate fits.
- Treat the primitives-page approximately-32k sentence as a stale or simplified summary. Preserve it in the source ledger, but do not present it as a third limit. The cookbook/primitive discrepancy itself is a current documentation inconsistency.
- Do not infer Gateway context capacity from catalog zeros. Gateway must transport the TypeSafe evaluation contract, but its catalog metadata does not establish the native limit.
- Keep state substantially smaller than the ceiling. Retrieve/filter first, because a syntactically valid request can still lose accuracy to irrelevant context.

**Status:** Reconciled conservatively. Native 64k/32k is the implementation reference; approximate 32k is stale/simplified; Gateway zeros are metadata placeholders. Exact server enforcement across all SDKs remains untested in this pass.

### Confidence: native unknown formula versus adapter formula

**Evidence:**

- Native TypeSafe docs say Choice and Score expose confidence derived from distribution concentration; Noul exposes only its yes probability: [Confidence](https://docs.typesafe.ai/confidence.md), [Noul](https://docs.typesafe.ai/primitives/noul.md), [Choice](https://docs.typesafe.ai/primitives/choice.md), [Score](https://docs.typesafe.ai/primitives/score.md)
- The native confidence formula is not published. Neither a few examples nor a community article establishes that it is entropy, margin, peak probability, or probability of correctness: [Jev 1.13 jaggedness](https://docs.typesafe.ai/model-jaggedness/jev-1.13.md), [semantics research](https://docs.typesafe.ai/confidence.md)
- Vercel Gateway maps Choice/Score confidence into `result.providerMetadata?.typesafe?.confidence`, while Boolean/Noul has no separate confidence field: [Gateway evaluation docs](https://vercel.com/docs/ai-gateway/modalities/evaluation), [TypeSafe provider source](https://github.com/vercel/ai/blob/9528712c364c6cb46caf97b901bb742d0c623cd7/packages/typesafe-ai/src/typesafe-ai-evaluation-model.ts)
- The TypeSafe-authored `system-one-adapter-python` is a comparison adapter for other LLMs. It computes local formulas: Choice confidence by scaling peak probability from the uniform baseline, and Score confidence from mean absolute distance to the modal score: [adapter source](https://github.com/typesafe-ai/system-one-adapter-python/blob/adffc2eab300a4fa3c0e92252d4ffd6ceaa53700/src/system_one_adapter/_utils/confidence_metrics.py), [adapter research](https://docs.typesafe.ai/api.md)
- Community articles use words such as concentration and confidence but do not reveal the native formula: [Anthony Maio](https://anthonymaio.substack.com/p/jev-the-language-model-that-wont), [Flavio Copes](https://flaviocopes.com/jev/)

**Reconciliation:**

- Native Jev confidence is a returned distribution-derived statistic with an undisclosed formula. Treat it as a policy signal, not as correctness probability.
- Gateway confidence is the same provider's metadata mapping as currently implemented, but a Gateway caller must read provider metadata rather than native answer fields.
- Adapter confidence is not Jev confidence. It describes a local prompted/structured-output comparison implementation and must never be used to explain native or Gateway values.
- Discrete-mode adapter confidence is artificial one-hot concentration and cannot be compared with native probability calibration.
- If a product needs a different statistic, compute it from the full returned distribution in code and name it explicitly. Do not call the result Jev confidence.

**Status:** Reconciled by separating the three surfaces. Native formula and any Gateway backend-resolution detail remain unresolved.

### Observed, copied, and reported examples

The source files contained several kinds of examples that were at risk of being flattened into one evidence level.

| Example/source | What was actually established | Correct label |
| --- | --- | --- |
| Root's three native Playground Noul tutorial examples | Small interactive native Playground observations; useful for checking tutorial flow and response shape, not representative performance or Gateway behavior | `observed`, native-only, tiny sample |
| TypeSafe cookbook pages and demos | First-party worked examples and published outputs; some include dated measurements and thresholds | `observed` for visible workflow/output; `vendor-reported` for performance/accuracy numbers |
| TypeSafe model/primitive/API docs | Current intended public contract, subject to documented inconsistencies | `public-contract` / `current` |
| Gateway catalog | Unauthenticated metadata observation: Gateway model ID, evaluation type, exact price, ZDR/no-training flags, supported spec | `observed` catalog metadata; not inference or native version resolution |
| AI SDK/Gateway source audit | Current implementation behavior at the inspected commit, including field mapping and retries | `implementation-observed`; pin the commit |
| `jevlogs`, routers, `jevify`, and other repositories | Public code exists and shows architecture/policy patterns | `artifact-verified`; author outcome claims remain `community-reported` |
| MindStudio/Flavio/Daniel/Anthony/LangChain articles | Secondary explanations, demos, or author-run measurements | `community-reported` |
| Parallel Judgment Lab | Downloaded synthetic experiment data and published author-run call counts/timings | `observed` artifact; not independent production evidence |
| Community benchmark numbers | Claims may be plausible, but no independent reproduction was performed | `community-reported` |

**Reconciliation:**

- Course prose should say "the cookbook reports" or "the author measured" for dated numbers.
- It may say "the docs demonstrate" for a visible first-party example, while still explaining that a worked example is not a general accuracy estimate.
- It may say "source inspection shows" for an SDK/provider behavior at a pinned commit.
- It should not say that root's three Playground calls validate Jev accuracy, calibration, model version resolution, or Gateway integration.
- No Gateway inference call was made; any Gateway response behavior beyond source/catalog evidence remains unobserved in this research pass.

**Status:** Reconciled by using explicit evidence labels. No contradiction remains once observation scope is stated.

## Native TypeSafe versus Vercel AI Gateway

### Contract mapping

| Surface | Native TypeSafe | Vercel AI Gateway |
| --- | --- | --- |
| Provider/model ID | `jev-latest`, `jev-preview`, `jev-1.13.0` | `typesafe-ai/jev` |
| Supported entry point | `POST https://api.typesafe.ai/v1/systemone` or official SDKs | AI SDK 7 `experimental_evaluate` |
| Binary type | `noul` | `boolean` |
| Binary value | `answer.noul` | `answer.probability` |
| Choice/Score confidence | On each native answer | `result.providerMetadata?.typesafe?.confidence`, keyed by question ID |
| Usage shape | Native `input_tokens`/`output_tokens` in HTTP response; SDK-specific typed views | AI SDK `inputTokens`/`outputTokens` |
| Credential | `TYPESAFE_API_KEY` | `AI_GATEWAY_API_KEY` or supported Vercel OIDC |
| Direct model pinning | Versioned native ID accepted | No documented native Jev version pin established |
| Transport | Native JSON API and SDK request semantics | Gateway evaluation transport; not Gateway OpenAI/Anthropic/Cohere-compatible chat REST |

Primary sources: [TypeSafe API](https://docs.typesafe.ai/api.md), [TypeSafe SDK](https://docs.typesafe.ai/sdk.md), [Vercel evaluation docs](https://vercel.com/docs/ai-gateway/modalities/evaluation), [Gateway model page](https://vercel.com/ai-gateway/models/jev), [AI SDK evaluation source](https://github.com/vercel/ai/blob/9528712c364c6cb46caf97b901bb742d0c623cd7/packages/ai/src/evaluate/evaluate.ts), [Gateway evaluation provider source](https://github.com/vercel/ai/blob/9528712c364c6cb46caf97b901bb742d0c623cd7/packages/gateway/src/gateway-evaluation-model.ts), [TypeSafe provider source](https://github.com/vercel/ai/blob/9528712c364c6cb46caf97b901bb742d0c623cd7/packages/typesafe-ai/src/typesafe-ai-evaluation-model.ts).

### Reconciliation for the user's Gateway preference

For a Vercel/TypeScript application, default the implementation recommendation to Gateway's `experimental_evaluate` only after checking the installed `ai` version and exports. This gives the application Gateway authentication, reporting, budgets, and provider options, but it changes primitive names, response fields, metadata location, retry behavior, and model identity. The exact request/response code cannot be copied from a native TypeSafe example.

Use native TypeSafe when the workflow requires Python, native request IDs/raw headers, native SDK behavior, or a versioned `jev-1.13.0` model ID. A recommendation that says "use Gateway" must state that the underlying native version is not exposed/verified and should avoid claims of immutable replay.

### Privacy and retention are not interchangeable

Gateway catalog and docs mark the Jev provider as ZDR/no-training capable, and request-level `zeroDataRetention: true` is documented. Gateway logs and custom reporting can still contain evaluation metadata and count against budgets; application logs can still retain the state. Direct TypeSafe's public privacy terms and enterprise ZDR arrangement are a separate contract. Do not transfer direct TypeSafe retention claims to Gateway or assume provider ZDR makes application logging safe.

Sources: [Gateway ZDR](https://vercel.com/docs/ai-gateway/security-and-compliance/zdr), [Gateway evaluation](https://vercel.com/docs/ai-gateway/modalities/evaluation), [TypeSafe legal](https://docs.typesafe.ai/legal.md), and the privacy/retention section of `research/api-sdk.md`.

## Additional current contract conflicts to preserve

These are smaller conflicts that affect implementation validation. They are included here because a fluent Jev skill should not teach a single unqualified rule when the sources disagree.

### Instructions omitted versus required

- API prose describes `instructions` as required
- Live OpenAPI and both SDK surfaces permit omission or `null`
- **Resolution:** Always provide explicit instructions. This avoids ambiguous question semantics and is safer than depending on an optional edge. Mark the docs disagreement in validation notes.

Sources: [TypeSafe API](https://docs.typesafe.ai/api.md), [JavaScript questions source](https://github.com/typesafe-ai/typesafe-sdk-js/blob/66880ccded6cb642dc1809620c2b108c33730214/src/questions.ts), [Python question validation](https://github.com/typesafe-ai/typesafe-sdk-python/blob/2ce5c65f13646cab6e6f782328194c9d85f3300a/src/typesafe_sdk/_core/questions.py).

### Score minimum levels

- API prose and JavaScript SDK require at least two Score criteria
- Live OpenAPI says `minItems: 1`; Python 0.7.0 only rejects an empty list
- **Resolution:** Require at least two levels in `/jeverything` because one level is not an ordered judgment. Treat this as a skill validation choice, not proof of server rejection.

Sources: [Score](https://docs.typesafe.ai/primitives/score.md), [JavaScript question validation](https://github.com/typesafe-ai/typesafe-sdk-js/blob/66880ccded6cb642dc1809620c2b108c33730214/src/questions.ts), [Python questions](https://github.com/typesafe-ai/typesafe-sdk-python/blob/2ce5c65f13646cab6e6f782328194c9d85f3300a/src/typesafe_sdk/_core/questions.py).

### Null state

- JavaScript SDK's `EntryType` includes top-level `null` in TypeScript types
- Live HTTP OpenAPI excludes null state
- **Resolution:** Do not send null state. Validate state as string/object/array before provider calls.

Source: [TypeSafe SDK/API research](https://docs.typesafe.ai/api.md) and pinned SDK source listed in the API research ledger.

### Choice option minimum

- Live OpenAPI does not declare a minimum number of Choice options
- The TypeSafe-authored adapter requires at least two, and a one-option Choice is not a meaningful relative selection
- **Resolution:** Require at least two options in the skill and recommend complete answer spaces. This is an application/design rule, not a claim that every server path currently rejects one option.

Source: [Choice](https://docs.typesafe.ai/primitives/choice.md), [adapter source](https://github.com/typesafe-ai/system-one-adapter-python), and `research/api-sdk.md`.

### Response model alias versus resolved model

- Some API examples show the requested alias in a response
- The Models documentation says the response reports the resolved versioned model
- **Resolution:** Treat the actual response value as authoritative, preserve both requested and returned fields, and do not infer native resolution from Gateway's requested model ID.

Source: [Models](https://docs.typesafe.ai/models.md), [API](https://docs.typesafe.ai/api.md), [Gateway source](https://github.com/vercel/ai/blob/9528712c364c6cb46caf97b901bb742d0c623cd7/packages/gateway/src/gateway-evaluation-model.ts).

### Authentication status codes

- API prose names 401 for missing/invalid credentials
- An unauthenticated `GET /v1/models` observed during research returned 403 with an authentication error body and `x-typesafe-request-id`
- SDKs expose both 401 and 403 error classes
- **Resolution:** Classify by status family plus structured error body/SDK exception. Do not hard-code "all auth failures are 401." This one observed request is not evidence that the documented 401 contract is wrong for all routes.

Source: [TypeSafe API](https://docs.typesafe.ai/api.md) and the observed response recorded in `research/api-sdk.md`.

### Retry behavior

- Native JavaScript 0.6.0 and Python 0.7.0 SDKs default to two retries, up to three attempts, but their retry budgets differ
- JavaScript uses a 10-second per-attempt timeout and has no total retry budget; it caps accepted `Retry-After` at 60 seconds
- Python has a 10-second per-operation HTTP timeout by default and a 30-second retry budget; it has no explicit maximum accepted `Retry-After` before the total budget stops a retry
- AI SDK/Gateway core defaults to two retries and exponential backoff starting at two seconds; evaluation has no dedicated timeout argument in the inspected implementation, so use an `AbortSignal` deadline
- **Resolution:** Never copy native SDK retry/timeout numbers into Gateway code. Set a workflow-level deadline, bound retries, respect retry headers, and avoid queue/caller retry amplification.

Sources: [native JS source](https://github.com/typesafe-ai/typesafe-sdk-js/blob/66880ccded6cb642dc1809620c2b108c33730214/src/retry.ts), [native Python source](https://github.com/typesafe-ai/typesafe-sdk-python/blob/2ce5c65f13646cab6e6f782328194c9d85f3300a/src/typesafe_sdk/_core/retry.py), [AI SDK retry source](https://github.com/vercel/ai/blob/9528712c364c6cb46caf97b901bb742d0c623cd7/packages/provider-utils/src/retry-with-exponential-backoff.ts), and `research/gateway.md`.

## What remains unresolved

The following questions were not answered by this pass and must remain labeled `unknown` in the course/skill:

- Which native Jev backend version a Gateway `typesafe-ai/jev` request actually uses, and whether Gateway will expose that version in provider metadata
- Whether Gateway supports a documented native version pin in a later release
- Native Jev's exact Choice/Score confidence formula
- Exact Gateway inference behavior for retries, timeout, partial provider failures, and model resolution beyond source/catalog evidence
- Authenticated account-specific model aliases/versions from `GET /v1/models`
- Server enforcement at context boundaries and malformed edge cases such as null state, one-level Score, or one-option Choice
- Native determinism across identical requests and whether request IDs remain stable across retries
- Ordinary-account direct TypeSafe retention duration; public policy gives purpose-based retention rather than a fixed number
- Independent production accuracy, calibration, subgroup behavior, and availability

## Evidence limitations

This reconciliation is a contract and source comparison, not a fresh production evaluation. No live Gateway inference call was made. Root's three native Playground Noul examples establish only that the tutorial interaction was usable for those cases; they do not validate accuracy, calibration, cost, latency, alias resolution, or provider equivalence. First-party cookbook outputs and community benchmarks are labeled as dated/vendor or author-reported evidence. The inspected SDK/provider source is pinned to specific commits and can change. The public docs themselves contain stale or conflicting schema summaries, so the safest skill behavior is to use explicit instructions, at least two Choice options, at least two Score levels, non-null state, complete answer spaces, versioned question/policy logs, and a controlled fallback path.
