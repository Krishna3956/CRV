#!/usr/bin/env bash
# Build the Next.js standalone container, push it to ECR, and create/point an
# AWS App Runner service at it. Designed to run in AWS CloudShell (Docker + AWS
# CLI preinstalled) from the trackmcp-nextjs/ directory.
#
#   cp deploy/env.deploy.template deploy/.env.deploy
#   nano deploy/.env.deploy      # fill in real values
#   bash deploy/apprunner-deploy.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# ---- load config ----
if [[ ! -f "$SCRIPT_DIR/.env.deploy" ]]; then
  echo "ERROR: $SCRIPT_DIR/.env.deploy not found."
  echo "Run: cp deploy/env.deploy.template deploy/.env.deploy && nano deploy/.env.deploy"
  exit 1
fi
# shellcheck disable=SC1091
source "$SCRIPT_DIR/.env.deploy"

: "${AWS_REGION:?set AWS_REGION in .env.deploy}"
: "${ECR_REPO:?set ECR_REPO in .env.deploy}"
: "${SERVICE_NAME:?set SERVICE_NAME in .env.deploy}"
: "${IMAGE_TAG:=v1}"
: "${SECRETS_ARN:?set SECRETS_ARN in .env.deploy; the production service requires its runtime secret bundle}"

# Fail before touching ECR/App Runner when the selected Founder OS features
# cannot work with the runtime configuration this script would publish. The
# service-role key is delivered only through Secrets Manager below; silently
# deploying without it would produce a healthy-looking container whose ingest,
# worker, and distributed-limiter paths fail at runtime.
case "${TRACKMCP_RATE_LIMIT_MODE:-}" in
  ""|memory|supabase) ;;
  *) echo "ERROR: TRACKMCP_RATE_LIMIT_MODE must be empty, memory, or supabase." >&2; exit 1 ;;
esac
case "${TRACKMCP_ENABLE_FACT_WRITES:-false}" in
  true|false) ;;
  *) echo "ERROR: TRACKMCP_ENABLE_FACT_WRITES must be true or false." >&2; exit 1 ;;
esac
case "${TRACKMCP_TRUST_PROXY:-false}" in
  true|false) ;;
  *) echo "ERROR: TRACKMCP_TRUST_PROXY must be true or false." >&2; exit 1 ;;
esac
case "${TRANSLATION_PROVIDER:-}" in
  ""|deepl|google) ;;
  *) echo "ERROR: TRANSLATION_PROVIDER must be empty, deepl, or google." >&2; exit 1 ;;
esac
case "${TRANSLATION_ENABLE_MACHINE_TRANSLATION:-false}" in
  true|false) ;;
  *) echo "ERROR: TRANSLATION_ENABLE_MACHINE_TRANSLATION must be true or false." >&2; exit 1 ;;
esac
if [[ "${TRACKMCP_RATE_LIMIT_MODE:-}" == "supabase" || "${TRACKMCP_ENABLE_FACT_WRITES:-false}" == "true" ]] && [[ -z "${SECRETS_ARN:-}" ]]; then
  echo "ERROR: SECRETS_ARN is required when distributed rate limits or fact writes are enabled." >&2
  exit 1
fi
if [[ "${TRACKMCP_ENABLE_FACT_WRITES:-false}" == "true" && -z "${TRACKMCP_RATE_LIMIT_MODE:-}" ]]; then
  echo "ERROR: TRACKMCP_RATE_LIMIT_MODE must be explicitly set when fact writes are enabled; do not ship process-local rate limiting by accident." >&2
  exit 1
fi

ACCOUNT_ID="$(aws sts get-caller-identity --query Account --output text)"
ECR_URI="${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPO}"
IMAGE="${ECR_URI}:${IMAGE_TAG}"
ACCESS_ROLE_NAME="AppRunnerECRAccessRole"

echo "==> Account: $ACCOUNT_ID  Region: $AWS_REGION"
echo "==> Image:   $IMAGE"

# ---- 1. ECR repo ----
if ! aws ecr describe-repositories --repository-names "$ECR_REPO" --region "$AWS_REGION" >/dev/null 2>&1; then
  echo "==> Creating ECR repo $ECR_REPO"
  aws ecr create-repository --repository-name "$ECR_REPO" \
    --image-scanning-configuration scanOnPush=true --region "$AWS_REGION" >/dev/null
fi

