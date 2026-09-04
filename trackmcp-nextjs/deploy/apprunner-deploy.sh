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

# ---- 3b. (optional) Instance role to read runtime secrets from Secrets Manager.
# Set SECRETS_ARN in .env.deploy to a Secrets Manager secret IN THE SAME REGION
# as the service, holding JSON keys GITHUB_TOKEN and SUPABASE_SERVICE_ROLE_KEY. ----
INSTANCE_ROLE_ARN=""
if [[ -n "${SECRETS_ARN:-}" ]]; then
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
fi

# ---- 4. Build runtime env var JSON (only non-empty values) ----
# Public (NEXT_PUBLIC_*) values go in plaintext env; sensitive keys come from
# Secrets Manager below, never as plaintext env vars.
RUNTIME_ENV="$(python3 - <<'PY'
import json, os
keys = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY",
]
print(json.dumps({k: os.environ[k] for k in keys if os.environ.get(k)}))
PY
)"

SOURCE_CONFIG="$(python3 - "$IMAGE" "$ACCESS_ROLE_ARN" "$RUNTIME_ENV" "${SECRETS_ARN:-}" <<'PY'
import json, sys
image, role_arn, runtime_env, secrets_arn = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4]
img_cfg = {"Port": "8080", "RuntimeEnvironmentVariables": json.loads(runtime_env)}
if secrets_arn:
    img_cfg["RuntimeEnvironmentSecrets"] = {
        "GITHUB_TOKEN": f"{secrets_arn}:GITHUB_TOKEN::",
        "SUPABASE_SERVICE_ROLE_KEY": f"{secrets_arn}:SUPABASE_SERVICE_ROLE_KEY::",
    }
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
c = {"Cpu": "1 vCPU", "Memory": "2 GB"}
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
