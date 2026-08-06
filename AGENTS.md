# Project agent memory

This file is the project's committed home for project-intrinsic agent knowledge: build, test, release, architecture, and sharp-edge notes that should travel with the code.

- This repo publishes three separate npm packages from three long-lived branches off the same history: `dev` (current/default), `teslemetry` (`homebridge-teslemetry`), and `tessie`. Each branch has its own `package.json` version and dependency set; a fix for one published package must be branched from and PR'd against that package's branch, not `dev`.
- Releasing a branch is two workflows, both in `.github/workflows/`: `version-pr.yml` is a manual `workflow_dispatch` (pick the branch and bump type) that opens a version-bump PR against that branch; merging that PR pushes a `package.json` change to the branch, which triggers `publish.yml`. That workflow re-runs the full CI gate (`build.yml`, now also `workflow_call`-triggered) on the exact merge commit, then requires approval via the `npm-publish` GitHub environment (protected: required reviewer + restricted to `dev`/`teslemetry`/`tessie`) before publishing to npm and cutting a GitHub release tagged `<package-name>-v<version>`. There is no more `publish.sh` walk. The `npm-publish` environment needs an `NPM_TOKEN` secret (repo or org admin action, not settable via the API access available to agents) before publishing will actually succeed.
- CI (`.github/workflows/build.yml`) is currently identical across `dev`, `teslemetry`, and `tessie`; `rebase.sh` rebases the product branches onto `dev`, so a workflow change made on `dev` propagates to the others on the next rebase rather than needing to be duplicated per branch.
- CI installs with `pnpm install --frozen-lockfile` (this repo's package manager is pinned via the `packageManager` field in `package.json`), and runs lint, build, and test against the committed lockfile - it does not run `npm/pnpm audit fix`, since a CI step that mutates and force-pushes dependency changes defeats a frozen, reproducible install. An advisory-only `pnpm audit` step is fine; it must not fail the build.
- Most logic changes still have no automated tests. Verify them by building (`npm run build`), linting (`npm run lint`), and, where useful, a throwaway smoke script that imports the compiled `dist/*.js`, mocks the `homebridge` `log`/`api` objects, and drives the relevant code path. A few committed cases do have real tests (e.g. `test/index.test.ts` for plugin registration, `test/platform.test.ts` for config parsing) using node's built-in test runner against fakes for the slice of the HAP/Homebridge API touched - no hap-nodejs/homebridge instance needed. Run them with `npm test` (compiles `src` + `test` via `tsconfig.test.json` into `dist-test`, then runs `node --test`).

## Maintaining this file

Keep this file for knowledge useful to almost every future agent session in this project.
Do not repeat what the codebase already shows; point to the authoritative file or command instead.
Prefer rewriting or pruning existing entries over appending new ones.
When updating this file, preserve this bar for all agents and keep entries concise.
