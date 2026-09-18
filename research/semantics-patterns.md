# Jev semantics, question design, patterns, and evaluation

Research date: 2026-09-18 (America/New_York)

Scope: Jev's public programming model, state and question semantics, Noul/Choice/Score behavior, confidence and calibration, composition patterns, every cookbook and demo indexed by TypeSafe on the research date, the Jev 1.13 jaggedness note, RLCD claims, and the evaluation literature needed to teach these topics accurately. API transport, SDK operations, Vercel AI Gateway integration, and commercial account details are covered by other research tracks.

## Evidence labels

- **[current]** Directly checked in the live first-party documentation or source on the research date
- **[public-contract]** Behavior the current TypeSafe documentation presents as the supported interface or semantics
- **[vendor-reported]** A TypeSafe result, benchmark, or product claim that this research did not independently reproduce
- **[observed]** A behavior visible in a first-party worked example or published output; it remains an example rather than a general guarantee
- **[historical]** A dated result, model version, price, or behavior retained only as historical evidence
- **[inferred]** An engineering conclusion drawn from the cited evidence rather than a promise made by TypeSafe
- **[academic]** A claim grounded in the cited research paper and not specific to Jev

TypeSafe's docs are moving quickly. Every version-sensitive claim should retain its source URL and research date in derived course content.

## Required entry points

The official TypeSafe agent skill and the documentation index were read first, as instructed:

