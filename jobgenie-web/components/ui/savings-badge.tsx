// components/ui/savings-badge.tsx
import { Badge } from "@/components/ui/badge";

interface SavingsBadgeProps {
  monthlyPrice: number;
  annualPrice: number;
}

export function SavingsBadge({ monthlyPrice, annualPrice }: SavingsBadgeProps) {
  const annualMonthlyEquivalent = annualPrice / 12;
  const savings = ((monthlyPrice - annualMonthlyEquivalent) / monthlyPrice) * 100;
  
  return (
    <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
      Save {Math.round(savings)}%
    </Badge>
  );
}
