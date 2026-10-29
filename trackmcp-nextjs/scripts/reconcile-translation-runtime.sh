#!/usr/bin/env bash
# Reconcile the App Runner translation runtime without exposing provider keys.
#
# The normal production rollout uses .github/workflows/deploy.yml and only
# starts a deployment; it does not replace the service's source configuration.
# This bounded preflight therefore updates only the translation variables and
# the selected provider's Secrets Manager reference before the new image rolls
# out. If no provider is configured, an already-valid service configuration is
# accepted; otherwise the rollout stops before building or deploying an image.
set -euo pipefail

: "${AWS_REGION:?AWS_REGION is required}"
: "${SERVICE_ARN:?SERVICE_ARN is required}"

provider="${TRACKMCP_TRANSLATION_PROVIDER:-}"
enabled="${TRACKMCP_TRANSLATION_ENABLE_MACHINE_TRANSLATION:-}"
requested_secret_arn="${TRACKMCP_TRANSLATION_SECRETS_ARN:-}"
deepl_api_url="${TRACKMCP_DEEPL_API_URL:-}"
deepl_glossary_id="${TRACKMCP_DEEPL_GLOSSARY_ID:-}"

source_config="$(timeout 30s aws apprunner describe-service \
  --service-arn "$SERVICE_ARN" --region "$AWS_REGION" \
  --query Service.SourceConfiguration --output json)"

runtime_vars="$(printf '%s' "$source_config" | jq -c '.ImageRepository.ImageConfiguration.RuntimeEnvironmentVariables // {}')"
runtime_secrets="$(printf '%s' "$source_config" | jq -c '.ImageRepository.ImageConfiguration.RuntimeEnvironmentSecrets // {}')"
current_provider="$(printf '%s' "$runtime_vars" | jq -r '.TRANSLATION_PROVIDER // ""')"
current_enabled="$(printf '%s' "$runtime_vars" | jq -r '.TRANSLATION_ENABLE_MACHINE_TRANSLATION // ""')"

secret_arn_from_ref() {
  local ref="$1"
  if [[ "$ref" =~ ^(arn:aws:secretsmanager:[^:]+:[0-9]{12}:secret:.+):[A-Z0-9_]+::$ ]]; then
    printf '%s' "${BASH_REMATCH[1]}"
  fi
}

existing_secret_arn=""
for key in SUPABASE_SERVICE_ROLE_KEY GITHUB_TOKEN TRACKMCP_REFRESH_WORKER_SECRET DEEPL_API_KEY GOOGLE_TRANSLATE_API_KEY; do
  ref="$(printf '%s' "$runtime_secrets" | jq -r --arg key "$key" '.[$key] // ""')"
  if [[ -n "$ref" ]]; then
    existing_secret_arn="$(secret_arn_from_ref "$ref" || true)"
    [[ -n "$existing_secret_arn" ]] && break
  fi
done

if [[ -z "$provider" ]]; then
  if [[ "$current_enabled" == "true" && ( "$current_provider" == "aws" || "$current_provider" == "deepl" || "$current_provider" == "google" ) ]]; then
    if [[ "$current_provider" == "aws" ]]; then
      echo "Translation runtime is already configured: provider=aws enabled=true."
      exit 0
    fi
    selected_key="DEEPL_API_KEY"
    [[ "$current_provider" == "google" ]] && selected_key="GOOGLE_TRANSLATE_API_KEY"
    selected_ref="$(printf '%s' "$runtime_secrets" | jq -r --arg key "$selected_key" '.[$key] // ""')"
    if [[ "$selected_ref" =~ ^arn:aws:secretsmanager:[^:]+:[0-9]{12}:secret:.+:[A-Z0-9_]+::$ ]]; then
      echo "Translation runtime is already configured: provider=$current_provider enabled=true."
      exit 0
    fi
  fi
  cat >&2 <<'EOF'
ERROR: Chinese translation is not configured on the App Runner service.
Set the repository variables TRACKMCP_TRANSLATION_PROVIDER (aws, deepl, or google)
and TRACKMCP_TRANSLATION_ENABLE_MACHINE_TRANSLATION=true. For deepl/google,
add the matching provider key to the existing AWS Secrets Manager JSON bundle.
AWS uses the App Runner instance role. Then rerun the deployment; the rollout
stopped before building or deploying an image.
EOF
  exit 1
fi

if [[ "$provider" != "aws" && "$provider" != "deepl" && "$provider" != "google" ]]; then
  echo "ERROR: TRACKMCP_TRANSLATION_PROVIDER must be aws, deepl, or google." >&2
  exit 1
