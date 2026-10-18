export type WorkspaceMembershipRow = {
  user_id?: unknown;
  workspace_id?: unknown;
  role?: unknown;
  trackmcp_workspaces?: unknown;
};

export type PublicWorkspaceMembership = {
  id: string;
  name: string;
  slug: string;
  role: string;
};

function bounded(value: unknown, maximum: number) {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim().slice(0, maximum)
    : null;
}

/** Convert authenticated membership rows to a bounded, secret-free response. */
export function publicWorkspaceMemberships(
  rows: WorkspaceMembershipRow[] | null | undefined,
  userId: string,
): PublicWorkspaceMembership[] {
  if (!Array.isArray(rows)) return [];
  return rows.flatMap((row) => {
    if (row.user_id !== userId) return [];
    const workspace = row.trackmcp_workspaces && typeof row.trackmcp_workspaces === "object"
      ? row.trackmcp_workspaces as Record<string, unknown>
      : null;
    const id = bounded(workspace?.id ?? row.workspace_id, 128);
    const name = bounded(workspace?.name, 128);
    const slug = bounded(workspace?.slug, 128);
    if (!id || !name || !slug) return [];
    return [{ id, name, slug, role: bounded(row.role, 32) || "member" }];
  });
}
