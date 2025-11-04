# findMate Admin Panel

Lightweight admin UI for findMate.

Run locally:

1. Install deps

```bash
cd web/admin
npm install
```

2. Start dev server

```bash
npm run dev
```

API base URL can be set with `VITE_API_BASE` environment variable (default: `http://localhost:5001/api`).

Authentication:

- Admins are regular users with `is_admin` flag set in the database. The admin UI reads the JWT token from `localStorage.token` and sends it as `Authorization: Bearer <token>`.

This is an initial scaffold with Dashboard, Users and Items pages. Next steps:

- Add login screen and session handling
- Add user detail modal and role toggle
- Implement audit logs and CSV export
- Add tests and CI
