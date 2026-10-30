FROM node:22-bookworm-slim

WORKDIR /app
COPY trackmcp-nextjs/scripts/customer-mcp-endpoint-fixture.mjs /app/server.mjs

ENV PORT=8080
ENV CUSTOMER_MCP_ENDPOINT_PORT=8080
ENV CUSTOMER_MCP_ENDPOINT_BIND=0.0.0.0

EXPOSE 8080
CMD ["node", "/app/server.mjs"]
