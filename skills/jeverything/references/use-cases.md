# Jev use-case and pattern map

**Verified:** 2026-09-18 (America/New_York)  
**Purpose:** Agent-facing reference for discovering Jev opportunities in an existing repository, scoping an implementation, and keeping the model boundary small.  
**Provider preference:** Vercel AI Gateway through AI SDK evaluation when the repository is already a Vercel/TypeScript application. Native TypeSafe SDKs remain a separate contract and are appropriate when the application needs native fields, native retries, direct HTTP metadata, Python, or a pinned TypeSafe model ID.

This file is derived from the official TypeSafe documentation, the Vercel AI SDK/Gateway source audit, and the community artifacts listed below. It is a design reference, not permission to add a dependency or send repository data to a hosted service.

## Evidence labels

- **`public-contract`**: behavior described by current TypeSafe or Vercel documentation
- **`artifact-verified`**: behavior or structure found in inspected source code or a public repository
- **`vendor-reported`**: TypeSafe's published cookbook, evaluation, price, or benchmark claim
- **`community-reported`**: a community article, demo, benchmark, or project claim
- **`inferred`**: engineering guidance derived from the sources
- **`observed`**: behavior visible in a published example or downloaded run, without independent production replication

Do not promote `vendor-reported`, `community-reported`, or `observed` numbers into defaults. Recheck version-sensitive facts before implementation.

## What counts as a Jev opportunity

Jev fits a repeated semantic judgment with a bounded answer shape. The application supplies state; Jev evaluates one or more typed questions; ordinary code validates the response, applies policy, checks authorization and exact facts, and performs or declines the action. Jev does not generate prose, code, reasoning traces, or side effects.

```text
user/event
   |
   v
retrieve and validate evidence
   |
   v
minimum relevant state + typed question pack
   |
   v
Jev: answer values, distributions, confidence where supported, usage
   |
   v
code: thresholds, invariants, permissions, arithmetic, side effects
   |
   +--> act
   +--> clarify or fetch more evidence
   +--> use a specialist/generative model
   +--> queue for review or preserve the existing path
```

The best first candidate is usually a reversible, observable decision such as routing, ranking, verification, or review prioritization. Do not add Jev where deterministic code already has exact evidence or where the product needs free-form text.

## Repository discovery procedure

Use this sequence when `/jeverything` is invoked against a repository:

1. Read repository instructions, package manifests, environment configuration, architecture notes, representative handlers, tests, and deployment boundaries
2. Trace one real user or event path from input to visible output and side effect
3. Search call sites for semantic decisions currently made with keyword/regex rules, prompt-and-parse JSON, ranking heuristics, manual queues, or a large generative prompt
4. Record the evidence that is actually available at the decision boundary and the evidence that is missing
5. Separate candidates that are one coherent question from candidates that hide several judgments or exact computation
6. Map each candidate to Noul, Choice, Score, or a composition of independent questions
7. Define the no-match, missing-evidence, low-confidence, provider-failure, and human-review paths before writing code
8. Rank candidates by expected user benefit, implementation size, consequence of error, privacy exposure, and evaluation feasibility
9. Recommend one bounded experiment with files, tests, rollback behavior, and an adoption criterion

### Signals worth searching for

