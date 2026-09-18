# Course validation

Verified September 18, 2026.

Public course: https://jeverything.vercel.app/courses/jev

The course was implemented in the existing digdeep application. It includes 24 lessons, 104 chapters, 96 quiz questions with explanations for every option, 24 persistent workbooks, 69 glossary entries, and 73 sources. Estimated study time is 1,880 minutes (31 hours 20 minutes), including applied exercises. It covers state/question design, all three primitives, probability and policy, Gateway and native APIs/SDKs, evaluation, production operation, and a fictional support-workflow capstone.

## Checks

- `pnpm validate:content`: passed for both existing courses
- `pnpm typecheck`: passed
- `pnpm lint`: passed
- `pnpm test`: 9 passed
- `pnpm build`: passed; 53 static pages in the full local application
- `pnpm test:e2e`: 22 passed across desktop and mobile, including every course route, browser runtime errors, horizontal overflow, progress persistence, imports/exports, quizzes, search, and disclosures
- Public Jev-only production build: passed, 32 static pages
- Gateway example: typechecked; 6 mocked tests passed
- Native JavaScript example: typechecked
- Native Python example: Pyrefly and compilation passed
- Downloadable capstone: typechecked; 7 mocked tests passed

A browser audit found invalid paragraph nesting in a shared KnowledgeCheck component. It was corrected before deployment, and route tests now assert no unhandled browser errors. Desktop and mobile visual checks covered the catalog, dashboard, lessons, code, disclosures, quiz feedback, capstone, source ledger, and both themes.

The public deployment excludes the existing private course files and generates a Jev-only registry. Anonymous requests to the public dashboard, lessons, sources, glossary, and downloadable example files return 200; the private course route returns 404. Existing local courses and progress storage remain supported.

## Evidence limits

The course reconciles public contracts, source inspection, community reports, and limited native console observations. It does not claim knowledge of private inference architecture, guaranteed calibration, or independent performance superiority. Gateway and capstone tests use synthetic responses; no live Gateway quality benchmark was run. Prices, aliases, SDK behavior, and provider availability should be refreshed before production adoption. Gateway's returned model identifier does not establish a pinned native Jev backend version.
