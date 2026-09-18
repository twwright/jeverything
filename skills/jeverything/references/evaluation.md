# Evaluating a Jev workflow

Verified 2026-09-18 against TypeSafe's live docs, published cookbooks, Jev 1.13 jaggedness, Vercel AI Gateway evaluation behavior, and primary calibration literature.

Read this reference before recommending thresholds, shipping a Jev path, or diagnosing a failed evaluation.

## Define success at the workflow boundary

Start with labeled examples of the user-visible decision, not a few pleasing model outputs. Freeze the exact state builder, question definitions, requested provider/model, returned metadata, code policy, and expected outcome for each case.

Separate four failure classes:

1. **Evidence failure:** required information was not retrieved, filtered, or included in state
2. **Judgment failure:** the state and question were sufficient but the semantic answer was wrong
3. **Policy failure:** the answer was reasonable but the threshold, weights, or business rule produced the wrong action
4. **Operational/downstream failure:** timeout, rate limit, retry amplification, invalid response, stale state, or incorrect action mapping

Typed output proves interface shape, not semantic correctness. Confidence does not cover all four classes.

## Build the evaluation set

Include representative ordinary traffic and deliberately difficult cases:

- Clear positives and negatives
- Missing required evidence
- Ambiguous wording and overlapping Choice labels
- Legitimate no-match outcomes
- Boundary probabilities near every proposed threshold
- Long state with irrelevant detail
- Contradictory instructions and criteria
- Double negatives and indirect references
- Adversarial text that tries to steer the evaluator
- Non-English inputs used in production
- Candidate lists missing the correct value
- Version-sensitive regressions and downstream label mappings

Preserve subgroup labels when performance may differ by language, product, customer segment, input length, or evidence availability. Aggregate calibration can hide subgroup failure.

Do not use Jev for exact arithmetic, counting, numeric conversion, date comparison, or free-text generation. A test that exposes one of these requirements should cause an architecture change, not prompt tuning.

## Metrics by primitive

### Boolean or Noul

- Confusion matrix at each candidate threshold
- Precision, recall, false-positive rate, and false-negative rate
- ROC-AUC or precision-recall AUC when ranking quality matters
- Brier score or log loss for probability quality
- Reliability curve: compare predicted probability ranges with observed positive frequency

Near 0.5 means similar yes/no probability. A separate negated question is not guaranteed to equal `1 - p`.

### Choice

- Accuracy and confusion matrix by option
- Top-probability distribution and margin between leading alternatives
- No-match error rate when an `other`/`unknown` route exists
- Coverage and error among automatically handled cases after abstention
- Reliability for the chosen option where labels and sample size support it

Choice probabilities are relative to the provided set. A high-probability winner can still be unsuitable if the answer space is incomplete.

### Score

- Distribution over levels, not only mean score
- Ordinal error or rank correlation for the semantic ordering
- Error around policy cutoffs and rounded-level routes
- Per-level confusion after rounding, if code uses a discrete action
- Confidence and missing-evidence behavior

Score is `sum(level_index * probability)`. Different distributions can have the same score. Jev 1.13 is weak at numerical calibration across Score levels, so do not interpret interpolation as an exact quantity.

## Thresholds are policy

Choose thresholds from labeled target data and consequences. For a threshold `t`, estimate the expected cost of false positives, false negatives, review, clarification, and delay. Include reviewer capacity and fallback availability.

Use held-out data for the final choice. Report:

- Threshold and question/model version
- Automatic-action coverage
- Error rate among automatic actions
- Review/clarification rate
- False positives and false negatives, including subgroup results
- Expected operational cost and latency

Cookbook values such as 0.5, 0.6, 0.8, or 0.9 are examples, not defaults. Measure coverage and observed error at every candidate threshold; raising a threshold does not guarantee lower observed risk. Threshold changes also do not repair a bad answer space or missing state.

For high-stakes actions, keep deterministic authorization and confirmation even when model confidence is high.

## Calibration discipline

Calibration is a population property: among predictions near probability `p`, the positive outcome should occur about `p` of the time. It is not a guarantee about one answer.

Use reliability diagrams and a proper scoring rule such as Brier score or log loss. Treat expected calibration error carefully because bin choices and small samples can change it. Measure discrimination separately; a well-ranked model can be miscalibrated, while a constant base-rate predictor can be calibrated but useless.

TypeSafe says Jev is trained for calibrated decisions. Validate this on the deployed questions and state distribution. The current public docs do not publish the exact Choice/Score confidence formula; do not call confidence entropy, margin, or probability of correctness.

Primary background:

- [Guo et al., On Calibration of Modern Neural Networks](https://proceedings.mlr.press/v70/guo17a.html)
- [Dimitriadis et al., Reliability diagrams and score decompositions revisited](https://arxiv.org/abs/2008.03033)
- [Hebert-Johnson et al., Multicalibration](https://proceedings.mlr.press/v80/hebert-johnson18a.html)

## Errors, retries, and safe fallback

For Vercel AI Gateway through AI SDK:

- Invalid input: `InvalidArgumentError`
- Unsupported question type: `Experimental_EvaluationUnsupportedQuestionTypeError`
- Invalid output: `InvalidResponseDataError`
- Provider/model resolution: `NoSuchProviderError`, `NoSuchModelError`, or `UnsupportedModelVersionError`
- Abort errors are not retried
- Core defaults to two retries, using retry headers when reasonable and exponential backoff otherwise
- Structural answer validation happens after the retry wrapper; do not retry until a semantically invalid answer happens to pass

Provide an `AbortSignal` deadline. Bound end-to-end attempts so overload does not become retry amplification. Define behavior for timeout, rate limit, malformed response, absent probabilities from a non-Jev adapter, and partial downstream failure. Evaluation returns one complete result; there is no streaming or partial success.

Test policy separately with `Experimental_EvaluationMockModelV4` from `ai/test`. Cover positive, negative, and uncertain probabilities for every judgment, plus the first omitted candidate and a decisive fact beyond each input cap. Assert the final user-visible decision, not just that the request contains the expected fields. Exercise the actual SDK contract with a mock model. Default tests must remain offline even when credentials happen to be present.

Label mocks clearly. Live model calls require explicit user authorization for that run and its data; credential availability is not approval. A credentialed smoke test proves connectivity and response shape, not calibration or production reliability. If the provider rejects access, report the boundary and stop rather than changing account policy or switching providers.

## Rollout and regression

Start with offline replay or shadow evaluation. Compare the proposed Jev result with the existing path without changing user-visible behavior. Inspect disagreements by exact state, question, answer distribution, policy, and expected outcome.

Promote only when the adoption criterion is met. Use a small canary for reversible behavior, retain the prior path, and log enough safe metadata to compare versions. Gateway's model ID does not establish the underlying native Jev version; if immutable backend selection is required and Gateway has no documented pin, use a verified native versioned model or do not claim replay reproducibility.

Re-evaluate when any of these change:

- State retrieval or serialization
- Instructions, criteria, options, or levels
- Thresholds, weights, or downstream mapping
- Provider, alias, SDK, retry behavior, or model
- Input population or business policy

Sources: [TypeSafe confidence](https://docs.typesafe.ai/confidence.md), [Jev 1.13 jaggedness](https://docs.typesafe.ai/model-jaggedness/jev-1.13.md), [self-consistency Nouls](https://docs.typesafe.ai/cookbooks/consistency_noul_cookbook.md), [self-consistency Choices](https://docs.typesafe.ai/cookbooks/consistency_choice_cookbook.md), and [Gateway integration details](integration.md).