# ---- 2. Docker login + build + push (amd64, App Runner's arch) ----
echo "==> Logging in to ECR"
aws ecr get-login-password --region "$AWS_REGION" \
  | docker login --username AWS --password-stdin "${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

echo "==> Building image"
docker build \
  --platform linux/amd64 \
  --build-arg NEXT_PUBLIC_SUPABASE_URL="${NEXT_PUBLIC_SUPABASE_URL:-}" \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY="${NEXT_PUBLIC_SUPABASE_ANON_KEY:-}" \
  --build-arg NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY="${NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY:-}" \
  --build-arg NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN="${NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN:-}" \
  --build-arg NEXT_PUBLIC_POSTHOG_HOST="${NEXT_PUBLIC_POSTHOG_HOST:-https://us.i.posthog.com}" \
  -t "$IMAGE" \
  "$APP_DIR"

echo "==> Pushing image"
docker push "$IMAGE"

# ---- 3. IAM access role so App Runner can pull from private ECR ----
if ! aws iam get-role --role-name "$ACCESS_ROLE_NAME" >/dev/null 2>&1; then
  echo "==> Creating IAM access role $ACCESS_ROLE_NAME"
  aws iam create-role --role-name "$ACCESS_ROLE_NAME" \
    --assume-role-policy-document '{
      "Version": "2012-10-17",
      "Statement": [{
        "Effect": "Allow",
        "Principal": {"Service": "build.apprunner.amazonaws.com"},
        "Action": "sts:AssumeRole"
      }]
    }' >/dev/null
  aws iam attach-role-policy --role-name "$ACCESS_ROLE_NAME" \
    --policy-arn arn:aws:iam::aws:policy/service-role/AWSAppRunnerServicePolicyForECRAccess >/dev/null
  echo "==> Waiting for role to propagate..."
  sleep 10
fi
ACCESS_ROLE_ARN="$(aws iam get-role --role-name "$ACCESS_ROLE_NAME" --query Role.Arn --output text)"

# ---- 3b. Instance role to read required runtime secrets from Secrets Manager.
# Set SECRETS_ARN in .env.deploy to a Secrets Manager secret IN THE SAME REGION
# as the service, holding JSON keys GITHUB_TOKEN, SUPABASE_SERVICE_ROLE_KEY,
# TRACKMCP_DEVICE_KEY_DERIVATION_SECRET, TRACKMCP_ADMIN_KEY,
# TRACKMCP_REFRESH_WORKER_SECRET, and TRACKMCP_PRIVACY_REVIEW_SECRET. ----
INSTANCE_ROLE_NAME="AppRunnerInstanceRole"
if ! aws iam get-role --role-name "$INSTANCE_ROLE_NAME" >/dev/null 2>&1; then
  echo "==> Creating IAM instance role $INSTANCE_ROLE_NAME"
  aws iam create-role --role-name "$INSTANCE_ROLE_NAME" \
    --assume-role-policy-document '{
      "Version":"2012-10-17",
      "Statement":[{"Effect":"Allow","Principal":{"Service":"tasks.apprunner.amazonaws.com"},"Action":"sts:AssumeRole"}]
    }' >/dev/null
  sleep 5
fi
aws iam put-role-policy --role-name "$INSTANCE_ROLE_NAME" --policy-name ReadRuntimeSecrets \
  --policy-document "{\"Version\":\"2012-10-17\",\"Statement\":[{\"Effect\":\"Allow\",\"Action\":[\"secretsmanager:GetSecretValue\"],\"Resource\":[\"${SECRETS_ARN}\",\"${SECRETS_ARN}*\"]}]}" >/dev/null
INSTANCE_ROLE_ARN="$(aws iam get-role --role-name "$INSTANCE_ROLE_NAME" --query Role.Arn --output text)"

# ---- 4. Build runtime env var JSON (only non-empty values) ----
# Public (NEXT_PUBLIC_*) values go in plaintext env; sensitive keys come from
# Secrets Manager below, never as plaintext env vars.
RUNTIME_ENV="$(python3 - <<'PY'
import json, os
keys = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY",
    "NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN",
    "NEXT_PUBLIC_POSTHOG_HOST",
    "TRACKMCP_ENABLE_FACT_WRITES",
    "TRACKMCP_RATE_LIMIT_MODE",
    "TRACKMCP_TRUST_PROXY",
    "BREVO_SUBMIT_FORM_URL",
    "TRANSLATION_PROVIDER",
    "TRANSLATION_ENABLE_MACHINE_TRANSLATION",
    "DEEPL_API_URL",
    "DEEPL_GLOSSARY_ID",
]
print(json.dumps({k: os.environ[k] for k in keys if os.environ.get(k)}))
PY
)"

