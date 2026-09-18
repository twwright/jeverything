# Jeverything

An evidence-led Jev engineering skill by [twwright](https://github.com/twwright), with Vercel AI Gateway as the preferred integration path.

## Install

```sh
npx skills add twwright/jeverything --skill jeverything
```

Invoke `/jeverything` (or `$jeverything` in Codex) in a repository to identify useful Jev decision boundaries. Ask it to compare scoped options or implement a selected workflow.

The skill supports repository-grounded discovery, scoped recommendations, implementation, and evaluation. The companion [Jev engineering course](https://jeverything.vercel.app/courses/jev) contains 24 lessons, 96 quiz questions, persistent workbooks, a production capstone, and a source ledger. The estimated study time is 31 hours 20 minutes including exercises.

Jev is TypeSafe AI's typed decision model, not a code-generation model. This project is independent of TypeSafe AI and Vercel.

## License

MIT. Copyright 2026 Thomas Wright (twwright).

## Implementation and research

The full skill includes discovery, scoped design, Gateway/native integration, and evaluation references. Start with the [Gateway example](examples/gateway/README.md) or [native SDK examples](examples/native/README.md).

Research was reconciled on September 18, 2026. Read the [contract reconciliation](research/reconciliation.md), [Gateway audit](research/gateway.md), [API/SDK audit](research/api-sdk.md), [primitives and cookbooks](research/semantics-patterns.md), [community review](research/community.md), and [console observations](research/console.md). Mocked tests and source inspection are not live model-quality measurements.
