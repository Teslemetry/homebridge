# Project agent memory

Project-intrinsic agent knowledge: build, test, release, and sharp edges that travel with the code.

- Three long-lived branches publish from one history: `dev` (default) and `teslemetry` both carry the package name `homebridge-teslemetry`; `tessie` carries `homebridge-tessie`. Each branch has its own version and dependency set, so a fix for a published package must be branched from and PR'd against that package's branch, not `dev`.
- `rebase.sh` (present on the product branches) rebases `teslemetry` and `tessie` onto `dev` and force-pushes, so a change made on `dev` - workflows included - reaches them on the next rebase rather than being duplicated per branch. Between rebases the branches diverge: check the target branch before assuming a file you saw on `dev` exists there.
- Releasing is two workflows in `.github/workflows/`: `version-pr.yml` (manual `workflow_dispatch`, pick branch + bump) opens a version-bump PR; merging it pushes a `package.json` change, which triggers `publish.yml`. That re-runs the `build.yml` CI gate on the merge commit, then waits on the protected `npm-publish` environment (required reviewer, restricted to `dev`/`teslemetry`/`tessie`) before publishing to npm and cutting a GitHub release. Read those files for the rest.
- The `npm-publish` environment has no `NPM_TOKEN` secret, so the publish step cannot succeed until a repo/org admin adds one - it is not settable with the API access agents have.
- CI installs with `pnpm install --frozen-lockfile` (package manager pinned via `packageManager` in `package.json`) and runs lint, build, and test against the committed lockfile. CI must never mutate dependencies (`npm`/`pnpm audit fix`) or push lockfile changes; that defeats a frozen, reproducible install. The `pnpm audit` step is advisory only and must not fail the build.
- `npm test` compiles `src` + `test` via `tsconfig.test.json` into `dist-test`, then runs `node --test`. Tests in `test/` drive the code against hand-written fakes for the slice of the HAP/Homebridge API touched - no hap-nodejs or homebridge instance needed.
- Most logic still has no automated test. Verify a change with `npm run build` and `npm run lint`, plus - where useful - a throwaway script that imports the compiled `dist/*.js` with mocked homebridge `log`/`api` objects and drives the code path.

## Maintaining this file

Keep this file for knowledge useful to almost every future agent session in this project.
Do not repeat what the codebase already shows; point to the authoritative file or command instead.
Prefer rewriting or pruning existing entries over appending new ones.
When updating this file, preserve this bar for all agents and keep entries concise.