SOURCE_CONFIG="$(python3 - "$IMAGE" "$ACCESS_ROLE_ARN" "$RUNTIME_ENV" "$SECRETS_ARN" <<'PY'
import json, os, sys
image, role_arn, runtime_env, secrets_arn = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4]
img_cfg = {"Port": "8080", "RuntimeEnvironmentVariables": json.loads(runtime_env)}
if secrets_arn:
    img_cfg["RuntimeEnvironmentSecrets"] = {
        "GITHUB_TOKEN": f"{secrets_arn}:GITHUB_TOKEN::",
        "SUPABASE_SERVICE_ROLE_KEY": f"{secrets_arn}:SUPABASE_SERVICE_ROLE_KEY::",
        "TRACKMCP_DEVICE_KEY_DERIVATION_SECRET": f"{secrets_arn}:TRACKMCP_DEVICE_KEY_DERIVATION_SECRET::",
        "TRACKMCP_ADMIN_KEY": f"{secrets_arn}:TRACKMCP_ADMIN_KEY::",
        "TRACKMCP_REFRESH_WORKER_SECRET": f"{secrets_arn}:TRACKMCP_REFRESH_WORKER_SECRET::",
        "TRACKMCP_PRIVACY_REVIEW_SECRET": f"{secrets_arn}:TRACKMCP_PRIVACY_REVIEW_SECRET::",
    }
    provider = os.environ.get("TRANSLATION_PROVIDER", "")
    if provider == "deepl":
        img_cfg["RuntimeEnvironmentSecrets"]["DEEPL_API_KEY"] = f"{secrets_arn}:DEEPL_API_KEY::"
    elif provider == "google":
        img_cfg["RuntimeEnvironmentSecrets"]["GOOGLE_TRANSLATE_API_KEY"] = f"{secrets_arn}:GOOGLE_TRANSLATE_API_KEY::"
cfg = {
    "ImageRepository": {
        "ImageIdentifier": image,
        "ImageRepositoryType": "ECR",
        "ImageConfiguration": img_cfg,
    },
    "AutoDeploymentsEnabled": False,
    "AuthenticationConfiguration": {"AccessRoleArn": role_arn},
}
print(json.dumps(cfg))
PY
)"

HEALTH_CONFIG='{"Protocol":"TCP","Interval":10,"Timeout":5,"HealthyThreshold":1,"UnhealthyThreshold":5}'
INSTANCE_CONFIG="$(python3 - "${INSTANCE_ROLE_ARN:-}" <<'PY'
import json, sys
# Production App Runner capacity: keep this explicit so a redeploy cannot
# silently regress the service from its 4 GB production setting.
c = {"Cpu": "1 vCPU", "Memory": "4 GB"}
if sys.argv[1]:
    c["InstanceRoleArn"] = sys.argv[1]
print(json.dumps(c))
PY
)"

# ---- 5. Create the service (or tell the user how to update it) ----
EXISTING_ARN="$(aws apprunner list-services --region "$AWS_REGION" \
  --query "ServiceSummaryList[?ServiceName=='${SERVICE_NAME}'].ServiceArn | [0]" --output text)"

if [[ "$EXISTING_ARN" == "None" || -z "$EXISTING_ARN" ]]; then
  echo "==> Creating App Runner service $SERVICE_NAME"
  aws apprunner create-service \
    --service-name "$SERVICE_NAME" \
    --region "$AWS_REGION" \
    --source-configuration "$SOURCE_CONFIG" \
    --health-check-configuration "$HEALTH_CONFIG" \
    --instance-configuration "$INSTANCE_CONFIG" \
    --query 'Service.[ServiceName,Status,ServiceUrl]' --output text
else
  echo "==> Service exists ($EXISTING_ARN); deploying new image"
  aws apprunner update-service \
    --service-arn "$EXISTING_ARN" \
    --region "$AWS_REGION" \
    --source-configuration "$SOURCE_CONFIG" \
    --instance-configuration "$INSTANCE_CONFIG" \
    --query 'Service.[ServiceName,Status,ServiceUrl]' --output text
fi

echo ""
echo "==> Done. Watch status with:"
echo "    aws apprunner list-services --region $AWS_REGION --output table"
echo "    (open the ServiceUrl once status is RUNNING)"