| Repository signal | Likely Jev seam | First questions to ask |
| --- | --- | --- |
| `if`/regex rules for intent, tone, risk, or relevance | semantic Noul or Choice | Is the proposition binary, mutually exclusive, or multi-label? |
| Prompt followed by `JSON.parse`, Zod, or enum coercion | typed Choice/Noul/Score | Is the parsed schema closed and is prose generation unnecessary? |
| `sort`, `rank`, or score heuristic over retrieved candidates | Noul per candidate or Choice ranking | Is candidate retrieval complete and can code own final ordering? |
| Human queue used to choose a known route | Choice plus confidence gate | What risk justifies automation and what belongs in review? |
| LLM output checked against a record or schema | verifier Nouls/Choice | Which evidence is authoritative and what exact checks stay deterministic? |
| Several qualitative fields later combined | independent Scores/Nouls plus code weights | Do dimensions compensate or does any severe condition block? |
| Model router or skill selector | capability filter then Choice | Which candidates are eligible before semantic fit is evaluated? |
| Tool/agent action approval | risk Nouls plus impact Score | What is shadow-only, what asks for confirmation, and what always blocks? |
| Candidate span/value extraction | code extraction then Choice | Can Jev choose only from exact candidates copied by code? |
| Date, count, arithmetic, or exact lookup in a prompt | deterministic parser/calculation | Why is Jev needed when code can calculate the answer? |
| Free-form answer, explanation, or user-facing prose | generative model/templates | Can Jev be a gate or verifier around generation instead? |
| Offline/local-only path with no clear user benefit | no integration | Would a runtime network dependency violate the product contract? |

### Required recommendation record

For every candidate worth discussing, write:

- user-visible behavior and current file/line path
- current state source, missing evidence, and data sensitivity
- one-sentence semantic judgment
- primitive and exact answer-space design
- example state shape and question definitions
- batching/dependency plan
- deterministic code that remains around the call
- thresholds as hypotheses, not defaults
- provider choice and versioned dependency surface
- timeout, retry, overload, invalid-output, and low-confidence behavior
- evaluation set, metrics, and adoption criterion
- files likely to change, rollback path, and rejected alternatives

## Primitive and state selection

| Meaning of the answer | Native TypeSafe | AI SDK through Gateway | Use when | Keep in code |
| --- | --- | --- | --- | --- |
| Probability that one proposition is true | Noul, response field `noul` | Boolean, response field `probability` | One binary condition; several labels can use several independent questions | Threshold, abstention, action, complementary logic |
| One winner from a fixed option set | Choice | Choice | Exactly one route/label should win and the option set is complete | Eligibility filtering, no-match policy, side effects |
| Position on an ordered semantic rubric | Score | Score | One dimension has distinct ordered levels | Normalization, weighting, blocking rules, exact numeric work |

### Noul

Use a Noul for one yes/no proposition. The positive wording should mean yes. A value near 0.5 means uncertainty; it is not a middle intensity. Noul has no separate confidence field. Do not assume a separately asked negation equals `1 - p`.

Use one Noul per label when labels may co-occur. Keep a separate `unknown`/evidence-presence question when absence of evidence is meaningful. A Noul threshold is application policy and must be evaluated on labeled target data.

### Choice

Use Choice when exactly one option should be returned from a fixed set. Its probabilities are relative to the supplied options, so the winner can still be a poor absolute fit. Add `other`, `unknown`, `none`, or `review` when the list may be incomplete, or pair a relative Choice with an absolute applicability Noul.

Make criteria mutually exclusive and describe boundaries. If labels legitimately overlap, replace Choice with independent Nouls. Filter impossible options in deterministic code before asking Jev and include every candidate that Jev may select.

### Score

Use Score for one ordered semantic dimension whose levels describe concrete situations. Score is the expected level index from the distribution; it is not an exact measurement. Read the full distribution when policy depends on uncertainty. Split a multi-dimensional rubric into several Scores and combine with code-owned weights only when tradeoffs genuinely compensate. A severe condition that must block should be a separate Noul or invariant.

### State

State may be a string, object, or array containing text. Prefer a named object when several records or relationships matter. Keep source text, observed facts, identity, policy, and inferred values distinct. Reference nested fields explicitly in instructions, for example ``ticket.messages[0].text``.

Retrieve, filter, and normalize before inference. Include the minimum relevant context and make missing evidence explicit. The current native contract describes a 64k request budget for state plus questions and a separate 32k state-plus-longest-question limit; the primitives page also contains an approximate 32k summary. See `research/reconciliation.md` before quoting limits.

For replay, store a safe state hash or immutable state reference, question definition/version, policy version, requested model, returned model or Gateway metadata, usage, latency, answer distributions, and downstream outcome. Avoid retaining raw sensitive state by default.

## Composition and code ownership

