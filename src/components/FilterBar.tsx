import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface FilterBarProps {
  sortBy: string;
  onSortChange: (value: string) => void;
}

export const FilterBar = ({ sortBy, onSortChange }: FilterBarProps) => {
  return (
    <div className="flex items-center gap-3 bg-card/50 backdrop-blur-sm border-2 rounded-lg px-4 py-2 h-10">
      <Label htmlFor="sort" className="text-sm font-medium whitespace-nowrap">
        Sort by:
      </Label>
      <Select value={sortBy} onValueChange={onSortChange}>
        <SelectTrigger id="sort" className="w-[150px] border-0 bg-transparent focus:ring-0 text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-popover border-2 z-50">
          <SelectItem value="stars">Most Stars</SelectItem>
          <SelectItem value="recent">Recently Updated</SelectItem>
          <SelectItem value="name">Name (A-Z)</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};
