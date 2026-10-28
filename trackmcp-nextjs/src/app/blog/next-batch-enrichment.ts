import type { ArtKey } from "./art";
import type { Enrichment } from "./enrichment";
import { blogSpecs } from "./next-batch";

const art: ArtKey[] = [
  "compare", "compare", "monitoring", "monitoring", "observability", "buyer", "buyer", "sdk", "sdk", "remote",
  "fleet", "privacy", "privacy", "outcomes", "outcomes", "monitoring", "observability", "outcomes", "outcomes", "errors",
  "adoption", "adoption", "outcomes", "adoption", "catalog", "catalog", "release", "opentelemetry", "compare", "buyer",
];

export const nextBatchEnrichment: Record<string, Enrichment> = Object.fromEntries(
  blogSpecs.map((spec, index) => [
    spec.slug,
    {
      art: art[index],
      takeaways: [
        spec.answer.split(".")[0] + ".",
        spec.takeaway,
        "Use bounded, source-labeled evidence and keep the server, client, model, infrastructure, and outcome boundaries distinct.",
      ],
    },
  ]),
) as Record<string, Enrichment>;
