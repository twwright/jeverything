# Jev community research

**Research date:** 2026-09-18  
**Scope:** Public articles, discussions, example applications, open-source integrations, and community evaluations of Jev / TypeSafe System One.  
**Research status:** Completed first-pass community survey. This file is a source ledger and an evidence-bounded synthesis for the course and `/jeverything`; it is not a claim that every listed project is production ready.

## How to read this file

The product is new and the community material is changing quickly. I used the following labels:

- **`public-contract`**: behavior stated by official TypeSafe documentation or the official TypeSafe skill. The community sources below do not independently establish the contract.
- **`artifact-verified`**: a public repository, package, or downloadable artifact was inspected. This verifies that the artifact exists and contains the described implementation; it does not verify its quality or the author's results.
- **`community-reported`**: a claim, measurement, benchmark, or demonstration reported by the author or a secondary publication.
- **`observed`**: behavior reproduced in the inspected public artifact or downloadable experiment data. This is limited to the artifact and run described; it is not a production replication.
- **`inferred`**: a design lesson derived from several sources rather than a vendor promise.
- **`proposed`**: an announced, suggested, or unverified future behavior.
- **`blocked`**: the canonical page could not be fetched or authenticated during this pass. A mirror or search result may still be described, with that limitation stated.

Unless a paragraph says otherwise, article measurements and performance claims are `community-reported`. The community examples generally use a TypeSafe key or a hosted proxy, but I did not run live Jev calls in this research pass. The one inspected `jevlogs` repository documents a live smoke test that was skipped because no `AI_GATEWAY_API_KEY` was present. The Parallel Judgment Lab publishes synthetic experiments and downloadable data; its numbers should not be read as independent production benchmarks.

The canonical URLs, retrieval method, date, and status are listed in the source ledger at the end. All quotes in this file are short fragments; most source content is paraphrased.

## Official TypeSafe starter skill

