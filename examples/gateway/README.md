# Gateway integration example

This server-side TypeScript example uses AI SDK 7.0.105 and Gateway 4.0.85. It separates state, typed questions, and application policy. The tests use synthetic, mocked answers and make no network calls. They validate the integration contract and routing policy, not Jev accuracy or calibration.

```sh
pnpm install
pnpm typecheck
pnpm test
```

To call `triage()` against Gateway, provide `AI_GATEWAY_API_KEY` in the server environment or use supported Vercel OIDC. Never expose credentials to browser code. Thresholds in `examplePolicy` are illustrative; evaluate replacements on labeled data before deployment. The result selects a queue and cannot issue refunds.

The four exact dependency release-age exceptions are local to this example because evaluation first shipped less than the configured age window ago. No global package-manager configuration is changed. Their source behavior was inspected in the linked research notes.

Sources checked September 18, 2026: [Gateway evaluation](https://vercel.com/docs/ai-gateway/modalities/evaluation), [AI SDK evaluation](https://ai-sdk.dev/docs/ai-sdk-core/evaluation).
