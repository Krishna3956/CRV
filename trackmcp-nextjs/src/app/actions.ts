'use server'

import {
  getToolsWithPagination,
  getToolsByCategory,
  searchTools as searchToolsDb,
} from '@/utils/db-queries'

/**
 * Server action to fetch more tools on demand
 * Called when user clicks "Load More" button
 */
export async function fetchMoreTools(offset: number, limit: number = 100) {
  return getToolsWithPagination(offset, limit)
}

/**
 * Server action to fetch tools by category
 * Called when user selects a category filter
 */
export async function fetchToolsByCategory(category: string, limit: number = 1000) {
  return getToolsByCategory(category, limit)
}

/**
 * Server action to search tools
 * Called when user searches for a tool
 */
export async function searchTools(query: string, limit: number = 100) {
  return searchToolsDb(query, limit)
}
