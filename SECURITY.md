# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in LSV, please report it privately.

1. Open a [GitHub security advisory](https://github.com/quijadajose/learn-sign-language/security/advisories/new) on this repository, **or**
2. Email the maintainers with a description, impact, and steps to reproduce.

Please do **not** open a public issue for security problems until a fix is available.

## Supported Versions

Security fixes are applied to the `main` branch. Deploy from `main` for production.

## Hardening Notes

- Never commit `.env` files or real credentials.
- Rotate `JWT_SECRET`, `TRAINER_JOB_SECRET` (if set), database, and Valkey passwords before any production deploy.
- Image uploads require authentication; only allowlisted folders are accepted.
- Access JWTs live in an httpOnly `lsv_access` cookie. Login and Google exchange do not return the token in JSON. Logout increments `tokenVersion` so a copied JWT stops working.
- Google OAuth uses a short-lived one-time code exchange (JWT is never placed in redirect query strings). Codes are stored in Valkey with TTL so they work across API replicas.
