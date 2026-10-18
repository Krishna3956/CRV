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

## Runtime secrets (AWS Secrets Manager)
These are pulled from **AWS Secrets Manager**, not stored as plaintext env vars.
Set `SECRETS_ARN` in `deploy/.env.deploy` to a secret **in the same region as the
service** whose value is JSON with these keys:

```json
{
  "GITHUB_TOKEN": "...",
  "SUPABASE_SERVICE_ROLE_KEY": "...",
  "TRACKMCP_DEVICE_KEY_DERIVATION_SECRET": "<dedicated-random-secret>",
  "TRACKMCP_ADMIN_KEY": "<admin-reporting-secret>"
}
```

`TRACKMCP_DEVICE_KEY_DERIVATION_SECRET` is required for CLI device-key
redemption in production. It must be a dedicated random secret; do not reuse
the Supabase service-role key. `TRACKMCP_ADMIN_KEY` protects the internal
activation-funnel report endpoint and must never be exposed to the browser.

The deploy script maps all four values via App Runner
`RuntimeEnvironmentSecrets`.

For an existing App Runner service, run the deploy script once after adding the
new JSON keys so the service configuration receives the mappings. The GitHub
Actions workflow's `start-deployment` step only rolls out the already-configured
service; it does not add new runtime secret mappings.

The deploy script then:
- creates an instance role (`AppRunnerInstanceRole`) allowed to `GetSecretValue`, and
- wires the configured keys via App Runner `RuntimeEnvironmentSecrets`.

If your secret lives in another region, replicate it into the service region first:
`aws secretsmanager replicate-secret-to-regions --secret-id <arn> --add-replica-regions Region=<service-region>`.
To rotate a key, update the secret value in Secrets Manager (replicas sync
automatically) and redeploy so the running instances pick it up.
