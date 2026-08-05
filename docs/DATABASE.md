# Database setup (Prisma + VPS Postgres)

Runtime queries still go through `lib/db.ts` helpers. Under the hood they use a tagged-template SQL shim over `PrismaClient` (standard Postgres wire protocol). Schema is owned by `prisma/schema.prisma`.

## Fresh VPS / local Postgres

1. Create a database and user on your VPS (or local Postgres).
2. Copy `.env.example` → `.env` and set:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DBNAME"
# Use ?sslmode=require when the server requires TLS.
# Omit SSL for private/local networks if appropriate.
```

3. Install and apply schema:

```powershell
npm install
npx prisma generate
npx prisma db push
npm run db:seed
```

4. Start the app: `npm run dev` or `npm run build` / `npm start`.

## Notes

- Do **not** use Neon HTTP serverless URLs — they will not work with Prisma’s wire protocol.
- Historical `scripts/*.sql` and Neon-based migrate scripts are reference only; new environments use `db:push` + seed.
- Runtime `ensure*` DDL helpers in `lib/db.ts` are no-ops; change schema only via Prisma.
- Optional later: `prisma migrate` for versioned migrations once the schema is stable.
- Data move from Neon: `pg_dump` / restore into VPS Postgres separately.
