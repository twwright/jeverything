# Native Jev example validation

Validated 2026-09-18 without credentials and without an inference request.

## Scope

These checks establish that the examples parse and typecheck against the current public SDK packages. They do not establish authentication, live API behavior, model resolution, latency, accuracy, calibration, or cost.

## JavaScript and TypeScript

Example: `examples/native/javascript/evaluate-ticket.ts`

Environment and dependencies:

- Node: repository environment, package declares Node 20 or newer to match the SDK package contract
- `@typesafe-ai/sdk@0.6.0`
- `tsx@4.23.13`
- `typescript@5.9.3`
- Registry: public `https://registry.npmjs.org`

Commands:

```sh
cd examples/native/javascript
npm install --ignore-scripts --registry=https://registry.npmjs.org
npm run typecheck
npm ls --depth=0
```

Results:

- Install passed with zero reported vulnerabilities
- TypeScript strict `tsc --noEmit` passed
- Dependency tree resolved exactly `@typesafe-ai/sdk@0.6.0`, `tsx@4.23.13`, and `typescript@5.9.3`
- Runtime import inspection reported SDK `VERSION` 0.6.0 and the expected exports
- The example was not executed because execution requires `TYPESAFE_API_KEY` and makes a billable external call

## Python

Example: `examples/native/python/evaluate_ticket.py`

Environment and dependencies:

- Isolated virtual environment: `/tmp/jeverything-native-python-venv`
- Python 3.14.3
- `typesafe-sdk==0.7.0`
- `pyrefly==1.2.0`
- Registry: public `https://pypi.org/simple`

Commands:

```sh
python3 -m venv /tmp/jeverything-native-python-venv
/tmp/jeverything-native-python-venv/bin/python -m pip install \
  --index-url https://pypi.org/simple \
  -r examples/native/python/requirements.txt

cd examples/native/python
VIRTUAL_ENV=/tmp/jeverything-native-python-venv \
  PATH=/tmp/jeverything-native-python-venv/bin:$PATH \
  pyrefly check evaluate_ticket.py
/tmp/jeverything-native-python-venv/bin/python -m py_compile evaluate_ticket.py
```

Results:

- Package install passed and resolved `typesafe-sdk` 0.7.0 from public PyPI
- Pyrefly passed with 0 errors using its basic preset
- Python bytecode compilation passed
- Import inspection loaded `typesafe_sdk` from the isolated environment
- The example was not executed because execution requires `TYPESAFE_API_KEY` and makes a billable external call

One validation pitfall was reproduced: invoking the Pyrefly binary by absolute path without setting `VIRTUAL_ENV` and putting the virtual environment first on `PATH` made Pyrefly inspect the system interpreter and report `Cannot find module typesafe_sdk`. Activating the isolated environment fixed module discovery. This was a checker-environment problem, not an SDK typing error.

## Contract findings that need conservative examples

- Official API prose says question `instructions` is required; live OpenAPI and both SDK type surfaces allow absence or null. Both examples supply explicit instructions
- API prose and JavaScript enforce at least two Score levels; live OpenAPI permits one and Python only rejects an empty list. Both examples use three levels
- JavaScript permits top-level null state in its public type, but live OpenAPI excludes null. Both examples send an object
- Live OpenAPI does not set a minimum Choice count. Examples use three options and include `other`
- Native JavaScript does not runtime-validate successful responses. Python does validate them through strict Pydantic models
- Native JavaScript has no total retry budget; Python defaults to a 30 second retry budget. The examples add an outer JavaScript abort deadline and a 20 second Python retry budget
- Native and Gateway credentials, field names, retry defaults, and model IDs differ. These examples intentionally exercise the official native SDKs only

## Legal publication boundary

The current [TypeSafe Master Customer Agreement](https://typesafe.ai/legal/mca), updated 2026-08-27, states in section 2.3 that the restriction applies to the customer and also prohibits attempts or allowing its applications or users to perform the listed acts. Clause 2.3(b) includes the exact phrase "perform model distillation" and extends to training an imitator or developing a similar or competing product. Clause 2.3(f) says "publish benchmarks or performance information about the Services."

The publication clause is narrower than a blanket ban on internal testing: its verb is "publish." These validation checks only confirm local SDK compatibility and make no performance claim. Before publishing original latency, accuracy, calibration, cost-performance, or comparison results about Jev, obtain contract or legal confirmation. Existing TypeSafe-authored benchmark claims may be described as attributed vendor claims rather than independently reproduced facts.

## Evidence used

- JavaScript SDK tag `v0.6.0`, commit `66880ccded6cb642dc1809620c2b108c33730214`: https://github.com/typesafe-ai/typesafe-sdk-js/tree/66880ccded6cb642dc1809620c2b108c33730214
- Python SDK tag `v0.7.0`, commit `2ce5c65f13646cab6e6f782328194c9d85f3300a`: https://github.com/typesafe-ai/typesafe-sdk-python/tree/2ce5c65f13646cab6e6f782328194c9d85f3300a
- Live OpenAPI: https://api.typesafe.ai/openapi.json
- API docs: https://docs.typesafe.ai/api.md
- Model docs: https://docs.typesafe.ai/models.md
- Vercel Gateway research: `research/gateway.md`
