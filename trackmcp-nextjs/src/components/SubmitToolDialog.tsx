'use client'

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface SubmitToolDialogProps {
  variant?: 'default' | 'enhanced' | 'mobile'
  onSuccess?: () => void
  buttonText?: string
}

export const SubmitToolDialog = ({ variant = 'default', onSuccess, buttonText = 'Submit MCP' }: SubmitToolDialogProps = {}) => {
  const router = useRouter();

  const handleClick = () => {
    router.push('/submit-mcp');
  };

  // Button styling based on variant
  const getButtonClasses = () => {
    switch (variant) {
      case 'enhanced':
        return "gap-2 h-10 px-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-150 hover:brightness-110 focus:outline-2 focus:outline-offset-2 focus:outline-blue-400 rounded-lg"
      case 'mobile':
        return "gap-2 h-12 w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-150 hover:brightness-110 rounded-lg"
      default:
        return "gap-2 shadow-elegant hover:shadow-glow transition-all h-10 px-4 w-auto"
    }
  }

  return (
    <Button onClick={handleClick} className={getButtonClasses()}>
      <Plus className="h-5 w-5" />
      {buttonText}
    </Button>
  );
};
