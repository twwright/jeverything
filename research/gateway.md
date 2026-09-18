# Jev through Vercel AI Gateway

Verified 2026-09-18. Original research notes. No authenticated inference call was made for these findings.

## Current public contract

- Vercel launched Jev on Gateway on September 16, 2026: https://vercel.com/changelog/typesafe-ai-jev-now-available-on-ai-gateway
- Evaluation documentation: https://vercel.com/docs/ai-gateway/modalities/evaluation
- AI SDK contract: https://ai-sdk.dev/docs/ai-sdk-core/evaluation
- Model listing: https://vercel.com/ai-gateway/models/jev
- Live machine-readable catalog: https://ai-gateway.vercel.sh/v1/models

The supported route is AI SDK 7's `experimental_evaluate`, available from ai 7.0.105. On the verification date npm reports ai 7.0.106, @ai-sdk/gateway 4.0.86, and @ai-sdk/typesafe-ai 3.0.3. Pin exact versions for examples because evaluation can change in patch releases. Gateway evaluation is not offered through its OpenAI-, Anthropic-, or Cohere-compatible APIs. A string model ID defaults to Gateway unless application-wide provider configuration overrides it. Use `gateway.evaluationModel("typesafe-ai/jev")` for an explicit provider instance.

Authentication uses server-side AI_GATEWAY_API_KEY or supported Vercel OIDC. Native TypeSafe keys and Gateway keys are different credentials. A direct `@ai-sdk/typesafe-ai` integration uses TYPESAFE_AI_API_KEY; this differs from the official native SDK's TYPESAFE_API_KEY convention.

## Catalog observation

Status: observed (unauthenticated catalog retrieval, not model inference). The catalog returns `typesafe-ai/jev`, type evaluation, supported specification v4, input price 0.000000042 USD/token, output price 0, zdr all, and no_training all. This is $0.042 per million input tokens; the website rounds its display to $0.04. Native and Gateway listed input rates agree. Catalog context_window and max_tokens are 0; they do not establish zero context capacity. Use TypeSafe's actual model limits and do not derive capacity from those placeholders.

The catalog does not list `typesafe-ai/jev-latest`. AI SDK's core documentation currently uses that spelling in one example, while Gateway's catalog, announcement, and evaluation documentation consistently use `typesafe-ai/jev`. Prefer the verified catalog ID and record the documentation discrepancy. Do not promise a versioned Gateway ID without verifying support.

Gateway documents per-request `providerOptions.gateway.zeroDataRetention: true`. The listing reports both ZDR and No Training. Separate provider retention from application logs, Gateway request logging, trace exports, and the direct TypeSafe account's terms. Do not transfer the native enterprise-plan description to Gateway without checking the Gateway contract.

## Normalized interface versus native API

| Concern | AI SDK evaluation | Native TypeSafe |
| --- | --- | --- |
| Boolean question | type boolean | type noul |
| Boolean answer | probability | noul |
| Choice | choice and optional probabilities in generic SDK types | choice, probabilities, confidence |
| Score | score and optional index-keyed probabilities | score, probabilities, legend, confidence |
| Confidence | providerMetadata.typesafe.confidence keyed by question ID | each Choice/Score answer |
| Usage | inputTokens/outputTokens/totalTokens | input_tokens/output_tokens |
| Model | typesafe-ai/jev on Gateway | jev-latest, jev-preview, or versioned native ID |

AI SDK uses one shared string/object/array state. An array is not a batch. Questions have typed IDs and Choice key inference. Instructions and descriptions accept JSON-compatible structures; a description can be null. Choice criteria must be nonempty; Score needs at least two ordered levels. Native provider limits are 255 Choice options and 10 Score levels. Evaluation returns a complete result, with no streaming or partial success.

Core validates inputs and output consistency. A supplied Choice distribution must cover options, select a maximal-probability option, and sum to one within tolerance. Score values must agree with the weighted distribution. Default absolute tolerance is 0.000001; providers can declare decimal rounding, which widens the relevant tolerances. Values are not silently normalized. Generic model adapters can omit distributions, so consumer code must handle their absence.

