# Deploy trackmcp-web to AWS App Runner (via CloudShell)

This ships the app as a container (Next.js standalone server) to **AWS App Runner**
— a fixed-price, autoscaling service with built-in HTTPS. No local Docker needed.

## Why App Runner (container) and not Amplify / OpenNext
Next.js 16 is very new; the OpenNext and Amplify SSR adapters often lag new Next
versions. A container just runs the standard `next start` server, so middleware,
dynamic OG images, ISR, and the React Compiler all work exactly as they do locally.

---

## One-time setup

1. Open the AWS Console, pick your region (top-right), then launch **CloudShell**
   (the `>_` icon in the top bar). CloudShell already has Docker + AWS CLI and
   uses your account credentials.

2. Clone the repo and enter the app directory:
   ```bash
   git clone https://github.com/Krishna3956/CRV.git
   cd CRV/trackmcp-nextjs
   ```
   (If the repo is private, use a GitHub token when prompted for a password.)

3. Create your deploy config from the template and fill in real values:
   ```bash
   cp deploy/env.deploy.template deploy/.env.deploy
   nano deploy/.env.deploy
   ```
   Paste the same values you use in `.env.local`. Set `AWS_REGION` to the region
   you want to host in. Save with Ctrl+O, Enter, Ctrl+X.

After the Founder OS read-model migrations have been applied and their
postflight queries return clean results, set
`TRACKMCP_ENABLE_FACT_WRITES="true"` in `.env.deploy` before the release. The
template uses `false` as the safe default; enabling writes is an explicit
operator decision after the migration/postflight evidence is recorded. Set it
back to `false` if a deployment targets a database where those migrations have
not been applied. Ingestion remains fail-open either way.

The deployment script fails before making AWS changes if fact writes or the
distributed rate limiter are enabled without `SECRETS_ARN`. Those paths require
the runtime Supabase service-role secret; otherwise the container could start
successfully while the selected Founder OS features fail at runtime.

When `TRACKMCP_ENABLE_FACT_WRITES="true"`, `TRACKMCP_RATE_LIMIT_MODE` must also
be explicitly set to `memory` or `supabase`. An empty mode is rejected in this
configuration so a multi-instance pilot cannot silently ship process-local
rate-limit counters. Use `supabase` for shared App Runner enforcement after the
rate-limit migration and its read-only postflight have been verified.

`TRACKMCP_TRUST_PROXY` defaults to `false`. Set it to `true` only after
verifying that the App Runner edge strips client-supplied `X-Forwarded-For`
and rewrites forwarding headers with the actual client address. The deploy
preflight accepts only the explicit `true` or `false` values.

4. Run the deploy:
   ```bash
   bash deploy/apprunner-deploy.sh
   ```
   This creates an ECR repo, builds + pushes the image, creates the IAM access
   role, and creates the App Runner service.

5. Watch it come up (first deploy takes a few minutes):
   ```bash
   aws apprunner list-services --region <your-region> --output table
   ```
   When status is `RUNNING`, open the `ServiceUrl` — that's your live app on a
   `*.awsapprunner.com` URL. Test it before touching DNS.

---

## Shipping updates later
```bash
cd CRV/trackmcp-nextjs && git pull
# bump IMAGE_TAG in deploy/.env.deploy (e.g. v2), then:
bash deploy/apprunner-deploy.sh
```

---

## Custom domain (do this only after the app tests good on the AWS URL)
1. App Runner console -> your service -> **Custom domains** -> add your domain.
2. App Runner gives you CNAME/validation records. Add them at your DNS provider.
3. Once validated, point your root/`www` record at the App Runner target.
   Lower the DNS TTL a day beforehand so cutover is fast and reversible.
4. Keep Vercel live until DNS fully propagates and the AWS site is verified, then
   remove the Vercel deployment.

---

## Cost notes
- App Runner bills for provisioned container memory + active vCPU. Production is
  configured at 1 vCPU / 4 GB
  a low-traffic site runs a few dollars a month; your AWS credits cover it for a
  long time. Unlike Vercel, there is no per-invocation function charge.
- To trim cost further later: drop to 0.5 vCPU / 1 GB, or move to ECS Fargate +
  CloudFront for CDN caching at scale.
- Supabase is unchanged and independent of this migration.

## Secrets (GitHub / Supabase / device approval / admin / workers)
These are pulled from **AWS Secrets Manager**, not stored as plaintext env vars.
Set `SECRETS_ARN` in `deploy/.env.deploy` to a secret **in the same region as the
service** whose value is JSON containing the required keys, for example
`{"GITHUB_TOKEN":"...","SUPABASE_SERVICE_ROLE_KEY":"...","TRACKMCP_DEVICE_KEY_DERIVATION_SECRET":"...","TRACKMCP_ADMIN_KEY":"...","TRACKMCP_REFRESH_WORKER_SECRET":"...","TRACKMCP_PRIVACY_REVIEW_SECRET":"..."}`.
The deploy script then:
- creates an instance role (`AppRunnerInstanceRole`) allowed to `GetSecretValue`, and
- wires the configured secret fields via App Runner `RuntimeEnvironmentSecrets`.

`SECRETS_ARN` is required for this production deployment path. Without it,
the service would start without the server-only capabilities that protect and
complete device authorization, ingestion, and internal operations.

For an existing service, add the new JSON keys to the same regional Secrets
Manager secret, then run the deploy script once after adding the new JSON keys.
That deployment updates the service's secret mapping. Later
`aws apprunner start-deployment` only rolls out the already-configured service;
it does not add a newly named secret field to its runtime configuration.

`TRACKMCP_DEVICE_KEY_DERIVATION_SECRET` is a dedicated, high-entropy secret for
hashing device authorization values. `TRACKMCP_ADMIN_KEY` protects internal
operator endpoints. Neither is a browser value, a public build argument, or a
substitute for `SUPABASE_SERVICE_ROLE_KEY`.

`TRACKMCP_PRIVACY_REVIEW_SECRET` is only used by the internal, non-destructive
privacy review queue. It is never exposed to the browser or included in public
responses. Do not enable the review route without this secret and an operator
runbook.

If your secret lives in another region, replicate it into the service region first:
`aws secretsmanager replicate-secret-to-regions --secret-id <arn> --add-replica-regions Region=<service-region>`.
To rotate a key, update the secret value in Secrets Manager (replicas sync
automatically) and redeploy so the running instances pick it up.
