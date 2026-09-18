# Jev repository discovery and workflow design

Verified 2026-09-18 against TypeSafe's live docs, the official TypeSafe skill, and the current Vercel AI Gateway evaluation contract.

Read this reference when identifying Jev opportunities or turning one into a scoped design. Recheck live documentation before implementation.

## Find a real semantic boundary

Trace an actual user action from input to visible result. Read the repository instructions, manifests, entrypoints, data types, request handlers, tests, model calls, and failure paths that implement it. Cite the current file and line for every claimed integration point.

Look for a decision where code has the required evidence but cannot interpret its meaning reliably:

- Keyword or regex rules standing in for intent, relevance, tone, risk, or semantic equivalence
- A generative prompt whose prose or JSON is parsed into a small answer space
- A human queue used mainly to choose among known routes or review uncertain cases
- Ranking heuristics that have a bounded candidate set but weak semantic matching
- Extracted candidates that need selection by role or context
- Claims, fields, or citations that must be checked against supplied evidence
- Several independent qualitative dimensions later combined by code
- A cheap first-stage result that needs semantic verification before escalation

Also inspect non-classification shapes:

- **Candidate selection:** parse or retrieve candidates in code, let Jev select one, then copy the source value verbatim
- **Re-ranking:** score query-candidate pairs with a Boolean/Noul judgment and sort in code
- **Bounded function dispatch:** select a handler and closed-set arguments while code validates and executes
- **Structure recovery:** ask about boundaries or block types, then render source text in code
- **Verification cascades:** check a cheaper model's extracted fields and escalate only suspicious cases
- **Composite signals:** ask separate ordered Scores, normalize them, and apply visible code-owned weights
- **Progressive hierarchy search:** use Choice probabilities to retain plausible paths; fetch or construct the next options only after a real dependency

Reject Jev when the repository already has exact evidence and deterministic logic can produce the answer. Arithmetic, counting, date comparison, exact lookup, schema validation, authorization, deduplication, invariants, and side effects stay in code. Do not add a runtime external dependency to a local or offline application unless the user-visible benefit and data boundary justify it.

## State design

Build one state containing the minimum current evidence needed by the questions. Prefer a named object when several records or relationships matter. Keep source text, observed facts, policy, and identity distinct.

- Reference nested fields explicitly in question instructions, for example `ticket.messages[0].text`
- Retrieve and filter before evaluation; irrelevant content lowers accuracy and hides the failure boundary
- Represent missing evidence explicitly rather than inviting a guess
- Keep inferred values separate from observed facts
- For candidate selection, include every value Jev may select; an omitted candidate is unrecoverable
- For reproducible workflows, retain a safe hash or version of state construction, questions, policy, and requested model

Do not send secrets or sensitive user content merely because it is available in process memory. For local-only state, prefer a development-time or opt-in workflow over a silent server call.

## Choose the answer shape

| Need | Native TypeSafe | AI SDK through Gateway | Design constraint |
| --- | --- | --- | --- |
| Whether one condition holds | Noul | Boolean | Probability means yes; near 0.5 is uncertainty, not medium intensity |
| One winner from a fixed set | Choice | Choice | Distribution is relative to the supplied options; add no-match or pair with a Boolean when none may fit |
| Position on ordered semantic levels | Score | Score | Levels describe concrete situations; score is an expected level index, not an exact measurement |

Question IDs are code-owned and are not the question. Put the full meaning in `instructions` and `criteria`. Ask one coherent judgment per question. Use structured objects when `what`, `not_for`, boundary cases, or examples clarify adjacent meanings.

### Ambiguity patterns

- **Several labels may apply:** use one Boolean/Noul per label rather than one Choice
- **Exactly one route must win:** use Choice with mutually exclusive descriptions
- **Nothing may fit:** add `other`, `none`, or `review`, or pair relative Choice with an absolute applicability Boolean
- **A middle category is real:** use Choice or Score with a defined middle outcome; do not treat Noul 0.5 as the middle
- **Evidence may be absent:** ask a separate presence question or include `unknown`
- **Adjacent ordered levels overlap:** rewrite each level as a standalone situation and test boundary examples
- **Question depends on a previous answer:** use another request only when that answer is needed to fetch evidence, construct state, or define the next options
- **Same proposition phrased twice:** do not assume separate questions are complements or arithmetically consistent

Batch independent questions over shared state, including useful speculative branch questions. State each premise explicitly and ignore irrelevant answers in code.

## Compose the workflow

Keep raw judgments separate from policy:

1. Build and validate state
2. Evaluate narrow questions together
3. Validate the response contract
4. Apply thresholds, business rules, authorization, and invariants in code
5. Act, clarify, fall back, or send to review

Confidence on Choice and Score summarizes distribution concentration. It is not permission to act and does not include retrieval, workflow, or downstream correctness. Native Noul and Gateway Boolean expose the yes probability without a separate confidence field.

Use code-owned weights only when dimensions legitimately compensate for one another. A rule such as "any severe violation blocks" needs separate conditions. Log the question/policy version and safe request metadata; avoid logging raw state by default.

## Gateway and native contracts differ

Prefer the supported AI SDK evaluation interface for Vercel AI Gateway:

- Current catalog model ID: `typesafe-ai/jev`
- AI SDK API: `experimental_evaluate`
- Gateway question name: `boolean`; native TypeSafe name: `noul`
- Gateway Boolean answer: `probability`; native answer: `noul`
- Gateway Jev confidence is in `providerMetadata.typesafe.confidence` keyed by question ID; native Choice/Score place confidence on each answer
- Gateway's returned model ID reflects the requested Gateway model and does not prove the underlying native Jev version
- AI SDK core defaults to two retries; provide an `AbortSignal` deadline because evaluation has no dedicated timeout option in the inspected implementation

Do not translate field names mechanically between providers. Gateway evaluation is not a chat-completions API and is not available through Gateway's OpenAI-compatible endpoint.

Source: [Gateway integration details](integration.md), plus [Gateway evaluation](https://vercel.com/docs/ai-gateway/modalities/evaluation), [AI SDK evaluation](https://ai-sdk.dev/docs/ai-sdk-core/evaluation), [TypeSafe primitives](https://docs.typesafe.ai/primitives.md), [advanced question structure](https://docs.typesafe.ai/primitives/advanced.md), and [Jev 1.13 jaggedness](https://docs.typesafe.ai/model-jaggedness/jev-1.13.md).
