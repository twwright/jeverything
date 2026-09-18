# Jeverything

An evidence-led Jev engineering skill by [twwright](https://github.com/twwright), with Vercel AI Gateway as the preferred integration path.

## Install

```sh
npx skills add twwright/jeverything --skill jeverything
```

Invoke `/jeverything` (or `$jeverything` in Codex) in a repository to identify useful Jev decision boundaries. Ask it to compare scoped options or implement a selected workflow.

The initial release supports repository-grounded discovery, scoped recommendations, and live-contract implementation guidance. Research-backed references and a complete technical course are in development. No claim of exhaustive coverage is made by this initial release.

Jev is TypeSafe AI's typed decision model, not a code-generation model. This project is independent of TypeSafe AI and Vercel.

## License

MIT. Copyright 2026 Thomas Wright (twwright).

## Implementation and research

The full skill includes discovery, scoped design, Gateway/native integration, and evaluation references. Start with the [Gateway example](examples/gateway/README.md) or [native SDK examples](examples/native/README.md).

Research was reconciled on September 18, 2026. Read the [contract reconciliation](research/reconciliation.md), [Gateway audit](research/gateway.md), [API/SDK audit](research/api-sdk.md), [primitives and cookbooks](research/semantics-patterns.md), [community review](research/community.md), and [console observations](research/console.md). Mocked tests and source inspection are not live model-quality measurements.
