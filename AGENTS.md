# Project agent memory

This file is the project's committed home for project-intrinsic agent knowledge: build, test, release, architecture, and sharp-edge notes that should travel with the code.

- This repo publishes three separate npm packages from three long-lived branches off the same history: `dev` (current/default), `teslemetry` (`homebridge-teslemetry`), and `tessie`. Each branch has its own `package.json` version and dependency set; a fix for one published package must be branched from and PR'd against that package's branch, not `dev`. `publish.sh` walks all three branches and runs `npm publish` from each - it is run manually, not via CI.
- No automated tests exist. Verify changes by building (`npm run build`), linting (`npm run lint`), and, for logic changes, a throwaway smoke script that imports the compiled `dist/*.js`, mocks the `homebridge` `log`/`api` objects, and drives the relevant code path - see recent PR history for the pattern.
- `tesla-fleet-api`'s `_request()` rejects with a plain `{ status, data }` object (not an `Error`) when the Tesla/Teslemetry API returns a non-OK HTTP response, where `data` is the parsed JSON error body (often `{ error: "<message>" }`). Any `.catch()` on a `tesla-fleet-api` call should destructure `{ status, data }` and log the operation name plus `data?.error` (or the raw error as a fallback for non-API-shaped rejections like network failures) - never log a caught error bare, since that produces contextless output like a bare `Not Found`.

## Maintaining this file

Keep this file for knowledge useful to almost every future agent session in this project.
Do not repeat what the codebase already shows; point to the authoritative file or command instead.
Prefer rewriting or pruning existing entries over appending new ones.
When updating this file, preserve this bar for all agents and keep entries concise.
