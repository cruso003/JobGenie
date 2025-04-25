// components/documents/DocumentLimitBanner.tsx
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";

interface DocumentLimitBannerProps {
  remainingDocuments: number;
  documentType: 'resume' | 'cover letter';
  isUnlimited: boolean;
}

export function DocumentLimitBanner({ 
  remainingDocuments, 
  documentType, 
  isUnlimited 
}: DocumentLimitBannerProps) {
  const router = useRouter();

  if (isUnlimited) return null;

  if (remainingDocuments <= 0) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Limit Reached</AlertTitle>
        <AlertDescription className="flex items-center justify-between">
          <span>
            You've used all your {documentType} generations for this month. 
            Upgrade to Pro for more.
          </span>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => router.push('/pricing')}
          >
            Upgrade Now
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (remainingDocuments <= 2) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Limited Uses Remaining</AlertTitle>
        <AlertDescription>
          You have {remainingDocuments} {documentType}{remainingDocuments === 1 ? '' : 's'} remaining this month.
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}