- [Official TypeSafe agent skill](https://raw.githubusercontent.com/typesafe-ai/skills/main/skills/typesafe-ai/SKILL.md), checked 2026-09-18
- [TypeSafe documentation index](https://docs.typesafe.ai/llms.txt), checked 2026-09-18

The official skill says live docs are the source of truth, recommends selecting a primitive by answer meaning, keeping deterministic work in code, asking independent questions together, testing thresholds on target data, and treating typed output as an interface guarantee rather than truth. **[current]**

## The programming model

Jev is TypeSafe's first and flagship "System One" model. A request supplies one state plus one or more typed questions. Jev evaluates each question against the state and returns constrained answers and probability information; application code owns control flow, deterministic checks, thresholds, authorization, side effects, and fallbacks. It does not generate prose, code, or reasoning traces. **[public-contract]** Sources: [System One](https://docs.typesafe.ai/concepts/system-one.md), [How to build](https://docs.typesafe.ai/concepts/how-to-build-with-system-one.md), [Primitives](https://docs.typesafe.ai/primitives.md).

TypeSafe contrasts this with both ordinary deterministic software and LLM agents: Jev occupies narrow semantic decision points inside a normal workflow. "System One" is a product architecture and training category defined by TypeSafe, not an independently standardized model class. **[current]** The name is inspired by the fast, intuitive "System 1" popularized by Daniel Kahneman. **[current]**

The stable mental model is:

1. Code retrieves and prepares relevant application facts
2. Those facts become `state`
3. Code defines narrow, typed questions
4. Jev returns answers and distributions
5. Code applies policy, thresholds, invariants, authorization, and side effects
6. Code may act, ask for clarification, use a specialist/generative model, or send the case to a person

This boundary is essential: a correct semantic judgment does not prove that an account exists, a user is authorized, a transaction is eligible, or a side effect has not already happened. **[inferred]**

TypeSafe markets System One as fast, inexpensive, calibrated, self-consistent, and optimized for automation. These are vendor claims whose magnitude depends on workload and model version. Type-safe output is stronger: the model is constrained to the supplied answer schema, but that guarantees shape, not truth. **[vendor-reported]** Sources: [launch post](https://typesafe.ai/blog/introducing-system-one-models-and-jev), [System One](https://docs.typesafe.ai/concepts/system-one.md), [workflow evals](https://evals.typesafe.ai/).

## State semantics and design

State is the content evaluated by every question in a request. It may be a string, JSON object, or array containing text values. Objects are the recommended default when a decision needs named fields, relationships, policies, conversations, or records. **[public-contract]** Source: [State](https://docs.typesafe.ai/concepts/state.md).

Jev currently accepts text only. Images, audio, and video are unsupported. JSON structure is accepted because its leaves carry text and its shape preserves relationships. English is the primary training language; other languages, including CJK scripts, are accepted with lower documented accuracy. **[current]** Sources: [System One](https://docs.typesafe.ai/concepts/system-one.md), [State](https://docs.typesafe.ai/concepts/state.md).

All questions in one request see the same state. They are evaluated independently. One answer is not hidden context for another question, and question order is not a dependency chain. **[public-contract]** Source: [Primitives](https://docs.typesafe.ai/primitives.md).

State design rules:

- Put the source text and current facts in state; put the requested judgment and answer definitions in the question **[public-contract]**
- Prefer descriptive object keys when several records or sources must be compared **[public-contract]**
- Refer to nested fields explicitly with backticked paths such as `ticket.messages[0].text` **[public-contract]**
- Retrieve, filter, and normalize before inference; irrelevant detail reduces accuracy and makes failures harder to localize **[public-contract]**
- Include the relationships needed for the judgment rather than flattening related records into an ambiguous paragraph **[inferred]**
- Make missing evidence explicit. A missing field, an `unknown` option, or a separate presence Noul is safer than forcing Jev to infer what is absent **[inferred]**
- Hash or persist the exact serialized state, question definition/version, requested model, returned model, and policy version when decisions must be reproduced **[inferred]**

The current primitives page says the state and questions share a request budget of about 32,000 tokens, roughly 150,000 English characters. Treat "about" as implementation guidance rather than a durable invariant, and recheck before publishing. **[current]** Source: [Primitives, speculative questions](https://docs.typesafe.ai/primitives.md#ask-speculative-questions).

A useful failure boundary is retrieval versus model behavior. If the decisive account fact or passage never entered state, the model did not fail to read it; the retrieval/state assembly stage failed. Log candidate retrieval, filtering, and the final state separately. **[inferred]**

## Question anatomy and fluent question design

Every question has a code-owned ID, a `type`, and `instructions`. Choice and Score require `criteria`; Noul accepts optional true/false criteria. The ID maps the returned answer but is not sent to the model, so the complete meaning must appear in `instructions` and `criteria`. **[public-contract]** Source: [Primitives](https://docs.typesafe.ai/primitives.md).

Instructions, Choice option descriptions, Score level descriptions, and Noul true/false criteria accept `string`, `object`, `array`, or `null`. Object field names such as `question`, `focus`, `what`, `not_for`, and `examples` are conventions chosen by the developer, not reserved API fields. The model sees both keys and values. **[public-contract]** Source: [Advanced structure](https://docs.typesafe.ai/primitives/advanced.md).

Good Jev questions ask for one fast, coherent judgment a knowledgeable person could make quickly given the right facts. "Does this message request a refund?" fits. "Analyze the customer and decide the best action" hides multiple decisions and policy in one question. Split independently useful dimensions and compose them in code. **[public-contract]** Source: [Primitives](https://docs.typesafe.ai/primitives.md).

Atomic does not mean one sentence or literal extraction. A bounded contextual interpretation, such as selecting a handler from defined options after comparing a message and policy, can still be one coherent judgment. **[inferred]**

Question review checklist:

- Does the instruction say exactly what is judged and which state fields matter?
- Does each criterion stand on its own without references such as "worse than the previous level"?
- Are labels mutually exclusive when using Choice, or should several independent Nouls be used?
- Is the answer space complete for real inputs? Add `other`, `none`, `unknown`, or `review` where appropriate
- Are boundary cases, exclusions, and examples explicit where neighboring meanings overlap?
- Do instructions and criteria agree in polarity and meaning?
- Does the question contain a double negative, hidden arithmetic, comparison of dates, counting, or several hops of indirection that code should own?
- Is the question definition versioned and reviewed like code?
- Are examples representative and evaluated on separate held-out inputs rather than judged by confidence alone?

Structured criteria are especially useful for sharp boundaries: `{ what, not_for, examples }` on Choice options; `{ summary, signals }` on Score levels; and `{ true: { what, examples }, false: ... }` on Noul. The structure itself has no magic semantics, but labeled fields can make the intended comparison clearer. **[observed]** Source: [Advanced structure](https://docs.typesafe.ai/primitives/advanced.md).

## Noul

Use Noul for one yes/no proposition. The answer field `noul` is a number from 0 to 1 representing the probability that the answer is yes. Optional criteria define what true and false mean. A high value should conventionally mean the positive condition holds. **[public-contract]** Source: [Noul](https://docs.typesafe.ai/primitives/noul.md).

Noul has no separate `confidence` field because the binary probability already exposes the yes/no balance. Near 1 is strong yes, near 0 strong no, and near 0.5 means yes and no receive similar probability. It does not mean "medium amount." Use Score for an ordered degree. **[public-contract]**

A Noul threshold converts probability into policy, for example `p >= 0.8` to auto-route or `0.3 <= p <= 0.7` to request review. The threshold is not part of Jev's semantic answer and must be chosen from labeled data and error costs. **[inferred]**

Do not assume two separate Nouls are complements. In Jev 1.13's documented example, a refund Noul is 0.72 while a separately worded `not_refund` Noul is 0.47, summing to 1.19. Each question is an independent semantic evaluation. **[observed]** Source: [Jev 1.13 jaggedness, structural invariants](https://docs.typesafe.ai/model-jaggedness/jev-1.13.md#common-sense-structural-invariants).

One Noul per label answers "does this label apply?" independently, allowing none or several to score highly. One Choice asks "which label wins relative to the others?" The two constructions answer different questions and thresholds do not transfer between them. **[public-contract]**

## Choice

Use Choice when exactly one answer should be selected from a fixed, unordered set. `criteria` is a map from option names to descriptions. The returned `choice` is the option with highest probability; `probabilities` includes every option and sums to 1; `confidence` summarizes how concentrated the distribution is. **[public-contract]** Source: [Choice](https://docs.typesafe.ai/primitives/choice.md).

The current page says Choice accepts up to 255 options. Adding options costs question tokens. Give the real answer space rather than an artificially short shortlist, and include an `other` or `none of the above` option when no listed option may fit. **[current]**

Choice probabilities are relative to the supplied option set. A winner exists even when every option is a poor absolute fit. This is why line-by-line search pairs a Choice ranking over line IDs with a Noul asking whether the document contains an answer at all. **[public-contract]** Sources: [Choice](https://docs.typesafe.ai/primitives/choice.md), [Line-by-line search](https://docs.typesafe.ai/cookbooks/semantic_find.md).

Overlapping options lower interpretability and may split probability. Define what each option covers and excludes. If labels may legitimately co-occur, use independent Nouls instead of forcing a Choice. **[inferred]**

## Score

Use Score for one ordered semantic dimension described by discrete levels. `criteria` is an ordered array with at least two and at most ten levels. Array index is the level number, starting at zero. Each level must describe a concrete situation and stand alone because the model gets descriptions rather than a human-style rubric traversal. **[public-contract]** Source: [Score](https://docs.typesafe.ai/primitives/score.md).

The response contains:

- `probabilities`: probability for each level; values sum to 1
- `score`: the probability-weighted expected level index, `sum(index * probability[index])`
- `legend`: level numbers mapped back to descriptions
- `confidence`: a concentration summary derived from the distribution

For probabilities `{0: 0, 1: 0.7, 2: 0.3}`, score is `1.3`. A fractional score means distributional weight between levels. It is not an exact physical measurement or the fraction of users affected. Different distributions can share the same expected score, so inspect probabilities and confidence when the shape matters. **[public-contract]**

Use as many levels as can be described distinctly, not as many as the API permits. Numeric-only labels such as `0`, `1`, `2` do not define the semantic scale. Split multi-dimensional rubrics into one Score per dimension, normalize each by `len(criteria) - 1`, then combine with code-owned weights if compensating tradeoffs are appropriate. Rules such as "any severe violation blocks" need separate conditions rather than a weighted average. **[public-contract/inferred]** Sources: [Score](https://docs.typesafe.ai/primitives/score.md), [Composite scoring](https://docs.typesafe.ai/patterns/composite-scoring.md).

Jev 1.13's numerical calibration across Score levels is documented as weak. Do not interpolate an exact amount from neighboring levels. Use Score for semantic placement, ranking, or a tested threshold; use code for exact numbers. **[public-contract]** Source: [Jev 1.13 jaggedness, math using score](https://docs.typesafe.ai/model-jaggedness/jev-1.13.md#math-using-score).

## Probability, confidence, and calibration

Choice and Score return a full distribution and a `confidence` value from 0 to 1 derived from the shape of that distribution. Concentrated distributions have higher confidence; flatter distributions have lower confidence. Noul returns only its yes probability. **[public-contract]** Source: [Confidence](https://docs.typesafe.ai/confidence.md).

The exact confidence formula is not published in the current docs. It must not be reverse-engineered from a few examples or described as entropy, margin, top probability, or probability of correctness without evidence. Developers can compute a different statistic from the full distribution if their use case requires it. **[current/inferred]**

Confidence is not a universal probability that the answer is correct, does not include retrieval correctness or downstream policy correctness, and does not authorize an action. A low Choice confidence may mean several options are similarly plausible; a low Score confidence may mean levels overlap, the state is missing evidence, or the question mixes dimensions. A harmless preference selection may remain useful at low confidence. **[public-contract/inferred]**

TypeSafe says RLCD, "Reinforcement Learning for Calibrated Decisions," trains decisions and probabilities so higher probability corresponds to greater empirical correctness. It contrasts RLCD with RLHF and RLVR. Public materials do not disclose enough training detail to independently assess the algorithm. Treat RLCD as TypeSafe terminology and calibration performance as a claim to validate in the target domain. **[vendor-reported]** Sources: [AI primer](https://docs.typesafe.ai/introduction/machine-learning-primer.md), [launch post](https://typesafe.ai/blog/introducing-system-one-models-and-jev).

Calibration is a cohort property. If predictions assigned about 0.8 are calibrated, roughly 80% of the corresponding outcomes should occur across a suitable group of cases. It is not a guarantee about one prediction. **[public-contract/academic]** Sources: [AI primer](https://docs.typesafe.ai/introduction/machine-learning-primer.md), [Guo et al. 2017](https://proceedings.mlr.press/v70/guo17a.html).

Accuracy/discrimination and calibration are different. A score can rank positives above negatives well while probabilities are systematically too high or low; a constant base-rate predictor can be calibrated but useless for discrimination. Evaluate both. **[academic/inferred]**

### Production evaluation recipe

Use a labeled, representative, time-bounded dataset and preserve exact state/question/model versions. **[inferred]**

For each question or action policy:

1. Measure task performance: accuracy and confusion matrix for Choice; ROC-AUC or precision-recall where a Noul is thresholded; ordinal error/rank behavior for Score
2. Plot reliability: group predictions into probability ranges and compare predicted probability with observed frequency
3. Report a proper scoring rule such as Brier score and/or log loss; both reward probability quality, not only hard labels
4. Treat common expected calibration error (ECE) estimates carefully because results depend on arbitrary bins and finite samples
5. Measure coverage versus selective risk when abstention or human review is allowed
6. Choose thresholds by expected error/review costs and operational capacity, then confirm them on held-out data
7. Break results down by meaningful subgroups, languages, input lengths, missing-data patterns, and adversarial exposure
8. Re-run the same evaluation for every model or question change and retain canary/rollback evidence

Useful academic sources:

- [On Calibration of Modern Neural Networks](https://proceedings.mlr.press/v70/guo17a.html) (Guo et al., ICML 2017): modern neural networks can be miscalibrated; temperature scaling is a simple post-hoc method in the studied settings **[academic]**
- [Evaluating probabilistic classifiers: Reliability diagrams and score decompositions revisited](https://arxiv.org/abs/2008.03033) (Dimitriadis, Gneiting, Jordan, 2020): conventional binned reliability diagrams are unstable; CORP supplies a consistent, optimally binned, reproducible alternative and score decomposition **[academic]**
- [Better Uncertainty Calibration via Proper Scores for Classification and Beyond](https://arxiv.org/abs/2203.07835) (Gruber and Buettner, 2022): common calibration-error estimators can be biased or inconsistent; proper calibration errors connect calibration to proper scores **[academic]**
- [Calibration of Pre-trained Transformers](https://aclanthology.org/2020.emnlp-main.21/) (Desai and Durrett, EMNLP 2020): evaluates calibration of BERT/RoBERTa on NLI, paraphrase, and commonsense tasks **[academic]**
- [How Can We Know When Language Models Know?](https://aclanthology.org/2021.tacl-1.57/) (Jiang et al., TACL 2021): generative LM probabilities on QA were poorly calibrated in the tested models and tasks; calibration methods change this behavior **[academic]**
- [Multicalibration: Calibration for the (Computationally-Identifiable) Masses](https://proceedings.mlr.press/v80/hebert-johnson18a.html) (Hebert-Johnson et al., ICML 2018): aggregate calibration does not imply calibration across important overlapping subgroups **[academic]**
- [Multicalibration for Confidence Scoring in LLMs](https://proceedings.mlr.press/v235/detommaso24a.html) (Detommaso et al., ICML 2024): applies multicalibration to confidence scores for LLM outputs **[academic]**

These papers explain how to evaluate Jev outputs; none independently validates Jev or RLCD. **[inferred]**

## Composition patterns

### Speculative fan-out

Ask all independent questions that may be useful against the same state in one request, including branch-specific questions whose answers code may ignore. State each speculative premise explicitly. This avoids repeated state tokens and round trips. Extra questions still consume tokens. **[public-contract]** Source: [Speculative fan-out](https://docs.typesafe.ai/patterns/fan-out.md).

Make a second request only when the first answer is required to fetch new evidence, construct new state, or determine the next answer options. The official examples are skill suggestion (fetch full text of top three after ranking), structure recovery (blocks do not exist until lines are stitched), and hierarchical classification (the selected/retained paths determine the next menus). **[public-contract]** Source: [Primitives](https://docs.typesafe.ai/primitives.md#when-one-question-depends-on-another).

### Confidence-gated routing

Use the answer for direction and confidence/probability for policy. High-certainty, low-risk cases may be automated; uncertain cases may ask for clarification, broaden to a coarser label, invoke a stronger model, or enter human review. Boundaries depend on error costs, not on a universal `0.5`, `0.8`, or `0.9`. **[public-contract/inferred]** Source: [Confidence-gated routing](https://docs.typesafe.ai/patterns/confidence-routing.md).

### Composite scoring

Ask separate Score questions for independent dimensions, normalize scales, and combine using visible code-owned weights. Reweighting or filtering does not require new inference while evidence and question meanings remain unchanged. Weighted sums are appropriate only when dimensions compensate for one another. **[public-contract/inferred]** Source: [Composite scoring](https://docs.typesafe.ai/patterns/composite-scoring.md).

### Intent routing

Use a Choice for the requested handler or intent and optional Score/Noul questions for complexity, risk, or required evidence. Code routes to deterministic functions, specialist models, generative models, or people. The selected route does not remove ordinary authorization and validation. **[public-contract/inferred]** Source: [Intent routing](https://docs.typesafe.ai/patterns/intent-routing.md).

## Complete cookbook ledger

The following were all cookbook pages listed in `llms.txt` on 2026-09-18. Cookbook thresholds and benchmark numbers are examples or dated vendor results, not default policy.

1. [Self-consistency: nouls](https://docs.typesafe.ai/cookbooks/consistency_noul_cookbook.md) repeats a 14-Noul insurance rubric 15 times. TypeSafe reports mean per-question probability standard deviation 0.0102, with one `covered` answer crossing a 0.5 threshold. It demonstrates a 0.30-0.70 review band while explicitly saying the band is illustrative. The run used `jev-latest`, which returned `jev-1.13.0`, on 2026-09-11. **[vendor-reported, dated]**
2. [Self-consistency: choices](https://docs.typesafe.ai/cookbooks/consistency_choice_cookbook.md) repeats eight moderation Choices 15 times. TypeSafe reports 90.8% plurality-label agreement, two flipped questions, and 99.2% agreement with automatic labels on 74.2% of answers after a 0.60 top-probability abstention rule. The study deliberately changes an irrelevant `uid`, so it cannot separate identical-request nondeterminism from sensitivity to that field. **[vendor-reported, dated]**
3. [Parallel questions](https://docs.typesafe.ai/cookbooks/parallel_questions.md) compares one batched 13-question GDPR request with 13 single-question requests over five repeats. It reports unchanged answers, 12.2x lower cost, and 10.0x lower latency for batching on this document-dominated workload. **[vendor-reported, dated]** Note a live-doc inconsistency: the primitives page still says 11.5x and 9.6x for the same cookbook. Derived material should use the cookbook's current result and flag that the summary elsewhere is stale. **[current]**
4. [Re-ranking](https://docs.typesafe.ai/cookbooks/rerank_typesafe.md) uses BM25 to shortlist 30 passages for 40 CLERC legal queries, then a Noul per query-candidate pair. Reported retrieval moves top-1 from 5% to 18%, top-5 from 15% to 35%, and top-10 from 38% to 62%. It makes 1,200 Jev 1.12 calls. The reranker cannot recover a passage omitted by retrieval. **[vendor-reported, dated]**
5. [Line-by-line search](https://docs.typesafe.ai/cookbooks/semantic_find.md) gives 218 line IDs to a Choice for relative ranking and pairs it with a Noul asking whether any answer exists. This directly demonstrates why a Choice winner is not proof of absolute suitability. **[public-contract/observed]**
6. [Structure recovery](https://docs.typesafe.ai/cookbooks/autoformat.md) reconstructs Markdown without generating new text. Pass 1 asks a Noul per adjacent line break and stitches blocks; pass 2 classifies the newly created blocks with Choice plus speculative companion questions. Blank lines and explicit markers remain deterministic code evidence. The published example reports two requests, 10,211 tokens, 0.8 seconds, and $0.0015. **[vendor-reported, dated]**
7. [Function calling](https://docs.typesafe.ai/cookbooks/function_calling.md) maps natural-language trading commands to one of ten ordinary typed functions and closed-set arguments. Function and enum selection become Choices; confidence can gate dispatch. Open/free-form arguments require another extraction technique. **[public-contract/observed]**
8. [Skill suggestion](https://docs.typesafe.ai/cookbooks/skill_suggestion.md) ranks 182 skills and separately asks whether any skill is needed, then fetches full details for the top three and may reject them all. On 488 vendor-run requests, wrong-skill loading falls from 16.8% to 7.3%, and unnecessary loading from 9.8% to 4.0%. It is the canonical Choice-relative plus Noul-absolute example. **[vendor-reported, dated]**
9. [Knowledge graph entity alignment](https://docs.typesafe.ai/cookbooks/entity_alignment.md) uses a three-level Score whose levels are actual actions: keep separate, send to curator, merge. Three companion Nouls say which fields disagree. Rounding the Score selects the route without fitting a separate threshold, but production accuracy still needs evaluation. **[public-contract/inferred]**
10. [Classifying RAG passages](https://docs.typesafe.ai/cookbooks/classifying_rag_passages.md) asks four Nouls per retrieved passage: relevance, usable evidence, contradiction of the query premise, and embedded instructions. Code routes passages into evidence, conflict, or drop blocks before generation. It separates retrieval quality, passage judgment, prompt construction, and generator behavior. **[public-contract/observed]**
11. [Double-checking citations](https://docs.typesafe.ai/cookbooks/citation_check.md) first uses exact string matching to find fabricated quotes, then Choice classifies surviving source context as supporting, contradicting, or unrelated. A confidence threshold sends uncertain verdicts to review. The eight-example run catches four planted failures, but it is a small worked example, not an accuracy estimate. **[observed]**
12. [Guardrails for LLMs](https://docs.typesafe.ai/cookbooks/llm_guardrails.md) applies hazard Nouls plus a harm Score to both model inputs and outputs. Code-owned policies map the same probability vector to pass, review, block, or crisis support. It demonstrates separating semantic detection from organization-specific policy. It does not prove adversarial robustness. **[public-contract/inferred]**
13. [SDE cascade](https://docs.typesafe.ai/cookbooks/sde_cascade.md) extracts with a cheaper generative model, verifies each field using Jev Nouls for failure signals, and escalates suspicious cases to a reasoning model. It teaches a verifier as an error detector rather than asking Jev to generate the field. Published model prices and comparative results are dated snapshots. **[vendor-reported, dated]**
14. [Date extraction](https://docs.typesafe.ai/cookbooks/date_extraction_cookbook.md) asks Choices for date kind and named components, then resolves absolute/relative dates and validates calendar math in code. Missing values and invalid combinations go to review. Jev reads the text; code owns arithmetic. **[public-contract/observed]**
15. [Pre-parsed value extraction](https://docs.typesafe.ai/cookbooks/pre_parsed_value_extraction_cookbook.md) intentionally over-finds candidate emails, phone numbers, and amounts with regex, uses Choice to select the requested span and Nouls/Choices for attributes, then copies and normalizes the exact candidate in code. Jev cannot invent a value outside the candidate set, but omitted candidates remain unrecoverable. **[public-contract/inferred]**
16. [Hierarchical classification](https://docs.typesafe.ai/cookbooks/hierarchical_classification.md) walks pinned CPC, Shopify, MeSH, and source-tree hierarchies. Greedy search keeps only the best child; beam search retains `K` paths and asks their frontier Choices in parallel. It ranks paths by geometric mean probability, preferably `exp(mean(log(p)))` for deep trees, and reports top/second separation. This path score is cookbook application logic, not a Jev-calibrated probability of the leaf. **[public-contract/inferred]**
17. [Autoresearch feature discovery](https://docs.typesafe.ai/cookbooks/autoresearch_feature_discovery.md) has a generative proposer create Jev Score/Noul questions, converts Jev answers into numeric features, and uses held-out feedback to revise/drop them for CatBoost wine-score prediction. On 2,000 reviews with 800 held out, TypeSafe reports RMSE 3.09 for the mean baseline, 2.47 for word counts, 2.15 for a direct Jev Score, 1.87 for 18 proposed questions, and 1.77 after five rounds/38 questions. It is a dated workflow result, not general evidence for Jev feature quality. **[vendor-reported, dated]**
18. [Classification using confidence](https://docs.typesafe.ai/cookbooks/classification_using_confidence.md) classifies 60 SEC filings into 75 SIC groups and uses confidence below 0.9 to return the broader division. The confident half is reported 90% correct at group level; the uncertain half 40% at group level and 70% when broadened to division. Labels were filtered so filing text supported the self-reported code, limiting generalization. Numbers use Jev 1.12 on 2026-08-12. **[vendor-reported, dated]**

## Demos

The docs index listed one demo on the research date:

- [Smart home assistant](https://docs.typesafe.ai/demos/smart-home.md) fans out questions for request category, domain, device, and action in one call. It sends compound requests to a generative model for splitting into atomic commands, then evaluates each command with Jev. General conversation routes to a generative model. The page says source code "will be available" rather than linking a released repository, so implementation details beyond the page are proposed/unavailable. **[current/proposed]**

This demo reinforces two boundaries: speculative branch questions are useful when they share the original state, while text generation and decomposition of compound commands remain generative-model tasks. **[inferred]**

## Jev 1.13 jaggedness and safer architecture

The [Jev 1.13 jaggedness page](https://docs.typesafe.ai/model-jaggedness/jev-1.13.md) applies specifically to `jev-1.13` and was last reviewed 2026-09-17. Later model versions may differ. **[current]**

| Limitation | Behavior and visible symptom | Reproduction evidence | Safer architecture |
| --- | --- | --- | --- |
| Literal reading | Scoping words, negation, and implied conditions are taken literally; a plausible answer may miss the developer's unstated intent | Exact state, exact wording, criteria, returned distribution, intended boundary | State the exact condition; add boundary cases; split interpretations and combine in code |
| Counting | Character, term, and list counts are unreliable and degrade with size | Compare model answer with a parser/count over the same input | Parse/count in code; if membership is semantic, ask one question per item and sum in code |
| Numeric representation | Hex/RGB proximity, binary/assembly representations, and numeric semantics underperform named semantic representations | Paired test with raw numeric encoding versus code-converted named bucket | Convert in code; ask only the semantic judgment |
| Score interpolation | Expected Score is weakly numerically calibrated and does not recover exact magnitude | Inputs with known numeric truth across adjacent levels | Compute exact values in code; use Score for semantic levels/ranking only |
| Date/time comparison | Ordering, duration, ranges, quarters, and mixed/relative dates are unreliable | Known date pairs and formats with deterministic ground truth | Extract enumerated components with Choice; resolve, compare, and validate in code |
| Indirection | Double negatives and multi-hop properties reduce accuracy | Minimal pairs with direct versus indirect wording | Point to relevant named state; remove hops; use positive direct wording |
| Irrelevant context | Larger unrelated state distracts the model and obscures attribution | Same labeled cases with and without irrelevant fields | Retrieve/filter first; log the final state; classify passages for relevance when filtering is semantic |
| Adversarial state | Injected instructions or self-advocating text can move answers | Adversarial variants of representative state | Treat state as untrusted; precise criteria; adversarial evals; deterministic isolation and human fallback for high stakes |
| Contradictory instructions/criteria | Opposed polarity or meanings confuse the model | Same state with aligned versus contradictory criteria | Make criteria an extension of instructions; keep polarity consistent |
| Structural assumptions | Separate semantic questions need not satisfy arithmetic identities; Noul and negation may not sum to 1; Choice yes probability need not equal equivalent Noul | Compare exact question variants and response distributions | Ask one decision one way; keep type-specific thresholds; enforce invariants in code |
| Generation | Chained Choices are slow and poor for free text | Compare with a generative model on actual text task | Use a generative model; for bounded extraction generate/parse candidates then let Jev select |
| Non-English behavior | Accepted but documented as less accurate than English, including CJK | Per-language labeled evaluation | Evaluate each language; translate or route when measured performance requires it |
| Incomplete answer space | Choice still returns a winner; omitted source candidates cannot be selected | No-match and missing-candidate cases | Add other/unknown/review; use an absolute Noul; validate candidate coverage |
| Version regression | Aliases and models can change behavior even with the same state/questions | Replay frozen evaluation set with requested and returned model IDs | Pin for critical flows; canary new versions; preserve rollback and question versions |

The page also warns against asking Jev for tasks code can compute, hiding multiple judgments in one question, System Two/multi-hop tasks, and oversized state. **[public-contract]**

## Claims that must remain attributed

The following should never appear as independent facts without qualification:

- "Fast" or "about 100 ms": TypeSafe documentation/vendor measurement, dependent on request, region, load, and date
- "Calibrated": training goal/vendor claim until demonstrated on the target question distribution
- "Self-consistent": design goal with published examples that also show label flips
- "Cheaper": current vendor pricing and workload-dependent comparison
- "Cannot hallucinate" or "zero hallucinations": only defensible in the narrow sense that constrained outputs cannot invent a value outside the supplied schema; Jev can still select a semantically wrong option with high probability
- "No type errors": constrained response-shape claim, not correctness of meaning
- "Two orders of magnitude": vendor workflow evaluation using TypeSafe-created workflows and model-generated reference probabilities, with disclosed but material limitations

Sources: [launch post](https://typesafe.ai/blog/introducing-system-one-models-and-jev), [workflow evals](https://evals.typesafe.ai/), [self-consistency Nouls](https://docs.typesafe.ai/cookbooks/consistency_noul_cookbook.md), [self-consistency Choices](https://docs.typesafe.ai/cookbooks/consistency_choice_cookbook.md).

## Skill and course implications

The `/jeverything` skill should discover opportunities by finding semantic decisions inside deterministic workflows, not by replacing whole modules with Jev. High-value seams include routing, ranking, verification, bounded extraction, risk detection, ordinal scoring, classification before specialist/generative handling, and semantic filters after deterministic retrieval. **[inferred]**

Its recommendations should always show:

- Exact state shape and the retrieval source for each field
- Exact question type, instructions, criteria, and question ID
- Why the primitive matches the answer meaning
- Which decisions remain ordinary code
- How missing evidence and no-match cases behave
- Which probabilities/confidence fields drive which policy
- Initial thresholds labeled as hypotheses until evaluated
- Service-failure and low-confidence fallback
- Requested and returned model logging plus question version
- A target-domain evaluation plan, including subgroup and adversarial cases

The course should explicitly teach four different confidence boundaries:

1. Answer uncertainty: Jev's probability distribution
2. Model performance uncertainty: finite evaluation evidence and calibration error
3. Workflow uncertainty: retrieval, policy, authorization, and downstream correctness
4. Operational uncertainty: timeouts, overload, retries, and version changes

Conflating these is the most likely path to over-automation. **[inferred]**

## Source ledger

Primary TypeSafe sources checked 2026-09-18:

- https://raw.githubusercontent.com/typesafe-ai/skills/main/skills/typesafe-ai/SKILL.md
- https://docs.typesafe.ai/llms.txt
- https://docs.typesafe.ai/introduction.md
- https://docs.typesafe.ai/concepts/system-one.md
- https://docs.typesafe.ai/concepts/state.md
- https://docs.typesafe.ai/primitives.md
- https://docs.typesafe.ai/primitives/noul.md
- https://docs.typesafe.ai/primitives/choice.md
- https://docs.typesafe.ai/primitives/score.md
- https://docs.typesafe.ai/primitives/advanced.md
- https://docs.typesafe.ai/confidence.md
- https://docs.typesafe.ai/introduction/machine-learning-primer.md
- https://docs.typesafe.ai/concepts/how-to-build-with-system-one.md
- https://docs.typesafe.ai/patterns.md
- https://docs.typesafe.ai/patterns/fan-out.md
- https://docs.typesafe.ai/patterns/confidence-routing.md
- https://docs.typesafe.ai/patterns/composite-scoring.md
- https://docs.typesafe.ai/patterns/intent-routing.md
- https://docs.typesafe.ai/demos.md
- https://docs.typesafe.ai/demos/smart-home.md
- https://docs.typesafe.ai/model-jaggedness/jev-1.13.md
- All 18 cookbook URLs linked in the complete cookbook ledger above
- https://typesafe.ai/blog/introducing-system-one-models-and-jev
- https://evals.typesafe.ai/

Academic sources checked 2026-09-18:

- https://proceedings.mlr.press/v70/guo17a.html
- https://arxiv.org/abs/2008.03033
- https://arxiv.org/abs/2203.07835
- https://aclanthology.org/2020.emnlp-main.21/
- https://aclanthology.org/2021.tacl-1.57/
- https://proceedings.mlr.press/v80/hebert-johnson18a.html
- https://proceedings.mlr.press/v235/detommaso24a.html

## Open evidence gaps

- TypeSafe does not publish the current `confidence` formula. **[current]**
- Public material names RLCD and describes its goal but does not provide a peer-reviewed method, loss definition, training data, or independently reproducible training protocol. **[current]**
- Public workflow evals use reference probabilities produced by frontier models and TypeSafe-designed harnesses. They are useful engineering examples, not ground-truth validation of all claims. **[current/inferred]**
- The docs currently contain a stale numerical summary for the parallel-questions cookbook (11.5x/9.6x on the primitives page versus 12.2x/10.0x on the cookbook page). **[current]**
- The smart-home demo page says source code will be released, so its full implementation could not be inspected from the documentation link. **[current]**
- No paid Jev calls were made in this research. Cookbook outputs were read as published and labeled vendor-reported or observed accordingly. **[current]**
