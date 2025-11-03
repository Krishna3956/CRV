"use client"

import { useState, useEffect } from "react";
import { Package, Star, GitBranch } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface StatsSectionProps {
  totalTools: number;
  totalStars: number;
  isSearching?: boolean;
}

interface StatItemProps {
  icon: React.ElementType;
  label: string;
  value: number;
  tooltip: string;
  gradient: string;
}

const AnimatedCounter = ({ value, duration = 2000 }: { value: number; duration?: number }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(easeOutQuart * value));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        setCount(value);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrame);
  }, [value, duration]);

  return <>{count.toLocaleString()}</>;
};

const StatItem = ({ icon: Icon, label, value, tooltip, gradient }: StatItemProps) => {
  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <div className="flex flex-col items-center justify-center px-3 md:px-4 lg:px-5 py-3 md:py-3.5 lg:py-4 group hover:bg-white/10 transition-colors">
            <div className={`p-1.5 md:p-2 rounded bg-gradient-to-br ${gradient} mb-1 md:mb-1.5`}>
              <Icon className="h-4 md:h-4.5 lg:h-5 w-4 md:w-4.5 lg:w-5 text-white" strokeWidth={2.5} />
            </div>
            <p className="text-sm md:text-base font-bold text-foreground text-center" style={{ fontSize: 'clamp(13px, 1.4vw, 15px)', lineHeight: '1.2' }}>
              <AnimatedCounter value={value} />
            </p>
            <p className="text-xs text-muted-foreground font-medium text-center" style={{ fontSize: 'clamp(9px, 1vw, 10px)', lineHeight: '1.2' }}>
              {label}
            </p>
          </div>
        </TooltipTrigger>
        <TooltipContent side="left" className="max-w-xs">
          <p className="text-sm">{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export const StatsSection = ({ totalTools, totalStars, isSearching = false }: StatsSectionProps) => {
  const adjustedTools = isSearching ? totalTools : totalTools + 10000;
  
  const stats = [
    {
      icon: Package,
      label: "MCP Tools",
      value: adjustedTools,
      tooltip: "Total number of Model Context Protocol tools, servers, and clients in our directory",
      gradient: "from-blue-500 to-blue-600",
    },
    {
      icon: Star,
      label: "Total Stars",
      value: totalStars,
      tooltip: "Combined GitHub stars across all MCP repositories, indicating community engagement",
      gradient: "from-yellow-500 to-orange-500",
    },
    {
      icon: GitBranch,
      label: "Active Projects",
      value: adjustedTools,
      tooltip: "Number of actively maintained MCP projects with recent updates and contributions",
      gradient: "from-purple-500 to-pink-500",
    },
  ];

  const scrollToCards = () => {
    const cardsSection = document.getElementById('rows-container');
    if (cardsSection) {
      cardsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <>
      {/* Desktop/Tablet: Slim Ribbon Banner - Absolute positioned in hero section - Hidden on mobile */}
      <div 
        className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 z-40 cursor-pointer hover:scale-105 transition-transform duration-300"
        style={{
          animation: 'slideInFromRight 0.8s ease-out',
          transform: 'translateY(-50%) scale(0.95)',
        }}
        onClick={scrollToCards}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            scrollToCards();
          }
        }}
        aria-label="Scroll to tools section"
      >
        <style jsx>{`
          @keyframes slideInFromRight {
            from {
              right: -100px;
              opacity: 0;
            }
            to {
              right: 0;
              opacity: 1;
            }
          }
        `}</style>
        <div className="flex flex-col bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-l border-t border-b md:border-l-2 md:border-t-2 md:border-b-2 border-border/50 rounded-l-xl md:rounded-l-2xl divide-y md:divide-y-2 divide-border/60 overflow-hidden shadow-md md:shadow-lg">
          {stats.map((stat) => (
            <StatItem key={stat.label} {...stat} />
          ))}
        </div>
      </div>

      {/* Mobile: Hidden - No stats bar on mobile */}
      <div className="hidden">
        {stats.map((stat) => (
          <div key={stat.label} className="flex items-center gap-2 px-3 py-2">
            <div className={`p-1.5 rounded bg-gradient-to-br ${stat.gradient}`}>
              <stat.icon className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
            </div>
            <div className="flex flex-col">
              <p className="text-sm font-bold text-foreground" style={{ fontSize: '14px', lineHeight: '1.1' }}>
                {stat.value.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground font-medium" style={{ fontSize: '11px', lineHeight: '1.1' }}>
                {stat.label}
              </p>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};
