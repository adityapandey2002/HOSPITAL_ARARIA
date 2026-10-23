# Domain Docs

How the engineering skills should consume this repo's domain documentation when exploring the codebase.

## Layout: multi-context

This repo is an npm-workspaces monorepo (`apps/*`, `packages/*`), but the domain contexts are the backend bounded contexts, not the workspaces. `GLOSSARY-MAP.md` at the repo root is the index.

Contexts are directories under `apps/backend/src/modules/`, each paired with its own `GLOSSARY.md` and `docs/adr/`. The frontend and UI packages share a single `portal` context.

```
/
├── GLOSSARY-MAP.md
├── AGENTS.md
├── docs/
│   ├── agents/                     ← this file
│   └── adr/                        ← system-wide decisions
└── apps/backend/src/modules/
    ├── appointments/
    │   ├── GLOSSARY.md
    │   └── docs/adr/               ← context-scoped decisions
    ├── grievances/
    │   ├── GLOSSARY.md
    │   └── docs/adr/
    ├── blood-bank/
    │   ├── GLOSSARY.md
    │   └── docs/adr/
    ├── notices/
    │   ├── GLOSSARY.md
    │   └── docs/adr/
    └── abdm/
        ├── GLOSSARY.md
        └── docs/adr/
```

Note the paths differ from the seed template's `src/<context>/` convention: this repo's contexts sit under `apps/backend/src/modules/<context>/`, and the `portal` context's glossary sits at the frontend package rather than under `src/`.

## Before exploring, read these

- **`GLOSSARY-MAP.md`** at the repo root: it points at one `GLOSSARY.md` per context. Read each one relevant to the topic.
- **`docs/adr/`**: read ADRs that touch the area you're about to work in. In multi-context repos, also check `apps/backend/src/modules/<context>/docs/adr/` for context-scoped decisions.

If any of these files don't exist, **proceed silently**. Don't flag their absence; don't suggest creating them upfront. The `/domain-modeling` skill (reached via `/grill-with-docs` and `/improve-codebase-architecture`) creates them lazily when terms or decisions actually get resolved.

## Use the glossary's vocabulary

When your output names a domain concept (in an issue title, a refactor proposal, a hypothesis, a test name), use the term as defined in `GLOSSARY.md`. Don't drift to synonyms the glossary explicitly avoids.

If the concept you need isn't in the glossary yet, that's a signal: either you're inventing language the project doesn't use (reconsider) or there's a real gap (note it for `/domain-modeling`).

## Flag ADR conflicts

If your output contradicts an existing ADR, surface it explicitly rather than silently overriding:

> _Contradicts ADR-0007 (event-sourced orders), but worth reopening because…_
