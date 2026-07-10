# MTB Standalone

Standalone React + Express + PostgreSQL version of the MTB review application.

## Prerequisites

- Node.js 24+
- Local PostgreSQL server
- Use `npm.cmd` in PowerShell on this machine because `npm.ps1` is blocked by execution policy.

## Setup

1. Install dependencies:

   ```powershell
   npm.cmd install
   ```

2. Create `server/.env` from `server/.env.example` and update `DATABASE_URL`.

3. Create the database in PostgreSQL, then run:

   ```powershell
   npm.cmd run db:migrate
   npm.cmd run db:seed
   npm.cmd run dev
   ```

Client: http://localhost:5173

Server: http://localhost:3001
