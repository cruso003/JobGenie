// app/saved-jobs/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// UI Components
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

// Icons
import {
  ArrowLeft,
  Filter,
  XCircle,
  Bookmark,
} from "lucide-react";

// Store
import { useJobsStore } from "@/lib/stores/jobs";
import JobCard from "@/components/JobCard";
import LoadingIndicator from "@/components/ui/loading-indicator";

export default function SavedJobsPage() {
  const { savedJobs, fetchSavedJobs, isLoading } = useJobsStore();
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  
  const router = useRouter();
  
  useEffect(() => {
    fetchSavedJobs();
  }, [fetchSavedJobs]);
  
  // Map the active tab to the filter status
  useEffect(() => {
    if (activeTab === "all") {
      setFilterStatus(null);
    } else {
      setFilterStatus(activeTab);
    }
  }, [activeTab]);
  
  const filteredJobs = filterStatus 
    ? savedJobs.filter(job => job.status === filterStatus)
    : savedJobs;
  
  const statusCounts = {
    all: savedJobs.length,
    saved: savedJobs.filter(job => job.status === 'saved').length,
    applied: savedJobs.filter(job => job.status === 'applied').length,
    interviewing: savedJobs.filter(job => job.status === 'interviewing').length,
    offered: savedJobs.filter(job => job.status === 'offered').length,
    rejected: savedJobs.filter(job => job.status === 'rejected').length,
  };

  const handleFilterSelect = (status: string | null) => {
    if (status === "all") {
      setActiveTab("all");
      setFilterStatus(null);
    } else {
      setActiveTab(status || "all");
      setFilterStatus(status);
    }
    setFilterDialogOpen(false);
  };
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="mr-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Saved Jobs</h1>
        </div>
        
        {/* Mobile Filter Button */}
        <div className="block md:hidden">
          <Dialog open={filterDialogOpen} onOpenChange={setFilterDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="icon">
                <Filter className="h-5 w-5" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Filter Jobs</DialogTitle>
              </DialogHeader>
              <div className="space-y-2 mt-4">
                <Button 
                  variant={filterStatus === null ? "default" : "outline"} 
                  className="w-full justify-between"
                  onClick={() => handleFilterSelect(null)}
                >
                  <span>All Jobs</span>
                  <Badge variant="secondary">{statusCounts.all}</Badge>
                </Button>
                <Button 
                  variant={filterStatus === 'saved' ? "default" : "outline"} 
                  className="w-full justify-between"
                  onClick={() => handleFilterSelect('saved')}
                >
                  <span>Saved</span>
                  <Badge variant="secondary">{statusCounts.saved}</Badge>
                </Button>
                <Button 
                  variant={filterStatus === 'applied' ? "default" : "outline"} 
                  className="w-full justify-between"
                  onClick={() => handleFilterSelect('applied')}
                >
                  <span>Applied</span>
                  <Badge variant="secondary">{statusCounts.applied}</Badge>
                </Button>
                <Button 
                  variant={filterStatus === 'interviewing' ? "default" : "outline"} 
                  className="w-full justify-between"
                  onClick={() => handleFilterSelect('interviewing')}
                >
                  <span>Interviewing</span>
                  <Badge variant="secondary">{statusCounts.interviewing}</Badge>
                </Button>
                <Button 
                  variant={filterStatus === 'offered' ? "default" : "outline"} 
                  className="w-full justify-between"
                  onClick={() => handleFilterSelect('offered')}
                >
                  <span>Offered</span>
                  <Badge variant="secondary">{statusCounts.offered}</Badge>
                </Button>
                <Button 
                  variant={filterStatus === 'rejected' ? "default" : "outline"} 
                  className="w-full justify-between"
                  onClick={() => handleFilterSelect('rejected')}
                >
                  <span>Rejected</span>
                  <Badge variant="secondary">{statusCounts.rejected}</Badge>
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      {/* Desktop Filter Tabs */}
      <div className="hidden md:block mb-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-6">
            <TabsTrigger value="all">
              All ({statusCounts.all})
            </TabsTrigger>
            <TabsTrigger value="saved">
              Saved ({statusCounts.saved})
            </TabsTrigger>
            <TabsTrigger value="applied">
              Applied ({statusCounts.applied})
            </TabsTrigger>
            <TabsTrigger value="interviewing">
              Interviewing ({statusCounts.interviewing})
            </TabsTrigger>
            <TabsTrigger value="offered">
              Offered ({statusCounts.offered})
            </TabsTrigger>
            <TabsTrigger value="rejected">
              Rejected ({statusCounts.rejected})
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      {/* Active Filter Indicator (Mobile) */}
      {filterStatus && (
        <div className="flex items-center justify-center mb-4 md:hidden">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-muted">
            <span className="text-sm text-muted-foreground mr-2">
              Filtered by: <span className="font-semibold">{filterStatus.charAt(0).toUpperCase() + filterStatus.slice(1)}</span>
            </span>
            <button
              onClick={() => handleFilterSelect(null)}
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Clear filter"
            >
              <XCircle className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
      
      {/* Job List */}
      {isLoading ? (
        <div className="py-8">
          <LoadingIndicator />
        </div>
      ) : filteredJobs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredJobs.map((job) => (
            <Card 
              key={job.id}
              className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => router.push(`/dashboard/job-details?jobId=${job.external_job_id}`)}
            >
              <JobCard 
                job={{
                  job_id: job.external_job_id,
                  job_title: job.job_title,
                  employer_name: job.company_name,
                  job_description: job.job_description,
                  job_city: job.job_location,
                  salary_range: job.salary_range,
                  match_percentage: job.match_percentage || 100,
                }}
              />
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16">
          <Bookmark className="h-16 w-16 text-muted-foreground/20 mb-4" />
          <h2 className="text-xl font-semibold mb-2">No saved jobs yet</h2>
          <p className="text-muted-foreground text-center mb-6 max-w-md">
            Save jobs you're interested in to track them here
          </p>
          <Button onClick={() => router.push("/dashboard/jobs")}>
            Find Jobs
          </Button>
        </div>
      )}
    </div>
  );
}
