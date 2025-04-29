// src/components/resume-builder/ResumeHeader.tsx
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, Folder } from "lucide-react";

interface ResumeHeaderProps {
  router: ReturnType<typeof useRouter>;
  isCreatingCoverLetter: boolean;
  setIsCreatingCoverLetter: (value: boolean) => void;
  subscription: any;
  resumeCount: number;
  resumeLimit: number;
  setShowDocumentList: (value: boolean) => void;
}

export default function ResumeHeader({
  router,
  isCreatingCoverLetter,
  setIsCreatingCoverLetter,
  subscription,
  resumeCount,
  resumeLimit,
  setShowDocumentList
}: ResumeHeaderProps) {
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b p-4 bg-card">
      <div className="flex items-center gap-2">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => router.push('/dashboard')}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold">
          {isCreatingCoverLetter ? "Cover Letter Builder" : "Resume Builder"}
        </h1>
      </div>

      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="hidden md:flex">
          {subscription?.subscription_type || "Free"} · {resumeCount}/{resumeLimit}
        </Badge>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setShowDocumentList(true)}
          className="hidden sm:flex"
        >
          <Folder className="h-4 w-4 mr-2" />
          Open
        </Button>
        <div className="flex border rounded-md overflow-hidden">
          <Button
            variant={isCreatingCoverLetter ? "ghost" : "default"}
            size="sm"
            onClick={() => setIsCreatingCoverLetter(false)}
            className="rounded-none"
          >
            Resume
          </Button>
          <Button
            variant={isCreatingCoverLetter ? "default" : "ghost"}
            size="sm"
            onClick={() => setIsCreatingCoverLetter(true)}
            className="rounded-none"
          >
            Cover
          </Button>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setShowDocumentList(true)}
          className="sm:hidden"
        >
          <Folder className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}
