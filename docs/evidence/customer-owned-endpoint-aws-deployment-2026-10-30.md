# Customer-owned endpoint AWS deployment evidence — 2026-10-30

This is a redacted operator record. It contains no workspace key, bearer token,
AWS credential, image digest, or customer payload.

## Deployment attempts

- Workflow source: `.github/workflows/deploy-customer-mcp-uat.yml`
- AWS region: `ap-south-1`
- Intended isolated App Runner service: `trackmcp-customer-mcp-uat`
- GitHub Actions run `41044696889`: stopped because the role could not create
  the new ECR repository.
- GitHub Actions run `41045224472`: build path reached AWS but stopped at
  `ecr:DescribeRepositories` on the existing `trackmcp-web` repository.
- GitHub Actions run `41045487252`: image build and push succeeded; stopped at
  `apprunner:ListServices`.
- GitHub Actions run `41045753549`: direct create path reached App Runner but
  used an invalid instance-configuration value (`Cpu=1`).
- GitHub Actions run `41045964687` from merged `main` commit `5bd3c50`:
  image build and push succeeded; App Runner rejected the isolated service
  creation because the OIDC role lacks `apprunner:CreateService` for
  `arn:aws:apprunner:ap-south-1:872575360367:service/trackmcp-customer-mcp-uat/*`.

## Provider action resolution

The existing GitHub OIDC role
`arn:aws:iam::872575360367:role/GitHubActionsDeployRole` the narrowly scoped
`apprunner:CreateService` action for the isolated UAT service resource above.
That permission was applied in AWS, after which workflow `41048627524`
successfully discovered and updated the existing service, waited for
`RUNNING`, and emitted the endpoint consumed by the subsequent UAT report.

## Classification

The provider-permission portion of the durable AWS endpoint gate is **PROVEN**.
The follow-up operator-supplied AWS endpoint UAT passed bounded catalog
discovery against 30 tools, 6 resources, resource-template discovery, and 5
prompts with zero queue, delivery, hook, or privacy errors. That result is
engineering/operator evidence and is not mislabeled as independent
third-party customer-owned infrastructure; the independent customer-owned
interoperability gate remains separate.
