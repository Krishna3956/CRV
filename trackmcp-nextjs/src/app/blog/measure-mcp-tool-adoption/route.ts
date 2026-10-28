const destination =
  "https://trackmcp.com/blog/measure-mcp-tool-adoption-workflow-completion";

export function GET() {
  return new Response(null, {
    status: 301,
    headers: {
      Location: destination,
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
