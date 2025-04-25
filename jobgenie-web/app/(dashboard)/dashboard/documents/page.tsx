// app/dashboard/documents/page.tsx
import { checkDocumentLimits, DocumentLimitStatus, incrementDocumentUsage } from "@/lib/supabase/documents";
import { DocumentLimitBanner } from "@/components/documents/DocumentLimitBanner";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/stores/auth";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function DocumentsPage() {
  const [limitStatus, setLimitStatus] = useState<DocumentLimitStatus | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const { user } = useAuthStore();
  const { toast } = useToast();
    const router = useRouter();

  useEffect(() => {
    const fetchLimits = async () => {
      if (user) {
        const status = await checkDocumentLimits(user.id);
        setLimitStatus(status);
      }
    };

    fetchLimits();
  }, [user]);

  const handleGenerateDocument = async (type: 'resume' | 'cover_letter') => {
    if (!user || !limitStatus) return;

    const canGenerate = type === 'resume' 
      ? limitStatus.canGenerateResume 
      : limitStatus.canGenerateCoverLetter;

    if (!canGenerate) {
      toast({
        title: "Limit Reached",
        description: `You've used all your ${type} generations for this month. Upgrade to Pro for more.`,
        variant: "destructive",
        action: <Button onClick={() => router.push('/pricing')}>Upgrade Now</Button>
      });
      return;
    }

    setIsGenerating(true);

    try {
      // Your existing document generation logic here
      // ...

      // Increment usage after successful generation
      await incrementDocumentUsage(user.id, type);
      
      // Refresh limits
      const updatedStatus = await checkDocumentLimits(user.id);
      setLimitStatus(updatedStatus);

      toast({
        title: "Document Generated",
        description: `Your ${type} has been created successfully.`,
      });
    } catch (error) {
      console.error('Error generating document:', error);
      toast({
        title: "Error",
        description: "Failed to generate document. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="container max-w-6xl py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Document Generator</h1>
        <p className="text-muted-foreground">
          Create professional resumes and cover letters tailored to your job search
        </p>
      </div>

      {limitStatus && (
        <div className="mb-6 space-y-4">
          <DocumentLimitBanner 
            remainingDocuments={limitStatus.remainingResumes}
            documentType="resume"
            isUnlimited={limitStatus.isUnlimited}
          />
          <DocumentLimitBanner 
            remainingDocuments={limitStatus.remainingCoverLetters}
            documentType="cover letter"
            isUnlimited={limitStatus.isUnlimited}
          />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Resume Builder</CardTitle>
            <CardDescription>
              Create an ATS-friendly resume tailored to your target role
            </CardDescription>
          </CardHeader>
          <CardContent>
            {limitStatus && (
              <div className="mb-4 text-sm text-muted-foreground">
                {limitStatus.isUnlimited ? (
                  <span>Unlimited resumes</span>
                ) : (
                  <span>{limitStatus.remainingResumes} resumes remaining this month</span>
                )}
              </div>
            )}
            {/* Your existing resume builder UI */}
          </CardContent>
          <CardFooter>
            <Button 
              onClick={() => handleGenerateDocument('resume')}
              disabled={!limitStatus?.canGenerateResume || isGenerating}
            >
              {isGenerating ? "Generating..." : "Generate Resume"}
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cover Letter Generator</CardTitle>
            <CardDescription>
              Create a compelling cover letter that highlights your fit for the role
            </CardDescription>
          </CardHeader>
          <CardContent>
            {limitStatus && (
              <div className="mb-4 text-sm text-muted-foreground">
                {limitStatus.isUnlimited ? (
                  <span>Unlimited cover letters</span>
                ) : (
                  <span>{limitStatus.remainingCoverLetters} cover letters remaining this month</span>
                )}
              </div>
            )}
            {/* Your existing cover letter builder UI */}
          </CardContent>
          <CardFooter>
            <Button 
              onClick={() => handleGenerateDocument('cover_letter')}
              disabled={!limitStatus?.canGenerateCoverLetter || isGenerating}
            >
              {isGenerating ? "Generating..." : "Generate Cover Letter"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
