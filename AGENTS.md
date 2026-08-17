# Repository Guidelines

## Project Structure & Module Organization

This is a TypeScript npm workspace with two main modules:

- `client/`: React + Vite frontend using Material UI and MUI DataGrid.
- `server/`: Express API backed by PostgreSQL.
- `script.sql`: source schema for the `mtbtracking` database.
- `MTB_DesignDocument.docx`: original feature/design reference.

Frontend source lives in `client/src/`. Key files are `App.tsx` for workflow state/layout, `config.ts` for table/form definitions, `api.ts` for HTTP calls, and `components/` for reusable UI. Backend source lives in `server/src/`, with routes in `index.ts`, generic CRUD helpers in `crud.ts`, and database scripts in `server/src/db/`.

## Build, Test, and Development Commands

Run commands from the repository root. Use `npm.cmd` in PowerShell.

- `npm.cmd install`: install workspace dependencies.
- `npm.cmd run db:migrate`: create/update PostgreSQL schema from `script.sql`.
- `npm.cmd run db:seed`: insert sample MTB workflow data.
- `npm.cmd run dev`: start server and client together.
- `npm.cmd run build`: typecheck/build both workspaces.
- `npm.cmd run build --workspace client`: build only the frontend.
- `npm.cmd run build --workspace server`: build only the backend.

The API normally runs on `http://localhost:3001`. Vite usually runs on `http://localhost:5173`, or `5174` if `5173` is busy.

## Coding Style & Naming Conventions

Use TypeScript throughout. Prefer small, explicit functions and keep domain mappings centralized in `client/src/config.ts` or backend route configs. Use two-space indentation for JSON and existing TypeScript style with semicolons. React components use PascalCase, hooks/state use camelCase, and API resource names use kebab-case endpoints such as `genetic-counseling-genes`.

Do not commit generated folders or local secrets. `.gitignore` excludes `node_modules`, `dist`, `.env`, `.env.local`, coverage, and logs.

## Testing Guidelines

No automated test framework is currently configured. Before committing, run:

```powershell
npm.cmd run build
```

For database-related changes, also run:

```powershell
npm.cmd run db:migrate
npm.cmd run db:seed
```

Manually verify the patient-to-recommendation workflow in the browser after UI or API changes.

## Commit & Pull Request Guidelines

The current history uses concise, descriptive commit messages, for example: `Initial MTB standalone app checkpoint`. Continue using imperative or checkpoint-style summaries under 72 characters when practical.

Pull requests should include a short description, affected areas (`client`, `server`, database), verification commands run, and screenshots for UI changes. Mention schema or seed-data changes explicitly.

## Security & Configuration Tips

Keep real database credentials in `server/.env`; commit only `server/.env.example`. Avoid placing PHI or production clinical data in seed files, logs, screenshots, or commits.
