// app/job-details/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTheme } from "next-themes";

// UI Components
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

// Icons
import {
  ArrowLeft,
  Share2,
  Bookmark,
  Trash2,
  MapPin,
  DollarSign,
  FileText,
  Edit3,
  MessageCircle,
  ChevronRight,
  CheckCircle,
  Database,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";

// Stores & API
import { useAuthStore } from "@/lib/stores/auth";
import { useJobsStore } from "@/lib/stores/jobs";
import { getJobDetails } from "@/lib/jsearch";
import { supabase } from "@/lib/supabase";

export default function JobDetailsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const jobId = searchParams.get("jobId");
  const source = searchParams.get("source");
  
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const { user } = useAuthStore();
  const { recommendedJobs } = useJobsStore();

  // State
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [applicationStatus, setApplicationStatus] = useState<string>("new");
  const [isSaved, setIsSaved] = useState(false);
  const [usingCachedData, setUsingCachedData] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);

  useEffect(() => {
    if (jobId) {
      fetchJobDetails();
      checkIfSaved();
    } else {
      setError("No job ID provided");
      setLoading(false);
    }
  }, [jobId]);

  const fetchJobDetails = async () => {
    if (!jobId) return;

    try {
      setLoading(true);

      // First check if we already have this job in our database (saved jobs)
      const { data: savedJob, error: savedJobError } = await supabase
        .from("saved_jobs")
        .select("*")
        .eq("external_job_id", jobId)
        .single();

      if (!savedJobError && savedJob) {
        setJob(savedJob);
        setApplicationStatus(savedJob.status || "saved");
        setIsSaved(true);
      } else {
        // If not in database, check if it's in the recommended jobs store
        const recommendedJob = recommendedJobs.find(job => job.job_id === jobId);
        
        if (recommendedJob) {
          setJob(recommendedJob);
        } else {
          // As a last resort, fetch from JSearch API
          try {
            const startTime = Date.now();
            const result = await getJobDetails(jobId as string);
            const timeTaken = Date.now() - startTime;
            
            // If result came back very quickly, it was likely from cache
            if (timeTaken < 300) {
              setUsingCachedData(true);
            }
            
            if (result && result.data) {
              // Handle cases where the API returns an array but we need the first item
              if (Array.isArray(result.data) && result.data.length > 0) {
                setJob(result.data[0]);
              } else {
                setJob(result.data);
              }
            } else {
              console.error("No job data found in API response");
              setError("Could not load job details");
              // Fallback to minimal default
              setJob({
                job_title: "Job details not available",
                employer_name: "Company information not found",
                job_description: "No description available for this job. Please try returning to the previous screen.",
                job_city: "Location not specified",
                job_apply_link: "#",
              });
            }
          } catch (apiError) {
            console.error("Error fetching job details from API:", apiError);
            setError("Error retrieving job data");
            // Use fallback
            setJob({
              job_title: "Job details not available",
              employer_name: "Company information not found",
              job_description: "No description available for this job. Please try returning to the previous screen.",
              job_city: "Location not specified",
              job_apply_link: "#",
            });
          }
        }
      }
    } catch (error) {
      console.error("Error in fetchJobDetails:", error);
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };
  
  const checkIfSaved = async () => {
    if (!user || !jobId) return;

    try {
      const { data, error } = await supabase
        .from("saved_jobs")
        .select("id, status")
        .eq("user_id", user.id)
        .eq("external_job_id", jobId)
        .single();

      if (!error && data) {
        setIsSaved(true);
        setApplicationStatus(data.status || "saved");
      } else {
        setIsSaved(false);
        setApplicationStatus("new");
      }
    } catch (error) {
      console.error("Error checking saved status:", error);
    }
  };

  const updateApplicationStatus = async (status: string) => {
    if (!user || !job) return;

    try {
      // First check if this job exists in our database
      const { data, error } = await supabase
        .from("saved_jobs")
        .select("id")
        .eq("user_id", user.id)
        .eq("external_job_id", jobId)
        .single();

      if (!error && data) {
        // Update existing record
        await supabase.from("saved_jobs").update({ status }).eq("id", data.id);
      } else {
        // Create new record
        await supabase.from("saved_jobs").insert({
          user_id: user.id,
          job_title: job.job_title,
          company_name: job.employer_name || job.company_name,
          job_description: job.job_description,
          job_location: job.job_city || job.job_location || "Remote",
          job_apply_link: job.job_apply_link || job.application_link,
          external_job_id: job.job_id || jobId,
          status,
        });
      }

      setApplicationStatus(status);
      setIsSaved(true);
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update application status.");
    }
  };

  const handleApply = async () => {
    const applyLink = job?.job_apply_link || job?.application_link;
    
    if (!applyLink || applyLink === "#") {
      alert("This job does not have an application link available.");
      return;
    }

    try {
      // Open link in new tab
      window.open(applyLink, "_blank");
      
      // Ask if they want to mark as applied
      if (confirm("Do you want to mark this job as applied in your tracker?")) {
        updateApplicationStatus("applied");
      }
    } catch (error) {
      console.error("Error opening URL:", error);
      alert("Could not open the application link.");
    }
  };

  const handleSaveJob = async () => {
    if (!user || !job) return;

    try {
      if (isSaved) {
        if (confirm("Are you sure you want to remove this job from your saved list?")) {
          try {
            const { data, error: findError } = await supabase
              .from("saved_jobs")
              .select("id")
              .eq("user_id", user.id)
              .eq("external_job_id", jobId)
              .single();
                
            if (findError || !data) {
              console.error("Job not found in saved jobs");
              alert("Could not find this job in your saved jobs.");
              return;
            }
              
            const { error } = await supabase
              .from("saved_jobs")
              .delete()
              .eq("id", data.id);

            if (error) throw error;
            setIsSaved(false);
            setApplicationStatus("new");
          } catch (error) {
            console.error("Error unsaving job:", error);
            alert("Failed to unsave this job. Please try again.");
          }
        }
      } else {
        // Add to saved jobs
        const { error } = await supabase.from("saved_jobs").insert({
          user_id: user.id,
          job_title: job.job_title,
          company_name: job.employer_name || job.company_name,
          job_description: job.job_description,
          job_location: job.job_city || job.job_location || "Remote",
          job_apply_link: job.job_apply_link || job.application_link,
          external_job_id: job.job_id || jobId,
          status: "saved",
        });

        if (error) throw error;
        setIsSaved(true);
        setApplicationStatus("saved");
        alert("Job saved successfully!");
      }
    } catch (error) {
      console.error("Error saving job:", error);
      alert("Failed to save this job. Please try again.");
    }
  };

  const handleDeleteJob = async () => {
    if (!user || !jobId) return;
    
    try {
      const { data, error: findError } = await supabase
        .from("saved_jobs")
        .select("id")
        .eq("user_id", user.id)
        .eq("external_job_id", jobId)
        .single();
            
      if (findError || !data) {
        console.error("Job not found in saved jobs");
        alert("Could not find this job in your saved jobs.");
        return;
      }
          
      const { error } = await supabase
        .from('saved_jobs')
        .delete()
        .eq('id', data.id);
          
      if (error) throw error;
          
      // Navigate back after deletion
      router.back();
    } catch (error) {
      console.error('Error deleting job:', error);
      alert('Failed to remove this job. Please try again.');
    } finally {
      setDeleteDialogOpen(false);
    }
  };

  const handleRefresh = () => {
    setLoading(true);
    setError(null);
    fetchJobDetails();
  };

  const handleTailoredResume = () => {
    router.push(`/dashboard/resume?jobTitle=${encodeURIComponent(job?.job_title || "")}&company=${encodeURIComponent(job?.employer_name || job?.company_name || "")}`);
  };

  const handleCreateCoverLetter = () => {
    router.push(`/dashboard/resume?jobTitle=${encodeURIComponent(job?.job_title || "")}&company=${encodeURIComponent(job?.employer_name || job?.company_name || "")}&action=cover-letter`);
  };

  const handlePrepareInterview = () => {
    router.push(`/dashboard/interview?prompt=${encodeURIComponent(`Prepare me for an interview for a ${job?.job_title || ""} role at ${job?.employer_name || job?.company_name || ""}`)}`);
  };

  const handleShareJob = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Job: ${job?.job_title} at ${job?.employer_name || job?.company_name}`,
          text: `Check out this job: ${job?.job_title} at ${job?.employer_name || job?.company_name}\n\n${job?.job_description?.substring(0, 200)}...`,
          url: window.location.href,
        });
      } catch (error) {
        console.error("Error sharing job:", error);
        // Fallback to copy link dialog
        setShareDialogOpen(true);
      }
    } else {
      // Browsers that don't support the Web Share API
      setShareDialogOpen(true);
    }
  };

  const copyToClipboard = () => {
    const text = `Job: ${job?.job_title} at ${job?.employer_name || job?.company_name}\n\n${job?.job_description?.substring(0, 200)}...\n\nApply here: ${job?.job_apply_link || job?.application_link || window.location.href}`;
    navigator.clipboard.writeText(text);
    alert("Link copied to clipboard!");
    setShareDialogOpen(false);
  };

  const renderSalaryInfo = () => {
    if (job?.salary_range && job.salary_range !== "Not specified") {
      return (
        <div className="flex items-center gap-2 mb-6">
          <DollarSign className="text-primary h-5 w-5" />
          <span className="text-lg font-medium">
            {job.salary_range}
          </span>
        </div>
      );
    } else if (job?.job_min_salary && job?.job_max_salary) {
      return (
        <div className="flex items-center gap-2 mb-6">
          <DollarSign className="text-primary h-5 w-5" />
          <span className="text-lg font-medium">
            {job.job_min_salary.toLocaleString()}-{job.job_max_salary.toLocaleString()}{" "}
            {job.job_salary_currency || ""} {job.job_salary_period?.toLowerCase() || ""}
          </span>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="mr-2">
            <ArrowLeft />
          </Button>
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-4 w-1/4" />
          <div className="h-4" />
          <Skeleton className="h-6 w-40" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </div>
          <div className="h-4" />
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-40 w-full" />
          <div className="h-4" />
          <Skeleton className="h-6 w-40" />
          <div className="space-y-2">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="mr-2">
            <ArrowLeft />
          </Button>
          <h1 className="text-2xl font-bold">Job Details</h1>
        </div>
        
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">{error}</h2>
          <p className="text-muted-foreground mb-6 max-w-md">
            We couldn't load the job details. This may happen if the job listing has expired or if there's a connection issue.
          </p>
          <Button onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header with back button and actions */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="mr-2">
            <ArrowLeft />
          </Button>
          <h1 className="text-xl md:text-2xl font-bold hidden sm:block">Job Details</h1>
        </div>
        <div className="flex items-center gap-2">
          {isSaved && (
            <Button variant="ghost" size="icon" onClick={() => setDeleteDialogOpen(true)}>
              <Trash2 className="h-5 w-5" />
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={handleShareJob}>
            <Share2 className="h-5 w-5" />
          </Button>
          <Button 
            variant={isSaved ? "default" : "ghost"} 
            size="icon" 
            onClick={handleSaveJob}
            className={isSaved ? "text-white bg-primary hover:bg-primary/90" : ""}
          >
            <Bookmark className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Cached data indicator */}
      {usingCachedData && (
        <Alert className="mb-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 flex items-center">
          <Database className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <AlertDescription className="ml-2 text-blue-600 dark:text-blue-400 text-sm">
            Using cached results. Click refresh to get the latest data.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {/* Job Title Section */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-2">{job?.job_title || "Job Title"}</h2>
            <h3 className="text-xl text-muted-foreground mb-2">{job?.employer_name || job?.company_name || "Company"}</h3>
            <div className="flex items-center text-muted-foreground">
              <MapPin className="h-4 w-4 mr-1" />
              <span>{job?.job_city || job?.job_location || "Remote"}
              {job?.job_country ? `, ${job.job_country}` : ""}</span>
            </div>
          </div>

          {/* Salary Info */}
          {renderSalaryInfo()}

          {/* Application Status */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Application Status</h3>
            <div className="flex flex-wrap gap-2">
              <Badge 
                variant={applicationStatus === "saved" ? "default" : "outline"}
                className="cursor-pointer py-1 px-3 text-sm"
                onClick={() => updateApplicationStatus("saved")}
              >
                Saved
              </Badge>
              <Badge 
                variant={applicationStatus === "applied" ? "default" : "outline"}
                className="cursor-pointer py-1 px-3 text-sm"
                onClick={() => updateApplicationStatus("applied")}
              >
                Applied
              </Badge>
              <Badge 
                variant={applicationStatus === "interviewing" ? "default" : "outline"}
                className="cursor-pointer py-1 px-3 text-sm"
                onClick={() => updateApplicationStatus("interviewing")}
              >
                Interviewing
              </Badge>
              <Badge 
                variant={applicationStatus === "offered" ? "default" : "outline"}
                className="cursor-pointer py-1 px-3 text-sm"
                onClick={() => updateApplicationStatus("offered")}
              >
                Offered
              </Badge>
            </div>
          </div>

          {/* Job Description */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Job Description</h3>
            <div className="prose dark:prose-invert max-w-none">
              <p className="whitespace-pre-line">{job?.job_description || "No description available"}</p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          {/* Application Button (Mobile) */}
          <div className="mb-6 lg:hidden">
            <Button className="w-full py-6 text-lg" onClick={handleApply}>
              Apply Now
            </Button>
          </div>

          {/* Application Checklist */}
          <Card className="mb-6">
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold">Application Checklist</h3>
            </div>
            <div className="divide-y">
              <button 
                className="flex items-center justify-between w-full p-4 text-left hover:bg-muted/50 transition-colors"
                onClick={handleTailoredResume}
              >
                <div className="flex items-center">
                  <FileText className="h-5 w-5 text-primary mr-3" />
                  <span>Tailor your resume</span>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </button>
              
              <button 
                className="flex items-center justify-between w-full p-4 text-left hover:bg-muted/50 transition-colors"
                onClick={handleCreateCoverLetter}
              >
                <div className="flex items-center">
                  <Edit3 className="h-5 w-5 text-primary mr-3" />
                  <span>Create a cover letter</span>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </button>
              
              <button 
                className="flex items-center justify-between w-full p-4 text-left hover:bg-muted/50 transition-colors"
                onClick={handlePrepareInterview}
              >
                <div className="flex items-center">
                  <MessageCircle className="h-5 w-5 text-primary mr-3" />
                  <span>Practice interview</span>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
          </Card>

          {/* Application Tips */}
          <Card className="mb-6">
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold">Application Tips</h3>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                <p className="text-sm text-muted-foreground">Customize your resume to highlight relevant skills for this role</p>
              </div>
              <div className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                <p className="text-sm text-muted-foreground">Address specific job requirements in your cover letter</p>
              </div>
              <div className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                <p className="text-sm text-muted-foreground">Research {job?.employer_name || job?.company_name} before applying to mention in your application</p>
              </div>
              <div className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                <p className="text-sm text-muted-foreground">Follow up within 1-2 weeks if you don't hear back</p>
              </div>
            </div>
          </Card>

          {/* Application Button (Desktop) */}
          <div className="hidden lg:block sticky top-6">
            <Button className="w-full py-6 text-lg" onClick={handleApply}>
              Apply Now
            </Button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Job</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this job from your saved jobs?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteJob}>Remove</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Job</DialogTitle>
            <DialogDescription>
              Share this job opportunity with others
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <h3 className="text-sm font-medium mb-2">{job?.job_title} at {job?.employer_name || job?.company_name}</h3>
            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{job?.job_description}</p>
            <Button onClick={copyToClipboard} className="w-full">Copy to Clipboard</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
