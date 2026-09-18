# Native Jev examples

These examples use TypeSafe's official native SDKs. They pin the Jev model to `jev-1.13.0`, keep the API key in `TYPESAFE_API_KEY`, set bounded retries, and apply the returned judgment in application code.

They make a live, billable request when executed. Static checks need no credential and make no network inference call.

## JavaScript and TypeScript

```sh
cd examples/native/javascript
npm install --ignore-scripts --registry=https://registry.npmjs.org
npm run typecheck
```

To make the live request after setting a server-side `TYPESAFE_API_KEY`:

```sh
npm start
```

## Python

```sh
python3 -m venv .venv
. .venv/bin/activate
python -m pip install --index-url https://pypi.org/simple -r examples/native/python/requirements.txt
pyrefly check examples/native/python/evaluate_ticket.py
python -m py_compile examples/native/python/evaluate_ticket.py
```

To make the live request after setting a server-side `TYPESAFE_API_KEY`:

```sh
python examples/native/python/evaluate_ticket.py
```
