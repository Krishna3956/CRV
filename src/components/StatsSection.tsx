import { Package, Star, GitBranch } from "lucide-react";

interface StatsSectionProps {
  totalTools: number;
  totalStars: number;
}

export const StatsSection = ({ totalTools, totalStars }: StatsSectionProps) => {
  const adjustedTools = totalTools + 10000;
  const stats = [
    {
      icon: Package,
      label: "MCP Tools",
      value: adjustedTools.toLocaleString(),
      gradient: "from-primary to-primary-glow",
    },
    {
      icon: Star,
      label: "Total Stars",
      value: totalStars.toLocaleString(),
      gradient: "from-accent to-accent-glow",
    },
    {
      icon: GitBranch,
      label: "Active Projects",
      value: adjustedTools.toLocaleString(),
      gradient: "from-primary via-accent to-primary",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 max-w-lg mx-auto mb-6 justify-items-center">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="relative group p-3 rounded-lg border-2 bg-card/50 backdrop-blur-sm hover:shadow-elegant transition-all duration-300 hover:-translate-y-1 w-full max-w-sm h-20"
        >
          <div className="flex items-center gap-2 w-full h-full">
            <div className={`p-1.5 rounded-md bg-gradient-to-br ${stat.gradient} text-white flex-shrink-0`}>
              <stat.icon className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
              <p className="text-base font-bold gradient-text truncate leading-tight" style={{ fontSize: '16px' }}>{stat.value}</p>
              <p className="text-xs text-muted-foreground font-medium truncate leading-tight" style={{ fontSize: '12px' }}>{stat.label}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
