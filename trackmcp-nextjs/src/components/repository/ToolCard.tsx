import Link from "next/link";
import { Star, GitBranch, ArrowUpRight, TrendingUp } from "lucide-react";
import { ownerFromUrl, toolSlug } from "@/lib/repository/types";

/* A single MCP tool card in the directory grid, styled to the TrackMCP system.
   Owner avatar comes from github.com/{owner}.png (no API call, no rate limit).
   Links use the canonical GitHub owner--repo slug so different repositories
   with the same display name do not collide. */

export function ToolCard({
  name,
  description,
  stars,
  githubUrl,
  language,
  topics,
  isTrending,
}: {
  name: string;
  description: string;
  stars: number;
  githubUrl: string;
  language?: string;
  topics?: string[];
  isTrending?: boolean;
}) {
  const owner = ownerFromUrl(githubUrl);
  return (
    <Link
      href={`/tool/${encodeURIComponent(toolSlug(githubUrl, name))}`}
      className="lift group flex h-full flex-col rounded-2xl border border-line bg-white p-5 transition-colors hover:border-line-strong"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          {owner && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`https://github.com/${owner}.png?size=40`}
              alt={owner}
              width={20}
              height={20}
              className="h-5 w-5 shrink-0 rounded-full border border-line bg-paper object-cover"
            />
          )}
          <span className="truncate text-[16px] font-medium text-ink">{name}</span>
        </div>
        {isTrending ? (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-brand-soft px-1.5 py-0.5 text-[10px] font-medium text-brand-strong">
            <TrendingUp size={10} /> Trending
          </span>
        ) : (
          <ArrowUpRight size={16} className="shrink-0 text-faint transition-colors group-hover:text-ink" />
        )}
      </div>

      <p className="mt-2 line-clamp-2 flex-1 text-[13.5px] leading-relaxed text-muted">
        {description || "No description available"}
      </p>

      <div className="mt-4 flex items-center gap-4 text-[12.5px]">
        <span className="inline-flex items-center gap-1.5 text-body">
          <Star size={13} className="fill-amber-400 text-amber-400" />
          <span className="font-medium">{stars.toLocaleString()}</span>
        </span>
        {language && (
          <span className="inline-flex items-center gap-1.5 text-muted">
            <GitBranch size={13} /> {language}
          </span>
        )}
      </div>

      {topics && topics.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {topics.slice(0, 3).map((t) => (
            <span key={t} className="rounded-md bg-paper px-2 py-0.5 text-[10.5px] font-medium text-muted">
              {t}
            </span>
          ))}
          {topics.length > 3 && (
            <span className="rounded-md border border-line px-2 py-0.5 text-[10.5px] text-faint">
              +{topics.length - 3}
            </span>
          )}
        </div>
      )}
    </Link>
  );
}