fi
if [[ "$enabled" != "true" ]]; then
  echo "ERROR: TRACKMCP_TRANSLATION_ENABLE_MACHINE_TRANSLATION must be true for a production Chinese rollout." >&2
  exit 1
fi

secret_arn="$requested_secret_arn"
if [[ -z "$secret_arn" ]]; then secret_arn="$existing_secret_arn"; fi
if [[ "$provider" != "aws" && ! "$secret_arn" =~ ^arn:aws:secretsmanager:[^:]+:[0-9]{12}:secret:.+ ]]; then
  echo "ERROR: no valid Secrets Manager ARN was found for the translation provider key." >&2
  echo "Add TRACKMCP_TRANSLATION_SECRETS_ARN or keep the existing runtime secret bundle mapped on App Runner." >&2
  exit 1
fi

updated_config="$(printf '%s' "$source_config" | jq -c \
  --arg provider "$provider" \
  --arg enabled "$enabled" \
  --arg deepl_url "$deepl_api_url" \
  --arg glossary "$deepl_glossary_id" \
  --arg secret_arn "$secret_arn" '
  .ImageRepository.ImageConfiguration.RuntimeEnvironmentVariables =
    ((.ImageRepository.ImageConfiguration.RuntimeEnvironmentVariables // {})
      + {TRANSLATION_PROVIDER: $provider,
         TRANSLATION_ENABLE_MACHINE_TRANSLATION: $enabled}
      | if $deepl_url != "" then .DEEPL_API_URL = $deepl_url else del(.DEEPL_API_URL) end
      | if $glossary != "" then .DEEPL_GLOSSARY_ID = $glossary else del(.DEEPL_GLOSSARY_ID) end)
  | .ImageRepository.ImageConfiguration.RuntimeEnvironmentSecrets =
    ((.ImageRepository.ImageConfiguration.RuntimeEnvironmentSecrets // {})
      | del(.DEEPL_API_KEY, .GOOGLE_TRANSLATE_API_KEY)
      | if $provider == "deepl"
        then .DEEPL_API_KEY = ($secret_arn + ":DEEPL_API_KEY::")
        elif $provider == "google"
        then .GOOGLE_TRANSLATE_API_KEY = ($secret_arn + ":GOOGLE_TRANSLATE_API_KEY::")
        else .
        end)
  ')"

echo "Reconciling App Runner translation runtime: provider=$provider enabled=true."

# A prior image rollout can leave App Runner in OPERATION_IN_PROGRESS even
# after the workflow that started it has been cancelled. Updating the service
# during that window fails with InvalidStateException and prevents a valid
# candidate from ever reaching the deployment step. Wait for the provider to
# become mutable before making this configuration update; the workflow has a
# separate bounded wait before StartDeployment as well.
ready_deadline=$((SECONDS + 540))
while (( SECONDS < ready_deadline )); do
  service_status="$(timeout 30s aws apprunner describe-service \
    --service-arn "$SERVICE_ARN" --region "$AWS_REGION" \
    --query Service.Status --output text)"
  echo "App Runner status before translation reconciliation: $service_status"
  case "$service_status" in
    RUNNING) break ;;
    OPERATION_IN_PROGRESS|PAUSED) sleep 15 ;;
    *)
      echo "ERROR: App Runner cannot accept translation reconciliation in status $service_status." >&2
      exit 1
      ;;
  esac
done
if (( SECONDS >= ready_deadline )); then
  echo "ERROR: timed out waiting for App Runner to become RUNNING before translation reconciliation." >&2
  exit 1
fi

update_deadline=$((SECONDS + 120))
while (( SECONDS < update_deadline )); do
  if timeout 30s aws apprunner update-service \
    --service-arn "$SERVICE_ARN" --region "$AWS_REGION" \
    --source-configuration "$updated_config" >/dev/null; then
    break
  fi
  echo "App Runner rejected the translation update because another operation is active; retrying in 15s."
  sleep 15
done
if (( SECONDS >= update_deadline )); then
  echo "ERROR: timed out updating App Runner translation runtime." >&2
  exit 1
fi

deadline=$((SECONDS + 540))
while (( SECONDS < deadline )); do
  status="$(timeout 30s aws apprunner describe-service \
    --service-arn "$SERVICE_ARN" --region "$AWS_REGION" \
    --query Service.Status --output text)"
  echo "App Runner status after translation reconciliation: $status"
  case "$status" in
    RUNNING) exit 0 ;;
    OPERATION_IN_PROGRESS|PAUSED) sleep 15 ;;
    *) echo "ERROR: translation runtime reconciliation ended in status $status." >&2; exit 1 ;;
  esac
done
echo "ERROR: timed out waiting for translation runtime reconciliation." >&2
exit 1
