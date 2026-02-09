# Sentinel's Journal - Critical Security Learnings

## 2025-02-18 - [Critical] Optional Webhook Secrets Bypass
**Vulnerability:** The GitHub webhook endpoint (`app/api/webhooks/github/route.ts`) skipped signature verification if `GITHUB_WEBHOOK_SECRET` environment variable was missing. This allowed unauthenticated requests to trigger internal processes (Inngest events) simply by omitting the secret in configuration.
**Learning:** Optional environment variables for security secrets can lead to silent failures where security controls are bypassed entirely if configuration is incomplete.
**Prevention:** Always enforce strict validation for security-critical secrets. If a secret is missing, the application should fail securely (reject requests or crash on startup) rather than degrading to an insecure state. Use `zod` schema validation to ensure secrets are present in production.