Ask independent questions about the same state together. They see the same state and cannot consume one another's answers in the same request. Use a second request only when an answer is needed to fetch new evidence, build new state, or define the next answer options.

```text
build state -> validate state -> ask independent questions
       -> validate response shape
       -> apply thresholds/weights/invariants in code
       -> authorize and execute, clarify, escalate, or fall back
```

Code must own:

- exact arithmetic, counting, date comparison, numeric conversion, and lookups
- retrieval, candidate completeness, deduplication, normalization, and provenance
- authentication, authorization, idempotency, and current-record checks
- thresholds, abstention, review capacity, weights, and business policy
- response validation, error handling, timeouts, bounded retries, and circuit behavior
- side effects, output formatting, user-visible explanations, and rollback

Treat Jev's typed answer as a semantic feature or judgment, not as permission. Confidence covers the distribution's concentration, not retrieval correctness, policy correctness, authorization, or downstream success.

## The 18 official cookbook patterns

The following map includes every cookbook page listed in TypeSafe's `llms.txt` on 2026-09-18. Published numbers are dated/vendor-reported and are not production defaults.

| # | Pattern and primary source | Detect in a repository | Jev shape | Code-owned part and evidence limit |
| ---: | --- | --- | --- | --- |
| 1 | [Self-consistency: Nouls](https://docs.typesafe.ai/cookbooks/consistency_noul_cookbook.md) | A binary rubric is threshold-sensitive or repeated judgments may disagree | Repeat a pack of independent Nouls and compare distributions | Choose repeat count and review band; the published 14-question/15-repeat run and 0.0102 deviation are vendor-reported and dated |
| 2 | [Self-consistency: Choices](https://docs.typesafe.ai/cookbooks/consistency_choice_cookbook.md) | Closed-set labels fluctuate across repeated evaluations | Repeat Choices, use plurality or top-probability abstention | Define tie/review policy; the 90.8% plurality and 0.60 example are dated vendor results and do not isolate nondeterminism from irrelevant-state sensitivity |
| 3 | [Parallel questions](https://docs.typesafe.ai/cookbooks/parallel_questions.md) | Several independent fields are evaluated serially against the same document | Batch the question map in one request | Keep state construction and second-stage dependencies in code; 12.2x cost and 10.0x latency figures are workload-specific vendor results, and a primitives summary is stale at 11.5x/9.6x |
| 4 | [Re-ranking](https://docs.typesafe.ai/cookbooks/rerank_typesafe.md) | Search/retrieval returns candidates that need semantic relevance ordering | Retrieve/shortlist deterministically, ask a Noul per query-candidate pair | Code owns retrieval, threshold, order, and provenance; omitted passages cannot be recovered. The CLERC top-k lift is dated/vendor-reported |
| 5 | [Line-by-line search](https://docs.typesafe.ai/cookbooks/semantic_find.md) | A document needs source-line or span selection and may contain no answer | Choice ranks candidate line IDs plus a Noul asks whether an answer exists | Code copies the chosen span and handles no-answer; a Choice winner is relative, not proof of absolute suitability |
| 6 | [Structure recovery](https://docs.typesafe.ai/cookbooks/autoformat.md) | Text structure is missing but source text must be preserved | Nouls mark boundaries; Choice classifies newly stitched blocks with speculative questions | Code joins/render blocks and preserves markers; the two-request token/time/cost example is dated/vendor-reported |
| 7 | [Function calling](https://docs.typesafe.ai/cookbooks/function_calling.md) | A natural-language request selects one of known handlers/enums | Choice selects the function and closed-set argument labels | Code validates arguments, permissions, exact values, and executes; free-form arguments need a separate extraction path |
| 8 | [Skill suggestion](https://docs.typesafe.ai/cookbooks/skill_suggestion.md) | Large skill/tool catalog is loaded wholesale or guessed | Choice ranks candidates; Noul asks whether any skill is needed; second request fetches top details | Code fetches only selected candidates and may reject all; published wrong/unnecessary loading rates are vendor-reported and dated |
| 9 | [Knowledge graph entity alignment](https://docs.typesafe.ai/cookbooks/entity_alignment.md) | Two records may be separate, curated, or mergeable based on semantic evidence | Score has action levels; companion Nouls identify field disagreements | Code applies merge safety, identity checks, and review; rounded Score is workflow routing, not a calibrated merge probability |
| 10 | [Classifying RAG passages](https://docs.typesafe.ai/cookbooks/classifying_rag_passages.md) | Retrieved passages may be irrelevant, contradictory, unusable, or instruction-like | Four Nouls per passage: relevance, usable evidence, contradiction, embedded instructions | Code partitions evidence/conflict/drop blocks and constructs the generator prompt; retrieval coverage remains separate |
| 11 | [Double-checking citations](https://docs.typesafe.ai/cookbooks/citation_check.md) | Generated citations/quotes need support checking | Exact string matching first, then Choice: supporting/contradicting/unrelated | Code finds quote spans and sends uncertainty to review; the eight-example result is a worked example, not accuracy evidence |
| 12 | [Guardrails for LLMs](https://docs.typesafe.ai/cookbooks/llm_guardrails.md) | Inputs/outputs need semantic hazard or harm checks before a policy action | Hazard Nouls plus harm Score on both input and output | Code maps the same judgment vector to pass/review/block/crisis support; no adversarial robustness claim follows |
| 13 | [SDE cascade](https://docs.typesafe.ai/cookbooks/sde_cascade.md) | A cheap generative extraction path needs a verifier before expensive reasoning | Nouls check extracted fields for failure signals, then escalate suspicious cases | Code owns extraction storage, escalation, retry, and final validation; dated prices/comparisons are vendor-reported |
| 14 | [Date extraction](https://docs.typesafe.ai/cookbooks/date_extraction_cookbook.md) | Text expresses absolute/relative date components in varied wording | Choices select date kind and named components | Code resolves dates, compares ranges, validates calendar math, and routes missing/invalid combinations |
| 15 | [Pre-parsed value extraction](https://docs.typesafe.ai/cookbooks/pre_parsed_value_extraction_cookbook.md) | Text contains emails, phone numbers, amounts, or spans needing contextual selection | Regex/code over-finds candidates; Choice selects the requested span; Nouls/Choices classify attributes | Code copies exact source value and normalizes it; Jev cannot select a candidate code failed to extract |
| 16 | [Hierarchical classification](https://docs.typesafe.ai/cookbooks/hierarchical_classification.md) | A taxonomy/tree is too large for one flat Choice | Greedy or beam traversal asks frontier Choices in parallel; path probabilities rank candidates | Code expands pinned children, prunes paths, and decides depth; geometric-mean path score is application logic, not leaf calibration |
| 17 | [Autoresearch feature discovery](https://docs.typesafe.ai/cookbooks/autoresearch_feature_discovery.md) | A generative model proposes semantic features for a supervised predictor | Proposer writes Jev Score/Noul questions; answers become features; held-out feedback drops/revises features | Code owns dataset split, CatBoost/training, feature selection, and leakage checks; wine RMSE results are dated/vendor-reported |
| 18 | [Classification using confidence](https://docs.typesafe.ai/cookbooks/classification_using_confidence.md) | Fine-grained classification should broaden or abstain when uncertain | Choice classifies; confidence below a tested threshold routes to broader hierarchy | Code maps uncertainty to fallback level and review; SEC filing numbers use filtered labels and Jev 1.12, so they do not generalize automatically |

### Pattern selection rules

- **Choice plus applicability Noul:** use when one candidate must be ranked but no candidate may fit
- **Several Nouls:** use when labels can co-occur or each condition has an independent policy
- **Score plus code weights:** use for distinct dimensions that legitimately compensate; do not hide blocking conditions in a weighted mean
- **Two-stage request:** use only when the first answer changes evidence, state, or options
- **Candidate-first extraction:** use when exact source values must be copied and normalized
- **Verifier cascade:** use when a generator or parser already produced a candidate and Jev can detect suspicious cases
- **Hierarchy/beam search:** use when the next candidate set depends on the selected path

## Signals from community implementations

These are implementation patterns observed in public repositories, not instructions to copy their code. Outcomes remain unverified unless marked otherwise.

| Project | Repository signal | Transferable design lesson | Evidence |
| --- | --- | --- | --- |
| [jevlogs](https://github.com/reachjalil/jevlogs) | OTel exporter evaluates actionable/priority/value before splitting logs | Preserve the archive branch; sanitize/truncate state; protected records bypass inference; fail open to analysis; measure incident recall and missed important events | `artifact-verified`; live quality and savings not established |
| [jevify](https://github.com/altryne/jevify) | Meta-skill inspects call sites, prompts, rules, and repeated semantic decisions | Return a scoped candidate with state, primitive, criteria, fallback, policy, and evaluation rather than replacing a module wholesale | `artifact-verified`; linked measurements are author-reported |
| [gargpratyush/jev-router](https://github.com/gargpratyush/jev-router) | Proxy filters/request-pins model tiers and uses Jev for semantic fit | Keep capability eligibility and explicit model requests in code; use fail-open and privacy review around prompt forwarding | `artifact-verified`; request-format compatibility is brittle |
| [prismhq/jev-router](https://github.com/prismhq/jev-router) | LiteLLM router filters by capability, then asks Choice | Deterministically remove impossible options before semantic ranking; local fallback preserves availability | `artifact-verified`; experimental, no quality benchmark |
| [gtaras7/typesafe-jev](https://github.com/gtaras7/typesafe-jev) | CV questions are separate evidence dimensions; composite policy is pure code | Persist answers so policy/weights can change without re-inference; keep gates and human review outside Jev | `artifact-verified`; no hiring/fairness evidence |
| [superagents-lab/jev-search](https://github.com/superagents-lab/jev-search) | Parallel retrieval, per-candidate Nouls, code-owned dedup/order | Retrieval coverage and semantic ranking are separate failure boundaries; Jev cannot rank omitted candidates | `artifact-verified`; demo outcome unverified |
| [y0usaf/pi-jev](https://github.com/y0usaf/pi-jev) | Shadow/enforce modes, cache, tool risk questions, fail-open | Start in shadow mode; make approval behavior, privacy, truncation, and fallback explicit; six-state smoke calibration is not enough | `artifact-verified`; no safety guarantee |
| [langchain-typesafe](https://github.com/langchain-ai/langchainjs/tree/main/libs/providers/langchain-typesafe) | Runnable wrapper validates questions, handles timeout/abort/retry metadata | Treat framework defaults as integration behavior; pin versions and inspect retries/field mapping | `artifact-verified`; package behavior can drift |
| [yibie/awesome-jev](https://github.com/yibie/awesome-jev) | Categorizes routing, guardrails, ranking, agents, data, research, integrations, simulation | Use the catalog to discover candidate seams, then inspect primary repositories and reproduce claims | `artifact-verified` index; list entries are not benchmarks |

## Provider choice: Gateway versus native TypeSafe

Prefer Gateway for a Vercel/TypeScript repository when the desired workflow fits AI SDK evaluation:

- model ID: `typesafe-ai/jev`
- API: `experimental_evaluate` from `ai`
- Boolean type/value: `boolean` / `probability`
- Choice and Score confidence: `result.providerMetadata?.typesafe?.confidence`
- Gateway credential: server-side `AI_GATEWAY_API_KEY` or supported Vercel OIDC
- Gateway privacy and routing options: verify current documentation and choose request-level policy deliberately

Use native TypeSafe when the application needs `noul` terminology, direct `/v1/systemone`, direct SDK retry controls/raw response headers, Python, or an immutable native model ID such as `jev-1.13.0`. Native and Gateway are different contracts. Do not mechanically replace `noul` with `boolean`, `noul` with `probability`, or native answer confidence with Gateway provider metadata.

Primary provider sources:

- [Vercel Gateway evaluation documentation](https://vercel.com/docs/ai-gateway/modalities/evaluation)
- [Vercel Jev model listing](https://vercel.com/ai-gateway/models/jev)
- [Gateway model catalog](https://ai-gateway.vercel.sh/v1/models)
- [TypeSafe API](https://docs.typesafe.ai/api.md)
- [TypeSafe models](https://docs.typesafe.ai/models.md)
- [AI SDK evaluation source](https://github.com/vercel/ai/blob/9528712c364c6cb46caf97b901bb742d0c623cd7/packages/ai/src/evaluate/evaluate.ts)
- [Gateway evaluation provider source](https://github.com/vercel/ai/blob/9528712c364c6cb46caf97b901bb742d0c623cd7/packages/gateway/src/gateway-evaluation-model.ts)
- [TypeSafe AI SDK provider source](https://github.com/vercel/ai/blob/9528712c364c6cb46caf97b901bb742d0c623cd7/packages/typesafe-ai/src/typesafe-ai-evaluation-model.ts)

## Implementation and evaluation guardrails

Before implementation:

- verify installed AI SDK exports/types and the current Gateway evaluation docs
- keep the key server-side and inspect the state for secrets/PII before sending it
- version the full state builder, question definitions, policy, and model/provider choice
- define at least one no-match or review path where the domain permits it
- set an application deadline around retries and abort behavior

During implementation:

- validate inputs and returned answer structure
- preserve the existing path in shadow/canary mode
- log safe metadata: request ID where available, requested/returned model, question/policy versions, state hash, usage, latency, thresholds, action, and outcome
- distinguish evidence failure, semantic judgment failure, policy failure, and operational/downstream failure
- keep arithmetic, dates, counts, exact lookups, permissions, idempotency, and side effects in code

Evaluation set:

- ordinary clear positives/negatives and representative traffic
- missing evidence and candidate omissions
- overlapping/ambiguous labels and legitimate no-match outcomes
- boundary probabilities near each proposed threshold
- long state with irrelevant fields
- contradictory instructions/criteria and double negatives
- adversarial/instruction-like state
- non-English traffic when relevant
- version and downstream mapping regressions

Adoption criteria should include task metrics, probability quality, coverage after abstention, false-positive/false-negative costs, review load, latency, availability, token cost, and downstream action correctness. Confidence is a distribution statistic, not a universal correctness probability.

## Primary sources

Core semantics and patterns:

- [TypeSafe documentation index](https://docs.typesafe.ai/llms.txt)
- [System One](https://docs.typesafe.ai/concepts/system-one.md)
- [State](https://docs.typesafe.ai/concepts/state.md)
- [Primitives](https://docs.typesafe.ai/primitives.md)
- [Noul](https://docs.typesafe.ai/primitives/noul.md)
- [Choice](https://docs.typesafe.ai/primitives/choice.md)
- [Score](https://docs.typesafe.ai/primitives/score.md)
- [Advanced question structure](https://docs.typesafe.ai/primitives/advanced.md)
- [Confidence](https://docs.typesafe.ai/confidence.md)
- [Fan-out](https://docs.typesafe.ai/patterns/fan-out.md)
- [Confidence routing](https://docs.typesafe.ai/patterns/confidence-routing.md)
- [Composite scoring](https://docs.typesafe.ai/patterns/composite-scoring.md)
- [Intent routing](https://docs.typesafe.ai/patterns/intent-routing.md)
- [Jev 1.13 jaggedness](https://docs.typesafe.ai/model-jaggedness/jev-1.13.md)
- [Official TypeSafe skill](https://raw.githubusercontent.com/typesafe-ai/skills/main/skills/typesafe-ai/SKILL.md)

The complete 18-cookbook URLs are listed in the table above. Community source details and retrieval statuses are in [research/community.md](https://github.com/twwright/jeverything/blob/master/research/community.md); contradictions and unresolved claims are in [research/reconciliation.md](https://github.com/twwright/jeverything/blob/master/research/reconciliation.md).
