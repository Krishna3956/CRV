/* Repos hidden from the directory (404s, invalid, or banned). Ported verbatim
   from the live site's blockedRepos list. Matched case-insensitively on
   repo_name. Filtered at the query layer so it applies to every view + sitemap. */

const LIST = [
  "context7", "github-mcp-server", "blender-mcp", "chrome-devtools-mcp", "browser-tools-mcp",
  "mcp-atlassian", "exa-mcp-server", "mcp-server-cloudflare", "apple-mcp", "mcp-server-browserbase",
  "excel-mcp-server", "ableton-mcp", "mcp-proxy", "arxiv-mcp-server", "brightdata-mcp", "dbhub",
  "azure-mcp", "mcp-server-chatsum", "elevenlabs-mcp", "agent-toolkit", "azure-devops-mcp", "imcp",
  "mcp-browser-use", "google-calendar-mcp", "gitlab-mcp", "context-portal", "mcp-server-docker",
  "mcp-clickhouse", "duckduckgo-mcp-server", "mcp-server-elasticsearch", "apify-mcp-server",
  "cloud-run-mcp", "clickup-mcp-server", "docker-mcp", "applescript-mcp", "evm-mcp-server",
  "devtools-debugger-mcp", "davinci-resolve-mcp", "mcp-server-airbnb", "mcp-apple-notes",
  "db-mcp-server", "mcp-servers-hub", "aws-mcp", "aider-mcp-server", "deepseek-mcp-server",
  "deep-research-mcp", "code-sandbox-mcp", "dify-mcp-server", "mcp-documentation-server",
  "mcp-database-server", "codegraphcontext", "k8s-mcp-server", "bilibili-mcp-server",
  "anki-mcp-server", "cli-mcp-server", "git-mcp-server", "app-store-connect-mcp-server",
  "mcp-bigquery-server", "mcp-discord", "comfyui-mcp-server", "mcp-server-bigquery",
  "dart-mcp-server", "mcp-3d-printer-server", "a2a-mcp-server", "backlog-mcp-server",
  "mcp-server-asana", "chronulus-mcp", "discord-mcp", "agentcare-mcp", "coincap-mcp",
  "easy-mcp-autocad", "mcp-server", "browser-mcp", "mcp-server-atlassian-bitbucket", "mcp-server-gsc",
  "mcp-deepwebresearch", "alpha-vantage-mcp", "mcp-excel-server", "cursor-mcp-installer",
  "airtable-mcp", "onchain-mcp", "dicom-mcp", "mcp-server-circleci", "bitcoin-mcp",
  "mcp-server-email", "binance-mcp", "mcp-for-api", "mcp-server-axiom", "computer-control-mcp",
  "datadog-mcp-server", "mcp-server-ccxt", "fhir-mcp-server", "mcp-server-flomo",
  "mcp-server-azure-ai-agents", "chess-mcp", "deepseek-claude-mcp-server", "deepl-mcp-server",
  "claude-search-mcp", "mcp-server-drupal", "gomcp", "ai-agent-marketplace-index-mcp", "deepsrt-mcp",
  "chrome-debug-mcp", "mcp-databricks-server", "bear-mcp-server", "databricks-mcp-server",
  "algorand-mcp", "better-auth-mcp-server", "api-mcp-server", "cursor-mcp", "mcp-dnstwist",
  "esa-mcp-server", "dappier-mcp", "azure-devops-mcp-server", "anki-mcp", "app-seo-ai",
  "mcp-server-dumplingai", "apollo-io-mcp-server", "binancemcpserver", "mcp-etherscan-server",
  "bluesky-context-server", "alphafold-mcp-server", "excel-reader-mcp", "crawl4ai-mcp",
  "descope-mcp-server-stdio", "dbx-mcp-server", "hubspot-mcp", "confluence-mcp", "mcp-datetime",
  "emqx-mcp-server", "cmd-mcp-server", "attio-mcp-server", "biorxiv-mcp-server",
  "mcp-accessibility-scanner", "directus-mcp", "code-context-provider-mcp", "binance-mcp-server",
  "mcp-audiense-insights", "microcms-mcp-server", "calendar-mcp", "daytona-mcp-interpreter",
  "dify-workflow-mcp", "congress_gov_mcp", "dokploy-mcp", "amazon-ads-mcp-server", "mcp-chess",
  "bluesky-mcp", "cosa-sai", "beyond-mcp-server", "blockchain-mcp", "markdown-pdf",
  "shopify_python_api", "limitless-api-examples", "README_ZH.md", "msgraph-sdk-python",
  "stable-diffusion.cpp", "files-mock-server", "underdoc-python-sdk", "example-crud",
  "seta-apex-docs-example", "ai-pdf-chatbot-langchain", "transformerbeeclient.py",
  "rust-rpc-router", "biothings_client.py", "AI-Connector-for-Revit", "cosense-mcp-server",
];

export const BLOCKED_REPOS = new Set(LIST.map((n) => n.toLowerCase()));

export function isBlocked(repoName: string | null | undefined): boolean {
  if (!repoName) return false;
  return BLOCKED_REPOS.has(repoName.toLowerCase());
}
