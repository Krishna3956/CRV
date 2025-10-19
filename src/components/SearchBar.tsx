import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const SearchBar = ({ value, onChange, placeholder = "Search MCP tools..." }: SearchBarProps) => {
  const handleSearch = () => {
    // Search functionality can be enhanced here if needed
    console.log("Searching for:", value);
  };

  return (
    <div className="relative w-full max-w-3xl group">
      <svg
        className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-primary pointer-events-none"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        strokeWidth="2.5"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
      </svg>
      <Input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-14 pr-32 h-16 text-lg border-2 bg-card/50 backdrop-blur-sm focus:border-primary focus:shadow-glow transition-all duration-300 rounded-2xl"
      />
      <Button
        onClick={handleSearch}
        size="sm"
        className="absolute right-2 top-1/2 -translate-y-1/2 gap-2"
      >
        Search
      </Button>
    </div>
  );
};