## Source implementation audit

Status: current (source inspection). vercel/ai main SHA at inspection: 9528712c364c6cb46caf97b901bb742d0c623cd7. Pin this SHA in detailed references rather than assuming main remains unchanged.

- https://github.com/vercel/ai/blob/9528712c364c6cb46caf97b901bb742d0c623cd7/packages/ai/src/evaluate/evaluate.ts
- https://github.com/vercel/ai/blob/9528712c364c6cb46caf97b901bb742d0c623cd7/packages/gateway/src/gateway-evaluation-model.ts
- https://github.com/vercel/ai/blob/9528712c364c6cb46caf97b901bb742d0c623cd7/packages/typesafe-ai/src/typesafe-ai-evaluation-model.ts
- https://github.com/vercel/ai/blob/9528712c364c6cb46caf97b901bb742d0c623cd7/packages/ai/src/evaluate/evaluation-result.ts
- https://github.com/vercel/ai/blob/9528712c364c6cb46caf97b901bb742d0c623cd7/packages/ai/src/util/retry-with-exponential-backoff.ts
- https://github.com/vercel/ai/blob/9528712c364c6cb46caf97b901bb742d0c623cd7/packages/provider-utils/src/retry-with-exponential-backoff.ts

The Gateway provider sends the normalized state/questions/providerOptions body to its SDK transport `/evaluation-model`, with ai-evaluation-model-specification-version 4 and ai-model-id headers. This is an implementation detail, not a documented stable Python or cURL integration. Teach the supported SDK entrypoint.

The Gateway provider sets response.modelId to its requested Gateway ID. The core fills missing modelId from that same model instance. Therefore this field does not demonstrate the underlying native Jev version. Preserve requested ID, returned metadata and safe response headers, evaluate alias behavior, and use direct native version pinning when immutable backend selection is mandatory and Gateway has no documented pinning mechanism. A provider fallback alias resolves model names; it is not automatically a failed-request fallback.

The direct TypeSafe AI SDK provider translates boolean to noul before POST /systemone, maps noul back to probability, extracts confidence into metadata, and declares two-decimal probability and score rounding. It preserves the native response.model when present, unlike Gateway's response model field. The response body may contain sensitive input-related information; avoid logging it wholesale.

## Retry, errors, and cancellation

AI SDK core defaults to two retries (up to three attempts). It retries provider errors marked retryable, starts backoff at 2 seconds, and doubles it. Retry-After-MS precedes Retry-After, which supports numeric seconds or dates; reasonable header delays are used, otherwise backoff applies. Abort errors are not retried. There is no evaluation-level timeout argument in the inspected function; supply an AbortSignal with a deadline. Native SDK timeout/backoff defaults are different and must not be described as Gateway defaults.

Input errors are InvalidArgumentError. Invalid output is InvalidResponseDataError. Unsupported question types fail before the provider call with Experimental_EvaluationUnsupportedQuestionTypeError. Provider/model resolution can fail with NoSuchProviderError, NoSuchModelError, or UnsupportedModelVersionError. Core answer validation occurs after the retry wrapper, so a semantic or structural validation failure is not a prompt to keep retrying until an answer passes.

For deterministic local tests use Experimental_EvaluationMockModelV4 from ai/test, test policy separately, and label mocked results. An integration smoke test requires valid credentials and does not prove calibration or production reliability.

## Comparison boundary

AI SDK adapters for OpenAI, Anthropic, and Google use structured model output. Their Choice and Score results lack probability distributions, and their Boolean probability is a prompted estimate. They put all questions in one prompt and do not promise native TypeSafe independent-question execution. A fair comparison must preserve input evidence and answer definitions while documenting these differences, reasoning settings, retries, and missing distribution metrics.

## Open evidence limits

No live inference latency, accuracy, calibration, or model resolution was reproduced. Public sources do not expose private TypeSafe training or serving internals. Marketing speed/cost comparisons remain attributed vendor reports. This research verifies the available contract and client implementation, not all server behavior.
