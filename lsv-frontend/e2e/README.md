# Frontend e2e setup (F0)

The suite uses the isolated Postgres and Valkey containers from the repository root. Start them with `cd lsv-backend && npm run test:e2e:up`, then run `bash e2e/start-test-api.sh` from `lsv-frontend` in a separate terminal. This starts the compiled backend against `.env.test`, with `NODE_ENV=test`, `API_PORT=3001`, and `FRONTEND_URL=http://127.0.0.1:4174` so cookie-authenticated writes pass the trusted-origin check. Override the frontend origin with `PLAYWRIGHT_FRONTEND_URL` if you use another local port. The frontend test server binds to `127.0.0.1:4174` and proxies `/api` to port 3001. The development stack and its database are not used.

Run `npm run test:e2e` from `lsv-frontend`. Playwright global setup logs in once per role with the API, creates a language, stage, region, lesson, regional variant, quiz and sign, registers the student and moderator, assigns the moderator to the test language, and stores browser state under `e2e/.auth/`. The seeder can also be run independently with `npm run test:e2e:seed` after the test API is ready. It uses the admin test credentials from the root `.env.test` and sends Bearer authorization.

On NixOS, the downloaded Playwright Chromium may not launch. `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` selects the system Chromium. For example, obtain its path with `nix-shell -p chromium --run 'command -v chromium'`, then pass that path when running `npm run test:e2e`. In this environment the Nix Chromium 157.0.8103.50 launched and Playwright passed the smoke test when run outside the restricted sandbox, which blocks Chromium's crashpad socket.

The smoke test opens `/`, uses the admin API session to reach the dashboard, then signs out through the UI and verifies the redirect to `/login`.
