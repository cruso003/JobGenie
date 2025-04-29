// src/components/resume-builder/InitialSetupScreen.tsx
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Template } from "@/types/resume-builder";
import { Settings, Briefcase, User, Zap, RefreshCw, FileEdit } from "lucide-react";
import LoadingIndicator from "@/components/ui/loading-indicator";
import { useRouter } from "next/navigation";

interface InitialSetupScreenProps {
  profile: any;
  jobTitle: string | null;
  company: string | null;
  selectedTemplate: Template;
  setSelectedTemplate: (template: Template) => void;
  activeColor: string;
  setActiveColor: (color: string) => void;
  colorOptions: Record<string, string>;
  initialPrompt: string;
  setInitialPrompt: (prompt: string) => void;
  isPromptEditable: boolean;
  setIsPromptEditable: (value: boolean) => void;
  isCreatingCoverLetter: boolean;
  isLoading: boolean;
  startConversation: () => void;
  subscription: any;
  resumeCount: number;
  resumeLimit: number;
  router: ReturnType<typeof useRouter>;
}

export default function InitialSetupScreen({
  profile,
  jobTitle,
  company,
  selectedTemplate,
  setSelectedTemplate,
  activeColor,
  setActiveColor,
  colorOptions,
  initialPrompt,
  setInitialPrompt,
  isPromptEditable,
  setIsPromptEditable,
  isCreatingCoverLetter,
  isLoading,
  startConversation,
  subscription,
  resumeCount,
  resumeLimit,
  router
}: InitialSetupScreenProps) {
  return (
    <div className="flex-1 p-4 max-w-3xl mx-auto w-full">
      <div className="space-y-4">
        {/* Template Selection */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              Choose Template
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              {["modern", "classic", "minimal"].map((template) => (
                <div
                  key={template}
                  className={`
                    p-3 rounded-lg border cursor-pointer text-center transition-all
                    ${selectedTemplate === template ? "border-primary bg-primary/5" : "hover:bg-accent"}
                  `}
                  onClick={() => setSelectedTemplate(template as Template)}
                >
                  {template === "modern" && (
                    <div className="w-full h-14 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-md mb-2" />
                  )}
                  {template === "classic" && (
                    <div className="w-full h-14 bg-slate-700 rounded-md mb-2" />
                  )}
                  {template === "minimal" && (
                    <div className="w-full h-14 bg-gradient-to-r from-gray-100 to-gray-300 rounded-md mb-2" />
                  )}
                  <span className="font-medium text-sm">
                    {template.charAt(0).toUpperCase() + template.slice(1)}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-4">
              <Label className="text-sm mb-2 block">Color Theme</Label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(colorOptions).map(([color, hex]) => (
                  <div
                    key={color}
                    className={`w-8 h-8 rounded-full cursor-pointer transition-all ${
                      activeColor === color ? "ring-2 ring-primary ring-offset-2" : ""
                    }`}
                    style={{ backgroundColor: hex }}
                    onClick={() => setActiveColor(color)}
                  />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Job Information */}
        {(jobTitle || company) && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-primary" />
                Target Position
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 bg-muted/30 rounded-md">
                <span className="font-semibold">Job Title:</span> {jobTitle || "Not specified"}
              </div>
              <div className="p-3 bg-muted/30 rounded-md">
                <span className="font-semibold">Company:</span> {company || "Not specified"}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Profile Information */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Your Profile
            </CardTitle>
            <CardDescription>
              Information used to generate your {isCreatingCoverLetter ? "cover letter" : "resume"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {profile ? (
              <div className="space-y-3">
                <div className="flex items-center gap-4 p-3 rounded-lg bg-accent/50">
                 <Avatar className="h-12 w-12 border-2 border-primary/20">
                   <AvatarFallback className="bg-primary/90 text-white text-lg">
                     {profile.full_name?.charAt(0) || "U"}
                   </AvatarFallback>
                 </Avatar>
                 <div>
                   <h3 className="font-semibold">
                     {profile.full_name || "Not specified"}
                   </h3>
                   <p className="text-muted-foreground text-sm">
                     {profile.experience?.currentTitle ||
                       "Add current position in profile"}
                   </p>
                 </div>
               </div>

               <div className="p-3 bg-muted/30 rounded-md">
                 <span className="font-semibold">Skills:</span>{" "}
                 {profile.skills?.join(", ") || "Not specified"}
               </div>

               <div className="p-3 bg-muted/30 rounded-md">
                 <span className="font-semibold">Experience:</span>{" "}
                 {profile.experience?.level || ""} (
                 {profile.experience?.yearsOfExperience || 0} years)
               </div>

               {profile.interests && profile.interests.length > 0 && (
                 <div className="p-3 bg-muted/30 rounded-md">
                   <span className="font-semibold">Interests:</span>{" "}
                   {profile.interests.join(", ")}
                 </div>
               )}
               
               <div className="flex justify-end mt-2">
                 <Button 
                   variant="outline" 
                   size="sm"
                   onClick={() => router.push('/profile')}
                 >
                   Edit Profile
                 </Button>
               </div>
             </div>
           ) : (
             <div className="flex items-center justify-center p-8">
               <LoadingIndicator message="Loading profile..." />
             </div>
           )}
         </CardContent>
       </Card>

       {/* Initial Prompt */}
       <Card>
         <CardHeader className="pb-3">
           <CardTitle className="text-lg flex items-center gap-2">
             <Zap className="h-5 w-5 text-primary" />
             Create with AI
           </CardTitle>
           <CardDescription>
             Generate a professional{" "}
             {isCreatingCoverLetter ? "cover letter" : "resume"} with our
             AI assistant
           </CardDescription>
         </CardHeader>
         <CardContent>
           <div className="mb-4">
             <div className="flex items-center justify-between mb-2">
               <Label className="text-sm font-medium">Initial Prompt</Label>
               {!isPromptEditable && (
                 <Button 
                   variant="ghost" 
                   size="sm"
                   onClick={() => setIsPromptEditable(true)}
                 >
                   <FileEdit className="h-3.5 w-3.5 mr-1.5" />
                   Edit
                 </Button>
               )}
             </div>
             <Textarea
               value={initialPrompt}
               onChange={(e) => setInitialPrompt(e.target.value)}
               className="min-h-[120px] resize-none"
               placeholder="Enter your prompt here..."
               disabled={!isPromptEditable}
             />
           </div>

           <Button
             className="w-full"
             size="lg"
             onClick={startConversation}
             disabled={isLoading || !profile || !initialPrompt.trim()}
           >
             {isLoading ? (
               <>
                 <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                 Generating...
               </>
             ) : (
               <>
                 <Zap className="h-4 w-4 mr-2" />
                 Create {isCreatingCoverLetter ? "Cover Letter" : "Resume"} with AI
               </>
             )}
           </Button>
           
           <p className="text-xs text-center text-muted-foreground mt-3">
             {subscription?.subscription_type === "free" 
               ? `Free plan: ${resumeCount}/${resumeLimit} documents used` 
               : `Pro plan: Unlimited documents`}
           </p>
         </CardContent>
       </Card>
     </div>
   </div>
 );
}