**Source:** [typesafe-ai/skills `SKILL.md`](https://raw.githubusercontent.com/typesafe-ai/skills/main/skills/typesafe-ai/SKILL.md)  
**Retrieved:** 2026-09-18  
**Status:** `public-contract`, first-party, current at retrieval

The starter skill is the most useful community-facing implementation guide because it describes the intended boundary between Jev and application code:

- Jev is TypeSafe's flagship / first System One model. It evaluates supplied state against typed questions and returns constrained values, probabilities, and (for Choice and Score) confidence. It is not a chat completion endpoint and does not own application actions.
- The skill recommends a pipeline of state construction, typed questions, Jev evaluation, and ordinary code for thresholds, policy, validation, side effects, retries, and escalation.
- The three core primitives are Choice, Noul, and Score. Choice selects one option, Noul returns a binary probability, and Score selects among ordered levels with a distribution.
- A multi-label task is normally several independent Nouls rather than one Choice pretending that labels are mutually exclusive. An answer space must include legitimate outcomes such as `other`, `unknown`, or `insufficient_evidence` when those outcomes can occur.
- State should be named and structured where relationships matter. The skill recommends retrieving and filtering before inference and sending the minimum relevant context. It warns that extra irrelevant context can degrade accuracy.
- Independent questions about the same state can be sent together. The skill presents speculative fan-out as a way to ask possible follow-up questions in parallel, then make a second request only when the first result changes state or the next answer space.
- Probabilities and confidence guide application policy but do not make the workflow correct. Thresholds must be evaluated on the application's labeled data. A Noul near 0.5 means uncertainty; it is not a third category.
- API keys stay server-side. Typed output is an interface, not a truth guarantee, so application validation and target-performance measurement remain necessary.

These patterns recur in the repositories below. The skill itself is not evidence for the community's reported speed, cost, accuracy, or calibration claims.

## Named community articles and discussions

### Flavio Copes: practical Jev walkthrough

**Source:** [A deep dive into Jev, TypeSafe's System One model](https://flaviocopes.com/jev/)  
**Retrieved:** 2026-09-18. The canonical page returned a Cloudflare challenge; the article text was read through the public [Jina AI mirror](https://r.jina.ai/https://flaviocopes.com/jev/).  
**Status:** `community-reported`, secondary article; canonical fetch `blocked` by Cloudflare

Flavio Copes describes Jev as a "smart if statement": the application sends state and typed questions, and the model returns typed answers rather than prose. The article's sponsor-form example uses one Choice question to select a sponsor category and shows a request/response shape with selected option, probabilities, and confidence. The example is illustrative, so the course should rely on the official API reference for exact field names.

The article's implementation advice is useful even where its numerical details require first-party confirmation:

- Treat Jev as a decision primitive inside code. It does not inspect a repository, call tools, or write an explanation for the user.
- Use Noul for one binary question, Choice for one-of-N options, and Score for an ordered rubric. For multi-label classification, ask one Noul per label.
- Give Choice labels explicit boundaries and include `other` or `none_of_the_above` when the list is not exhaustive. A forced Choice can be confidently wrong because it must select one supplied label.
- Interpret a Noul as the probability that the stated condition is true. A value near 0.5 is uncertainty, not a middle class, and a Noul question and its negation do not necessarily sum to one when the evidence is incomplete or the questions differ.
- Treat Score as a rubric whose levels describe situations. The returned distribution can produce a probability-weighted mean between levels; it is not an exact physical measurement.
- Keep state small and relevant. The article discusses string, object, and array state, and uses named object fields so the question can point at the right evidence.
- Ask independent questions in one request and compose answers in code. Fan out candidate questions speculatively when doing so avoids a serial round trip; issue a second request only when a returned decision changes the next state or answer space.
- Use shadow mode and labeled examples before automating a low-risk action. Keep human review for uncertain, high-risk, or missing-evidence cases.

The article also lists community-facing values and behavior that must be treated as unverified here: `jev-1.13.0`, the `jev-latest` and `jev-preview` aliases, a roughly 64k request budget, 255 Choice options, and a 2-10 level Score range. It gives example HTTP error classes, rate numbers, JavaScript/Python SDK examples, Vercel AI SDK 7 integration, and the Vercel AI Gateway model string `typesafe-ai/jev` with a `zeroDataRetention` option. Those are useful discovery leads for the official course research, but the article is not the API contract.

Its limitations section is particularly relevant to the capstone: literal wording, counting and arithmetic, numeric encodings, date comparison, indirection, irrelevant context, adversarial state, contradictory criteria, missing answer-space options, and the absence of generated prose. The article also describes unverified examples involving paper summaries, listing classification, resume screening, games, browser automation, code linting, logs, natural-language SQL, and agent shell guardrails. These demonstrate possible shapes rather than measured general capability.

### Daniel Ch: "How to master Jev (Full Guide)"

**Source requested by user:** [X article URL](https://x.com/chddaniel/article/2100925069765534024)  
**Retrieved:** 2026-09-18. The X URL returned 403 to direct retrieval and Jina; the public [FxTwitter status API mirror](https://api.fxtwitter.com/status/2100925069765534024) exposed the article pointer and text preview. The supplied status points to article ID `2100924572543410176`.  
**Status:** `blocked` canonical article; `community-reported` through a third-party mirror; author `@chddaniel`

The article frames Jev as a fast decision engine for classification, routing, scoring, and verification. Its five recurring ideas are: decisions instead of prose, visible uncertainty, independent questions in parallel, ordinary software integration, and low reported cost/latency. The low cost and latency values are attributed to TypeSafe or the author's reading of TypeSafe material and are not independent measurements.

Reusable patterns from the guide:

1. **Decision cockpit:** use the TypeSafe Playground to learn the primitives, then move to `POST /v1/systemone`, an SDK, or a gateway integration. Use a moving alias for experimentation and a pinned model ID for threshold-sensitive production behavior.
2. **Support triage:** ask separate atomic questions for department (Choice), frustration (Score), and urgency (Noul). Let code apply a confidence gate and route to automatic handling, a stronger model, or a person.
3. **State hygiene:** send an object containing the relevant facts, remove duplicated or irrelevant history, and avoid treating a large context limit as a reason to send the entire record.
4. **Threshold ownership:** the guide gives example bands such as high confidence for automatic action, a middle band for a stronger model, and low confidence for human review. It explicitly says the bands are starting points and must be selected from the application's tests.
5. **Workflow composition:** use Jev before an expensive generative model to decide whether to call it, after it to verify the result, or around an agent to route tools, detect completion, and escalate ambiguous actions. Log model ID, question version, distributions, confidence, outcome, and downstream action.

The article's phrase "LLMs generate, Jev decides, code controls, humans catch" is a useful architecture mnemonic, but it is a community framing. It does not establish that Jev is universally safer, faster, or better calibrated. The article also claims a current model ID and example request limits; those values need reconciliation against current first-party docs.

### MindStudio: launch article and simulator demos

**Source:** [Jev Explained: TypeSafe AI's Non-Autoregressive System-1 Model](https://www.mindstudio.ai/blog/jev-system-one-model-launch)  
**Retrieved:** 2026-09-18 by direct HTML fetch  
**Status:** `community-reported`, secondary article by MindStudio Director of Product Luis Chavez-Mattos

MindStudio explains Jev as a non-autoregressive System One model that returns direct decisions, probabilities, and confidence. The article repeats TypeSafe's claims of up to 100x speed/cost advantages and an input price of $42 per billion tokens with no output charge. These are vendor or author-reported claims, not an independent benchmark.

The practical insight is the control-loop shape used by the demos:

```text
structured simulator state -> typed Jev decision -> deterministic action
          ^                                      |
          |-------------- simulator update <-----|
```

The article describes Minecraft, a driving-like simulator, a Subway Surfers-like game, and a drone simulator. It reports approximate demo spend and loop behavior, but the environments are controlled simulations rather than real vehicles, robots, or safety systems. They show that a typed decision can be called repeatedly in a state/action loop; they do not establish real-world robustness, sensor-noise tolerance, or safety.

The article also repeats founder and training-background claims. Keep those as attributed claims unless a first-party technical source confirms them. The course should use these demos to explain repeated decisions and application-owned action execution, while explicitly separating simulator evidence from deployment evidence.

### MindStudio: hands-on classification tests

**Source:** [Jev AI Tested: A Fast "System One" Model for Structured Decisions](https://www.mindstudio.ai/blog/jev-system-one-model-classification)  
**Retrieved:** 2026-09-18 by direct HTML fetch  
**Status:** `community-reported`, author-run hands-on tests; not an independent benchmark

The article reports small experiments against `jev-1.13.0`:

- A support message about a duplicate charge and a refund was routed to billing, with high refund probability and low urgency. Rewording the message to say that no refund was requested reduced the refund probability while preserving billing classification.
- A cafeteria-closing question was correctly mapped to `other` when that option existed. When `other` was removed, the model selected an unrelated supplied option with low confidence. This is a concrete demonstration of answer-space quality: low confidence does not repair a missing label.
- One simple prompt-injection string embedded in a support message did not change the reported technical classification. One attack is not a security evaluation and does not prove immunity.
- Candidate extraction selected an exact candidate from supplied choices, including punctuation. Omitted candidates could not be selected.
- An agent audit example classified a tool result that said a save failed as evidence of failure, even when an agent's final prose claimed success. This shows how a verifier can inspect a narrow state but still depends on which evidence entered state.
- Eight service-evaluation requests reportedly took 92-214 ms and used 4,148 input tokens in total. The article reports a price of $0.042 per million input tokens and free output, and cites a separate flight-browser demo. These numbers are author-reported and too small to establish a service-level distribution.

The article's strongest reusable lesson is to test `other`, missing evidence, and adversarial text during question design. Its experiment size and synthetic/support examples limit any general accuracy claim. Total workflow cost also includes state preparation, validation, fallbacks, and human review; model-token cost alone is not a cost-per-successful-decision measure.

### Anthony Maio: architecture and criticism

**Source:** [Jev: The Language Model That Won't Talk](https://anthonymaio.substack.com/p/jev-the-language-model-that-wont)  
**Retrieved:** 2026-09-18 by web retrieval  
**Status:** `community-reported`, secondary analysis; useful critical context

Anthony Maio distinguishes Jev's typed output from a generative model and describes the TypeSafe terms System One and RLCD. He emphasizes that the public material does not disclose enough training detail to independently reproduce the claimed calibration behavior. The article makes an important statistical point: calibration is about the relationship between predicted probabilities and aggregate frequencies, while accuracy, usefulness, and deployment safety are separate questions. A model could be calibrated yet unhelpful if it only predicts base rates.

The article also treats Choice/Score confidence as a statistic derived from distribution concentration, while noting that the exact statistic is not public. Concentration can indicate the model's preference among supplied answers; it is not a universal probability that the workflow or downstream action is correct.

Maio summarizes a TypeSafe internal comparison across security incidents, agent traces, invoice processing, and customer service. The reported average agreement was about 67.8% for Jev and similar values for some LLMs, with lower reported price and latency for Jev; another model reportedly scored higher on some workflows, including invoices. The labels were generated by other models, the workflows were designed by TypeSafe, and there was no independent ground truth or published calibration curve in the article. The defensible conclusion is narrow: in those selected workflows, a decomposed typed workflow appeared competitive on some agreement numbers and used less reported inference cost. The results do not prove general intelligence, universal speedup, calibration, or production reliability.

The article's architecture recommendation is well suited to the course: use Jev around agents for tool selection, trace grading, loop detection, completion checks, and escalation; keep code in charge of side effects and let people handle uncertain or high-risk cases. It also warns that "hallucination-free" should mean a bounded output schema, not a guarantee of semantic truth. Missing `other`, `unknown`, or `insufficient_evidence` can still force a wrong label.

### LangChain: building a harness with Jev

**Source:** [Building a Harness with Jev](https://www.langchain.com/blog/building-a-harness-with-jev)  
**Retrieved:** 2026-09-18 by direct HTML fetch  
**Status:** `community-reported` article plus `artifact-verified` LangChain integration source

LangChain describes Jev as a non-chat System One component in the loop `LLM -> tool -> evaluation`. The article's harness uses a Noul to decide whether a support message is urgent, a model router to choose a fast or stronger model, and an action firewall to inspect risky tool calls. It says independent questions run in parallel and can be placed in the same request.

The public LangChain source was inspected in `langchain-ai/langchainjs`'s `langchain-typesafe` integration. The implementation confirms these integration patterns (the integration code itself is evidence of implementation, not of Jev quality):

- `TypeSafeClassifier` is a Runnable that accepts a state and a map of typed questions and calls `/v1/systemone`.
- The default model in the integration is `jev-latest`, the default timeout is 30,000 ms, and LangChain's `AsyncCaller` is configured for two retries unless overridden. Callers can provide a custom fetch, base URL, questions, and abort signal.
- Response usage fields are mapped from the API shape to the integration's camelCase types. Noul answers have a Noul value; Choice and Score answers expose distributions and confidence.
- The integration comments note that question field order is for parity and that option order can slightly move answers. This is an integration-level warning that question definitions and answer ordering should be versioned and tested.
- The integration validates question shapes before serialization and exposes request IDs / retry metadata in its error classes. Error handling should still be treated as a client-library behavior that can change.

The blog also references Browserbase browsing, live trading, and email triage examples. Those are demonstrations from the article, not controlled safety or profitability evidence. The most reusable pattern is to put a typed gate before an expensive model or dangerous tool, then retain code-owned thresholds, approvals, and rollback behavior.

## Open-source implementations inspected

### `reachjalil/jevlogs`: log filtering with archive-preserving fallback

**Sources:** [repository](https://github.com/reachjalil/jevlogs), [skill](https://github.com/reachjalil/jevlogs/blob/main/skills/jevlogs/SKILL.md), [guide](https://github.com/reachjalil/jevlogs/blob/main/docs/guide.md), [v0.3 evidence](https://github.com/reachjalil/jevlogs/blob/main/docs/evidence/v0.3.md)  
**Retrieved:** 2026-09-18 by clone and source inspection  
**Status:** `artifact-verified`, community open-source preview; quality and savings are unverified

`jevlogs` is a TypeScript/OpenTelemetry skill/package that evaluates log records before a retain/analyze split. One Jev request asks three independent questions: whether a log is actionable, its priority (Choice), and its diagnostic value (Score). The package turns the answers into a `Decision` with a 0-100 value, priority, route, actionable probability, reason, and cached flag.

The implementation provides concrete patterns for a production lesson:

- It uses Vercel AI Gateway with the `typesafe-ai/jev` model and a server-side `AI_GATEWAY_API_KEY`. The default evaluator includes `providerOptions.gateway.zeroDataRetention: true`, but this is a package setting and must be checked against current gateway behavior before being presented as a guarantee.
- It sanitizes common secrets and email addresses, truncates log bodies, excludes OpenTelemetry attributes/resource/trace context from the Jev state, and treats log content as data rather than instructions. This is a useful baseline, not a complete privacy review.
- Protected records (high severity, ERROR/FATAL/CRITICAL, or `jev.protected`) skip evaluation and are always analyzed.
- The default policy retains only low-priority, low-value, low-actionability records. Unavailable, protected, timeout, invalid-output, and Jev-error paths fail open to analysis, with a conservative value/priority fallback.
- Successful evaluations are cached and in-flight requests are deduplicated; evaluation uses a bounded concurrency setting. The evaluator sets `maxRetries: 0` and applies an explicit timeout race, so overload does not silently amplify retries.
- The OpenTelemetry exporter preserves the archive branch and then splits the copy. In `analysis-only` mode, it can skip the retain branch. This makes the data-loss failure boundary visible and testable.
- The guide recommends evaluating 50 to a few hundred sanitized labeled records, measuring incident recall, missed important events, routing rate, latency, unavailable rate, and Jev tokens. It explicitly advises computing savings from measured routing rather than quoting a fixed percentage.

The repository's evidence file reports 33 tests, 32 passing and one live test skipped due to no gateway key; the build passed. A synthetic direct call with a fake key returned a GatewayAuthenticationError 401, which verified only wiring and model resolution. No live quality, latency, or billing result was established. The package is therefore a good implementation study and a poor basis for an accuracy claim.

### `altryne/jevify`: a meta-skill for identifying Jev opportunities

**Sources:** [repository](https://github.com/altryne/jevify), [`SKILL.md`](https://github.com/altryne/jevify/blob/main/SKILL.md), [community discoveries](https://github.com/altryne/jevify/blob/main/references/community-discoveries.md)  
**Retrieved:** 2026-09-18 by clone and source inspection  
**Status:** `artifact-verified`, community skill; its linked measurements are author-reported

`jevify` is particularly relevant to `/jeverything`. It instructs an agent to inspect a repository's call sites, prompts, product rules, and repeated semantic decisions, then choose among Jev, deterministic code, a hybrid, or a generative model. It requires a scoped question pack containing state, primitive, exact instructions/criteria, batching/composition, no-match/uncertainty behavior, and thresholds. It also calls out literal wording, answer-space traps, state limits, adversarial content, and evaluation of quality, latency, tokens, cost, and abstention.

Its community-discoveries reference mentions Every/Mike Taylor writing checks, Aera memory selection, Taishi Morinaga model routing, HA-Jev, credential triage, and idea scoring. The document marks results as author-reported and not reproduced. The reusable process is stronger than any single claim: locate semantic decisions already present in code, preserve deterministic invariants, define a typed boundary, and implement only the selected scope.

### `yibie/awesome-jev`: discovery index and taxonomy

**Sources:** [repository](https://github.com/yibie/awesome-jev), [README](https://github.com/yibie/awesome-jev/blob/main/README.md)  
**Retrieved:** 2026-09-18 by clone; repository metadata reported 97 stars and 8 forks at retrieval  
**Status:** `artifact-verified` curated list; entries are discovery leads, not evidence of outcomes

The list says its inclusion rule is a public citable source that explicitly names Jev or shows a typed decision loop. It groups projects into classification/routing, verification/guardrails, scoring/ranking, agent decisions, data labeling, evaluation, calibration/research, integrations, games/simulation, compliance, moderation, and related discussions. This taxonomy is a useful map for course use cases. It should not be treated as a benchmark because many entries only establish that a repository exists or that its author claims a use.

Representative entries and what they suggest:

- **Routing:** `gargpratyush/jev-router`, `prismhq/jev-router`, Pi routers, and skill routers use Jev to select a capable/cheap model after deterministic capability filtering.
- **Verification and guardrails:** `jev-review`, `pi-jev`, `jev-guard`, `Foreman`, `OpenWork`, and `opencompany` put a typed check around code changes, tool calls, approvals, or completion.
- **Scoring and ranking:** `citation-verifier`, `Clean Code Judge`, `jev-bfs`, `jev-search`, and `pagegrade` use narrow Nouls/Choices/Scores as features or gates, with code controlling ranking, search, or review.
- **Agent loops:** browser-use's `jev-ultrafast`, context-pruning proxies, stop hooks, action judges, and model routers put Jev at repeated state/action boundaries.
- **Data labeling:** `jev-curate` and `typeful-triage` use typed labels and preserve human corrections or output rows for later evaluation.
- **Research and open alternatives:** `decider`, `openjev`, NanoJev, mini-jev, and related constrained-decoding projects explore local or open Jev-shaped interfaces. These are research alternatives, not evidence about the hosted model.
- **Integrations:** the list includes Vercel's `eve`, Vercel Labs AI CLI, MCP servers, ZIO/Laravel/Go/Elixir clients, a PyPI client, and a Neon proxy. Each must be checked against its own release and compatibility state.
- **Simulators:** Mario, drone, StarCraft, Pokémon, and Three.js examples illustrate a repeated structured-state/control loop. They do not establish real-world safety.
- **Moderation and compliance:** Discord phishing/spam/social-engineering scoring and a legal forecasting benchmark show possible high-stakes use, but demand labeled evaluation, abstention, and human review before deployment.

The list also points to discussions worth assigning as optional reading: the Hacker News launch thread, OpenRouter and Cloudflare gateway announcements, an early reranking critique, a first-look calibration test, and several open replica projects. They are recorded in the source ledger, with evidence limits.

### Representative router implementations

#### `gargpratyush/jev-router`

**Source:** [jev-router](https://github.com/gargpratyush/jev-router)  
**Retrieved:** 2026-09-18 by clone and README inspection  
**Status:** `artifact-verified`, community tool

This loopback proxy routes Claude Code and OpenAI Codex requests to a model tier selected by Jev. It keeps native CLI sessions, tools, and authentication intact, makes the first request decision, and pins continuations to that tier. Its policy separates capability filtering, Jev selection, confidence gating, upgrades, and fail-open behavior. Large conversations can avoid a downgrade, unavailable tiers step up, and explicit model requests are respected.

The implementation stores a small recent set of exact requests/responses for explanation and warns that the proxy depends on private/brittle CLI request formats. It sends prompt text to TypeSafe, so privacy is a real design boundary even when headers are forwarded without being read. The important architecture is: use deterministic constraints to remove ineligible models first, use Jev for semantic fit among eligible candidates, and let deterministic fallback preserve availability.

#### `prismhq/jev-router`

**Source:** [prismhq/jev-router](https://github.com/prismhq/jev-router)  
**Retrieved:** 2026-09-18 by clone and source inspection  
**Status:** `artifact-verified`, experimental community LiteLLM proxy

The LiteLLM proxy exposes an OpenAI-compatible `jev-router` model. Its `eligible()` function first filters candidate models by vision, tools, and maximum output capability. `JevDecider` then asks a Choice question over the reduced candidate set. The implementation minimizes the last eight messages and truncates text to 2,000 characters before sending a summary to `https://api.typesafe.ai/v1/systemone`; it defaults to `jev-latest` and a five-second timeout. If the key is absent or the call errors, it falls back to a local cheapest-model baseline.

This is a strong example of code-owned invariants around Jev: it is never asked to choose a model that cannot satisfy the request, and failure of the semantic router does not take down the chat path. The privacy tradeoff is explicit: the minimized summary leaves the process when a key is configured. The implementation is experimental and has no quality evidence.

### `gtaras7/typesafe-jev`: policy-driven CV screening

**Source:** [typesafe-jev](https://github.com/gtaras7/typesafe-jev)  
**Retrieved:** 2026-09-18 by clone and source inspection  
**Status:** `artifact-verified`, community example

The CV screener separates extraction of evidence from policy composition. Its question factory asks narrow judgments about experience, education, sector evidence, age evidence, military status, stability, priority keywords, and evidence quality. It includes no-match options, avoids using Jev for arithmetic/counting, and records a question-version/date token.

The composition layer is pure code: it normalizes weights, applies gates, computes a composite score, and routes human review. Because answers are retained, a policy or threshold can be changed and candidates can be rescored without calling Jev again. This is a useful pattern for the course's workbook and capstone: use Jev to create bounded evidence/features, then keep weights, eligibility gates, authorization, and audit behavior in code. The repository does not prove hiring validity, fairness, or performance.

### `superagents-lab/jev-search`: retrieval plus Jev reranking

**Source:** [Jev Search](https://github.com/superagents-lab/jev-search)  
**Retrieved:** 2026-09-18 by clone and source inspection  
**Status:** `artifact-verified`, community demo

The search application runs search lanes in parallel, uses a Choice to classify intent, then sends one Noul per candidate source to Jev for relevance. It batches up to 40 result items per request, while code performs stale filtering, deduplication, grouping, and final ordering. A speculative external search runs alongside intent classification, and Jev failures are recorded without replacing the deterministic search path.

This demonstrates a practical distinction between retrieval and judgment: code obtains a candidate set; Jev ranks or filters candidates; code preserves provenance and merges results. The application must still validate candidate coverage, because a result omitted by retrieval cannot be selected by Jev. A Noul threshold is a policy choice rather than a universal relevance cutoff.

### `y0usaf/pi-jev`: agent tool-call safety gate

**Sources:** [repository](https://github.com/y0usaf/pi-jev), [gate implementation](https://github.com/y0usaf/pi-jev/blob/main/src/gate.ts)  
**Retrieved:** 2026-09-18 by clone and source inspection  
**Status:** `artifact-verified`, community safety layer; calibration is intentionally incomplete

The Pi coding-agent extension asks four questions in one request: a destructive-action Noul, an exfiltration Noul, a beyond-scope Noul, and an impact Score. Example thresholds are high and configurable. Shadow mode is the default, enforcement asks for confirmation, and headless runs fall back with a warning. It uses a short cache and in-flight deduplication, and all errors fail open.

The README includes a six-state smoke calibration table and explicitly says it is not enough to enforce by default. The extension sends the current working directory, the last user message, tool name, and truncated arguments to TypeSafe; output checks send a truncated result. This makes both the safety boundary and the privacy boundary visible. A guardrail must be evaluated on attack and benign distributions, not just a few hand-written examples, and fail-open behavior must be an explicit risk decision.

### Other artifact examples

The following projects were discovered in `awesome-jev` and checked at the repository/list level. They are useful leads for course examples; unless a separate section above describes source inspection, the claims below are `artifact-verified` only in the narrow sense that the public project/list entry exists:

- [Notra](https://github.com/usenotra/notra) routes marketing classifiers through Boolean Jev decisions behind a feature flag
- [Pi Jev Router](https://github.com/mejiasd3v/pi-jev-router), [JCM Router](https://github.com/adarshmishra07/jcm-router), and [Jev agent skill router](https://github.com/GodsBoy/jev-agent-skill-router) apply typed model/skill routing to coding agents
- [Unclutter](https://github.com/kitze/unclutter) and [typesafe-adblock](https://github.com/realZachi/typesafe-adblock) make per-element browser judgments
- [DiffJury](https://github.com/raihankhan-rk/diffjury), [jev-review](https://github.com/devagrawal09/jev-review), [Foreman](https://github.com/thruwire/foreman), [jev-guard](https://github.com/leepokai/jev-guard), and [OpenWork](https://github.com/different-ai/openwork) put Jev around code review, agent completion, or action approval
- [Clean Code Judge](https://github.com/frostney/clean-code-review) scores named code smells before a writing model produces review prose
- [citation-verifier](https://github.com/MarissaFamularo/citation-verifier) has a generative model locate evidence, Jev judge support, and a human make the final call
- [jev-bfs](https://github.com/komikat/jev-bfs) and [Jev Search](https://github.com/superagents-lab/jev-search) use Jev as a ranking feature while ordinary search controls traversal and provenance
- [Jev Ultrafast](https://github.com/browser-use/jev-ultrafast), [fastbrowse](https://github.com/agent-labs-dev/fastbrowse), and [robo-harness](https://github.com/grmkris/robo-harness) place typed decisions in browser or robot action loops
- [limpet](https://github.com/noplan-inc/limpet), [yoshi](https://github.com/compozy/yoshi), [pi-quiet-ask](https://github.com/HyunjunJeon/pi-quiet-ask), and [super-jev](https://github.com/Kevthetech143/super-jev) use Jev for completion, context, or narrow agent judgments
- [jev-curate](https://github.com/AkashPriyadarshii/jev-curate) and [typeful-triage](https://github.com/cephalization/jev-triage) apply typed filtering or triage to datasets and issues, retaining human corrections
- [typesafe-mario](https://github.com/fhshaik/typesafe-mario), [jev-drone](https://github.com/RomanSlack/jev-drone), [tsai-sc](https://github.com/phyous/tsai-sc), [jev-plays-pokemon](https://github.com/milanboers/jev-plays-pokemon), and [typesafe-jev-drone-demo](https://github.com/kxzk/typesafe-jev-drone-demo) demonstrate simulated control loops
- [Jev Moderation Bot](https://github.com/brainstormity/Jev-Moderation-Bot) and [jev-spam-eval](https://github.com/bitnovus/jev-spam-eval) show moderation/spam use cases that need careful false-positive evaluation
- [LegalForecast-MTD](https://github.com/johnhughes3/LegalForecastBench) reports a legal forecasting benchmark that uses calibrated probabilities and Brier-style metrics; this is high-stakes, author-reported research

## Parallel Judgment Lab

**Source:** [TypeSafe // Parallel Judgment Lab](https://typesafe-parallel-judgment-lab.every-4573.chatgpt.site/#top), [experiments JSON](https://typesafe-parallel-judgment-lab.every-4573.chatgpt.site/downloads/experiments.json), [report](https://typesafe-parallel-judgment-lab.every-4573.chatgpt.site/downloads/experiment-report.md), [notebook](https://typesafe-parallel-judgment-lab.every-4573.chatgpt.site/downloads/typesafe-lab.ipynb)  
**Retrieved:** 2026-09-18 by direct fetch and downloadable artifact inspection  
**Status:** `observed` community experiment, measured 2026-08-28; synthetic/de-identified data and author-run live calls

The site reports 11 experiments, 1,709 judgments, 299 live API calls, and an estimated $0.0081. The run used an alias called `speed_latest`, the TypeSafe System One endpoint, an input price of $0.042/M and free output, and wall-clock timings. Its Slack-like threads were synthetic and de-identified; raw workplace Slack was not published.

The published table reports:

| Experiment | Calls / judgments | Reported latency | Reported result | Evidence boundary |
| --- | ---: | ---: | --- | --- |
| Code repository RAG | 8 / 48 | 385 ms | Recall@1 100%, MRR 1 | six-file toy repository; no production corpus |
| Agent navigation race | 30 / 30 | 559 ms | 30/30 correct; assisted run 25.0 s vs baseline 32.9 s | one synthetic run; end-to-end baseline includes other work |
| Company brain retrieval | 10 / 70 | 510 ms | Recall@3 100%, MRR 1; Recall@1 92.9% | synthetic company documents |
| Judge grid | 30 / 180 | 192 ms | 89% label agreement; repeat variation 0.0013 | labels and repeat design are author-defined |
| Agent action firewall | 10 / 50 | 326 ms | 100% decision agreement | small synthetic test |
| VC diligence matrix | 8 / 64 | 387 ms | 75% tier agreement | synthetic rubric and cases |
| AI writing-pattern checker | 37 / 777 | 612 ms | 100% paired directional separation; mean P(AI) +0.245 | detects controlled patterns, not authorship; no ground truth |
| Customer voice | 24 / 144 | 676 ms | synthetic priority rankings | synthetic labels |
| CEO radar | 18 / 126 | 206 ms | synthetic ranking | synthetic labels |
| Inbox urgency | 24 / 120 | 348 ms | 100% synthetic-label agreement; 12 reply-today items | agreement with generated labels is not real-world accuracy |
| 100-person ad panel | 100 / 100 | 527 ms | modeled share: B 49% / 50 wins | synthetic personas and choice framing |

The code-RAG demo is illustrative of the intended architecture: it created six per-file Noul judgments in eight parallel calls, then ranked files by probability. It reports BM25 baseline Recall@1 0.5, Recall@3 0.833, and MRR 0.708 on the toy corpus. The company-brain experiment makes the same point with a larger document set. These numbers are useful for teaching measurement vocabulary, not for promising a production lift.

The most important methodological lesson is the denominator. The lab mixes model calls, judgments, wall-clock request times, synthetic labels, and application-level outcomes. A future independent evaluation should publish the state, question/version, model ID, answer-space, label provenance, threshold, abstention policy, retries, and downstream action metric for every case. A high agreement number against synthetic labels can still be a poor proxy for customer outcomes.

## Broader community discovery

The following sources were discovered while following the named projects. They are included so the course can offer optional reading and so `/jeverything` can recognize recurring patterns without presenting them as official evidence.

### Capability directories and additional lists

- [TypeSafeAI.app](https://typesafeai.app/) describes itself as an unofficial capability directory. It assigns evidence levels such as author-reported, artifact-verified, and editor-reproduced and tracks roughly 30 records. This is a useful evidence taxonomy, not a first-party certification.
- [What is Jev?](https://typesafeai.app/what-is-jev/) is an independent guide that emphasizes that confidence is not correctness and that typed decisions still need application policy. Treat its current limits and examples as secondary.
- [Awesome Jev by TypeSafe](https://github.com/Anil-matcha/awesome-jev-by-typesafe) is another independent curated list with projects, prompts, and starter code. It is a discovery index; individual links need their own evidence review.

### Independent criticism and public discussion

- [OpenChamber: Jev / TypeSafe AI analysis](https://openchamber.dev/blog/jev-typesafe-ai/) summarizes a large social corpus and reports themes around safety, moderation, support, benchmark methodology, and closed weights/access. It is secondary corpus analysis; the tweet counts and interpretation were not independently recomputed in this pass.
- [Progressive Robot: Jev as programmatic logic](https://www.progressiverobot.com/2026/09/16/jev-model-typesafe-programmatic-logic/) discusses the internal benchmark's lack of independent ground truth and the risk that workflow design favors the vendor's model. Use as a criticism source, not as a measured evaluation.
- [Agent Journal: direct Jev judge vs dimension scores](https://agentjournal.dev/blog/llm-judge-vs-feature-extraction/) reports a locally weighted feature approach beating a direct Jev question on one Japanese NLI evaluation while producing many more hard benign attack flags. This is a useful example of the accuracy/false-positive tradeoff and requires checking the author's dataset and code before reuse.
- [Jev reranking is not a free win](https://x.com/GoSailGlobal/status/2100877682972258619) claims a run over 33,047 catalog entries, 164 real queries, and 9,831 graded pairs where Jev reranking alone did not beat vector retrieval. The X page was not independently fetched in this pass; treat the result as `community-reported`.
- [An early-access test of TypeSafe's Jev](https://lindfors.no/blog/a-first-look-at-typesafes-jev/) reports an independent early-access trial and discusses calibration/cost. It is a useful critique candidate but should be checked for dataset, label, and version details before course use.
- [Hacker News launch thread](https://news.ycombinator.com/item?id=49717558) contains community debate about typed decisions, classification, routing, calibration, and the boundary with chat models. Comments are unverified opinions and should be attributed as discussion, not fact.

### Gateway and framework availability

- [Jev on OpenRouter](https://openrouter.ai/typesafe) lists Jev model variants and a hosted routing option. Listing availability, context values, and pricing can drift; it is not Vercel AI Gateway documentation.
- [Pydantic AI TypeSafe models](https://pydantic.dev/docs/ai/models/typesafe/) documents a community framework mapping `Literal`/`Enum` to Choice, booleans to Noul, and numeric values to Score-like outputs. It also warns that tools may execute and approvals remain application-owned. The framework's mapping and limitations are its integration behavior, not the TypeSafe API contract.
- [Vercel eve](https://github.com/vercel/eve) and [Vercel AI CLI](https://github.com/vercel-labs/ai-cli) appear in the `awesome-jev` list as Jev evaluation integrations. The course's primary Vercel Gateway/API research should verify their current defaults separately.
- [Cloudflare AI Gateway announcement](https://x.com/CloudflareDev/status/2100688880798159254) and the OpenRouter announcement demonstrate expanding proxy availability, but their X pages were not independently fetched in this pass. Avoid treating these as interchangeable with Vercel's gateway behavior.

### Reddit and social examples

Public Reddit/X threads include attempts to make Jev generate text by selecting next tokens or reranking sentence candidates, an idea-scoring app, a personal model router, browser-playground experiments, agent safety monitors, and local/open replicas. These threads are useful for discussing misuse and design boundaries: composing many typed judgments can approximate a generator but is likely inefficient and still requires application-owned text assembly. They are anecdotal, generally small-sample, and not suitable as course performance evidence.

## Reusable design patterns

The sources converge on the following patterns. These are `inferred` engineering guidance synthesized from the official skill, inspected code, and community examples.

### 1. Keep the boundary explicit

```text
event or user input
      |
      v
retrieve and validate facts -> build minimum relevant state
      |
      v
typed questions (Choice / Noul / Score)
      |
      v
Jev response: values + distributions + confidence + usage
      |
      v
application policy: thresholds, invariants, permissions, side effects
      |                    |
      v                    v
automatic low-risk path   clarify, stronger model, queue, or human
```

Jev can judge whether text appears to request a refund. It does not establish that the caller is authorized, that the charge exists, or that a refund has not already been issued. The application must verify those facts before money moves.

### 2. Filter and cover candidates before asking Jev

Deterministic code should first remove impossible candidates based on capabilities, schema, permissions, or retrieval. Jev can then choose among eligible options. A model cannot select a candidate that retrieval omitted, and a Choice cannot express a legitimate outcome missing from its option set. Add `other`, `unknown`, `insufficient_evidence`, or an explicit abstention path when the answer space is open.

### 3. Ask atomic questions and batch independent judgments

Avoid a single question that secretly asks for classification, urgency, justification, and action. Ask independent questions over the same state and batch them when they do not depend on one another. Keep question order, label descriptions, criteria, and state shaping under version control. A second request is justified when an answer changes the next state or answer set; serializing all questions wastes latency.

### 4. Make thresholds a measured policy

A distribution and confidence describe model preference under the supplied question. They do not express business risk. Choose thresholds using labeled examples and asymmetric costs, measure false positives/negatives and abstentions, inspect subgroup behavior, and keep a human path for high-risk or uncertain outcomes. The `jevlogs` and `pi-jev` artifacts show conservative fail-open and shadow modes; the CV screener shows that storing answers lets code change policy without paying for new inference.

### 5. Preserve fallback and provenance

Every integration should record requested model, returned model, question version/hash, state hash or safe state reference, answer/distribution, confidence, usage, latency, retry count, threshold/policy version, and downstream action. Preserve the original/archive path before any filtering. A Jev failure should either fail open to a safe path or fail closed according to the risk analysis; the choice must be explicit.

### 6. Evaluate the whole workflow

Measure retrieval coverage, semantic answer quality, calibration, threshold decisions, downstream action correctness, latency, availability, token cost, and human-review load. Separate API failure, malformed/invalid response, semantic failure, policy failure, and downstream action failure. A cheap, fast judgment can still increase cost if it causes unnecessary fallbacks or retries, and a high-confidence answer can still be wrong because the relevant evidence was never placed in state.

### 7. Treat state as sensitive data

Several artifacts truncate input and redact common secrets, but redaction is not a privacy architecture. Choose fields deliberately, avoid embedding credentials and irrelevant customer history, keep API keys server-side, understand gateway retention settings, and make state hashing/replay safe. A router or guardrail often sends exactly the prompt/tool arguments it is meant to protect; the privacy risk must be evaluated before rollout.

### 8. Version model and question together

Aliases make iteration easy and replay hard. Pin model IDs for threshold-sensitive workflows, record the response model ID, and run canary/shadow comparisons when changing aliases or question definitions. Replaying a stored state with a newer alias does not reproduce an older decision. The LangChain integration's option-order warning and the MindStudio forced-choice example reinforce that labels and order are part of the evaluated interface.

## Failure modes to teach

These are recurring community caveats, not a complete model limitation list:

| Failure | Visible symptom | Smallest supported boundary | Safer response |
| --- | --- | --- | --- |
| Relevant evidence omitted from state | confident answer conflicts with a record the model never received | retrieval/state construction | log state fields or a safe state hash; test omission separately from model judgment |
| Choice answer space incomplete | model selects the least-wrong supplied label | question design | add `other`/`unknown`/review and measure abstention |
| Overlapping Choice criteria | unstable or arbitrary label selection | question criteria | make options mutually exclusive or change to independent Nouls |
| Threshold too permissive | false positives trigger automatic actions | policy | tune on labeled data; use asymmetric costs and a review band |
| Alias moved after release | same replay receives a different distribution | model/version boundary | compare returned model IDs; pin and canary |
| Adversarial or instruction-like state | decision shifts after embedded text | state/question boundary | treat state as untrusted data, test attacks, add deterministic guardrails |
| Numeric/date/counting limitation | wrong arithmetic, date comparison, or encoded number | model semantic limitation | perform exact computation in code and pass results as state |
| Irrelevant context degradation | adding records changes a previously stable judgment | state shaping | retrieve/filter and cap fields; compare minimal vs expanded state |
| Confidence mistaken for correctness | high-confidence wrong route | interpretation/policy | calibrate on target distribution; track action errors and abstentions |
| API overload or retry amplification | latency spikes and duplicate requests | dependency/client | bounded retries, `Retry-After`, backoff, queue limits, safe fallback |
| Output prose expected | application has a label but no user-facing explanation | product boundary | use a generative model or templates for prose; keep Jev as the decision layer |
| Downstream mapping error | correct label goes to wrong queue/action | application code | test mapping/invariants separately from Jev evaluation |
| Sensitive state leakage | prompts/logs contain credentials, PII, or tool arguments | privacy boundary | redact/minimize, review gateway retention, and keep logs safe |
| Simulator success overgeneralized | controlled game/drone demo is treated as real-world safety | evidence boundary | label as simulation; test sensor noise, distribution shift, and human fallback |

## Source ledger

All dates below are retrieval dates in America/New_York on 2026-09-18 unless noted. `Current` means the page was reachable and content was read at retrieval; it does not mean its claims are current product contract.

| URL | Source type | Retrieval/status | Evidence label | Notes |
| --- | --- | --- | --- | --- |
| https://raw.githubusercontent.com/typesafe-ai/skills/main/skills/typesafe-ai/SKILL.md | First-party skill | Current; direct raw fetch | `public-contract` | Starter guidance; official docs remain source of truth |
| https://flaviocopes.com/jev/ | Article | Canonical Cloudflare challenge; read via Jina mirror | `blocked` / `community-reported` | Practical walkthrough; values and API details need official confirmation |
| https://x.com/chddaniel/article/2100925069765534024 | X article | Canonical 403; text preview via FxTwitter status API | `blocked` / `community-reported` | Article pointer resolves to article ID 2100924572543410176 |
| https://api.fxtwitter.com/status/2100925069765534024 | Third-party X mirror | Current JSON | `community-reported` | Retrieval aid only; not canonical source |
| https://www.mindstudio.ai/blog/jev-system-one-model-launch | Article | Current; direct HTML fetch | `community-reported` | Simulator demos and vendor claims |
| https://www.mindstudio.ai/blog/jev-system-one-model-classification | Article | Current; direct HTML fetch | `community-reported` | Small author-run tests; no independent benchmark |
| https://anthonymaio.substack.com/p/jev-the-language-model-that-wont | Analysis | Current; web retrieval | `community-reported` | Strong calibration and benchmark caveats |
| https://www.langchain.com/blog/building-a-harness-with-jev | Article | Current; direct HTML fetch | `community-reported` | Harness, router, and action firewall examples |
| https://github.com/langchain-ai/langchainjs/tree/main/libs/providers/langchain-typesafe | Integration source | Current clone/source inspection | `artifact-verified` | Runnable, retries, timeout, error metadata; integration behavior may drift |
| https://typesafe-parallel-judgment-lab.every-4573.chatgpt.site/#top | Community lab | Current page; reports run measured 2026-08-28 | `observed` | 11 synthetic experiments; author-run live calls |
| https://typesafe-parallel-judgment-lab.every-4573.chatgpt.site/downloads/experiments.json | Experiment data | Current downloadable JSON | `observed` | Reproducible artifact for the published run, not production evidence |
| https://github.com/reachjalil/jevlogs | Open-source integration | Current clone | `artifact-verified` | OTel log filter, Vercel Gateway, fallback and privacy patterns |
| https://github.com/reachjalil/jevlogs/blob/main/skills/jevlogs/SKILL.md | Skill | Current clone/raw read | `artifact-verified` | Use-case discovery, limits, evaluation and safety guidance |
| https://github.com/reachjalil/jevlogs/blob/main/docs/evidence/v0.3.md | Evidence note | Current clone/read | `artifact-verified` | Tests/build pass; live call skipped; no quality result |
| https://github.com/altryne/jevify | Open-source meta-skill | Current clone | `artifact-verified` | Repo inspection workflow and community-discovery references |
| https://github.com/altryne/jevify/blob/main/SKILL.md | Skill | Current clone/raw read | `artifact-verified` | Scoped decision/use-case/implementation process |
| https://github.com/yibie/awesome-jev | Curated list | Current clone; metadata at retrieval | `artifact-verified` | Discovery index; individual entries need evidence checks |
| https://github.com/gargpratyush/jev-router | Router | Current clone/read | `artifact-verified` | Claude/Codex loopback model routing; fail-open and privacy caveats |
| https://github.com/prismhq/jev-router | Router | Current clone/read | `artifact-verified` | Deterministic capability filter then Jev Choice; fallback |
| https://github.com/gtaras7/typesafe-jev | CV screener | Current clone/read | `artifact-verified` | Question factory, pure policy composition, re-scoring |
| https://github.com/superagents-lab/jev-search | Search demo | Current clone/read | `artifact-verified` | Parallel retrieval and Noul reranking; code-owned merge/dedup |
| https://github.com/y0usaf/pi-jev | Agent guardrail | Current clone/read | `artifact-verified` | Shadow/enforce modes, thresholds, cache, fail-open, privacy |
| https://github.com/usenotra/notra | Production-looking classifier entry | Current list/repo link | `artifact-verified` | Public listing establishes artifact; measurements unverified |
| https://github.com/kitze/unclutter | Browser tool | Current list/repo link | `artifact-verified` | Per-element semantic filtering; outcome unverified |
| https://github.com/realZachi/typesafe-adblock | Browser tool | Current list/repo link | `artifact-verified` | Per-element ad decision; outcome unverified |
| https://github.com/MarissaFamularo/citation-verifier | Citation verifier | Current list/repo link | `artifact-verified` | LLM retrieves, Jev judges support, human final |
| https://github.com/frostney/clean-code-review | Code-quality scorer | Current list/repo link | `artifact-verified` | Typed smell scores before prose generation |
| https://github.com/browser-use/jev-ultrafast | Browser agent | Current list/repo link | `artifact-verified` | Repeated action decisions; demo claims unverified |
| https://github.com/different-ai/openwork | Agent verification | Current list/repo link | `artifact-verified` | Jev eval/testkit use; outcome unverified |
| https://github.com/thruwire/foreman | Agent completion judge | Current list/repo link | `artifact-verified` | Typed completion/human-needed judgments |
| https://github.com/leepokai/jev-guard | Agent guard | Current list/repo link | `artifact-verified` | Prompt-injection/dangerous-action use case |
| https://github.com/AkashPriyadarshii/jev-curate | Data curation | Current list/repo link | `artifact-verified` | Noul filtering and confidence fields |
| https://github.com/cephalization/jev-triage | Issue triage | Current list/repo link | `artifact-verified` | Human corrections retained |
| https://github.com/fhshaik/typesafe-mario | Simulator | Current list/repo link | `artifact-verified` | Emulator state/action loop |
| https://github.com/RomanSlack/jev-drone | Simulator | Current list/repo link | `artifact-verified` | MuJoCo demo; no real-world safety evidence |
| https://github.com/brainstormity/Jev-Moderation-Bot | Moderation | Current list/repo link | `artifact-verified` | Phishing/spam/social-engineering decisions |
| https://github.com/johnhughes3/LegalForecastBench | Legal benchmark | Current list/repo link | `artifact-verified` / `community-reported` | High-stakes probabilities; inspect methodology before use |
| https://typesafeai.app/ | Unofficial directory | Current page discovered in web search | `community-reported` | Evidence-level taxonomy and discovery index |
| https://openchamber.dev/blog/jev-typesafe-ai/ | Corpus analysis | Current page discovered in web search | `community-reported` | Tweet corpus themes; counts not independently recomputed |
| https://www.progressiverobot.com/2026/09/16/jev-model-typesafe-programmatic-logic/ | Critical analysis | Current page discovered in web search | `community-reported` | Benchmark and ground-truth criticism |
| https://agentjournal.dev/blog/llm-judge-vs-feature-extraction/ | Evaluation article | Current page discovered in web search | `community-reported` | Feature composition vs direct judge; dataset needed |
| https://lindfors.no/blog/a-first-look-at-typesafes-jev/ | Early-access test | Current page discovered in web search | `community-reported` | Independent trial lead; methodology needs review |
| https://news.ycombinator.com/item?id=49717558 | Discussion | Current page discovered in web search | `community-reported` | Opinions/debate, not evidence |
| https://openrouter.ai/typesafe | Gateway listing | Current page discovered in web search | `community-reported` | Availability/pricing drift; separate from Vercel Gateway |
| https://pydantic.dev/docs/ai/models/typesafe/ | Framework docs | Current page discovered in web search | `artifact-verified` | Type mapping and integration limitations |
| https://github.com/vercel/eve | Vercel integration | Current list/repo link | `artifact-verified` | Listed as Jev evaluator; verify current defaults in official research |
| https://github.com/vercel-labs/ai-cli | Vercel integration | Current list/repo link | `artifact-verified` | Listed as Jev evaluator; verify current release |
| https://x.com/GoSailGlobal/status/2100877682972258619 | Reranking discussion | X canonical not independently fetched | `blocked` / `community-reported` | Claimed 33,047-item test; no independent replication |
| https://x.com/CloudflareDev/status/2100688880798159254 | Gateway announcement | X page not independently fetched | `blocked` / `community-reported` | Availability lead only |
| https://x.com/OpenRouter/status/2100744709589316009 | Gateway announcement | X page not independently fetched | `blocked` / `community-reported` | Availability lead only |

## Evidence limits for the course

The community record is valuable for discovering workflows, failure cases, and implementation seams. It is weak evidence for universal performance. Most examples are early-access demos, synthetic datasets, or author-run tests; several use vendor-designed workflows and labels generated by other models. The course should therefore:

- attribute marketing and benchmark claims to TypeSafe or the reporting author
- prefer official TypeSafe docs and source code for API behavior
- show community repositories as patterns and starting points, not drop-in production guarantees
- reproduce or clearly label any benchmark before using its number
- keep simulator, synthetic, and small-sample results separate from production evidence
- teach confidence as a distribution statistic and policy input, not a correctness guarantee
- require labeled, versioned, risk-aware evaluation before taking an automatic action

The strongest generalizable finding is architectural: Jev is most useful where an application has a repeated semantic decision with a bounded answer space and code can own policy, side effects, and fallback. The strongest recurring warning is equally practical: a typed, high-confidence response can still be wrong when state, criteria, answer-space coverage, or downstream policy is wrong.
