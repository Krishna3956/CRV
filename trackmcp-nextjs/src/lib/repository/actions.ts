"use server";

import { getToolsByCategory, searchToolsQuery } from "./queries";
import type { McpTool } from "./types";

/* Server actions for on-demand fetching from the client browser view. */

export async function searchToolsAction(query: string, limit = 200): Promise<McpTool[]> {
  return searchToolsQuery(query, limit);
}

export async function toolsByCategoryAction(category: string, limit = 300): Promise<McpTool[]> {
  return getToolsByCategory(category, limit);
}
