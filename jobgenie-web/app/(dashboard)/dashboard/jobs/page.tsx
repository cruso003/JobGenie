// app/explore/page.tsx
"use client";

import React, { useState, useEffect, JSX } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useTheme } from "next-themes";

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

// Icons
import {
  Search,
  MapPin,
  X,
  ChevronDown,
  TrendingUp,
  Bookmark,
  Code,
  BarChart2,
  PenTool,
  DollarSign,
  Hammer,
  Box,
  Briefcase,
  Database,
  RefreshCw,
} from "lucide-react";

// Store
import { useAuthStore } from "@/lib/stores/auth";
import { useJobsStore } from "@/lib/stores/jobs";

// API Utils
import {
  searchJobs,
  searchJobsWithFilters,
  forceRefreshJobSearch,
} from "@/lib/jsearch";
import { generateJobSearchQuery } from "@/lib/gemini";
import { supabase } from "@/lib/supabase";

type JobCategory = {
  name: string;
  icon: JSX.Element;
  query: string;
};

const categories: JobCategory[] = [
  {
    name: "Software Development",
    icon: <Code className="h-4 w-4" />,
    query: "software developer",
  },
  {
    name: "Data Science",
    icon: <BarChart2 className="h-4 w-4" />,
    query: "data scientist",
  },
  {
    name: "Design",
    icon: <PenTool className="h-4 w-4" />,
    query: "ui ux designer",
  },
  {
    name: "Marketing",
    icon: <TrendingUp className="h-4 w-4" />,
    query: "marketing",
  },
  { name: "Sales", icon: <DollarSign className="h-4 w-4" />, query: "sales" },
  {
    name: "Engineering",
    icon: <Hammer className="h-4 w-4" />,
    query: "engineer",
  },
  {
    name: "Product",
    icon: <Box className="h-4 w-4" />,
    query: "product manager",
  },
  {
    name: "Finance",
    icon: <Briefcase className="h-4 w-4" />,
    query: "finance",
  },
];

const jobTypes = [
  { label: "All Types", value: "" },
  { label: "Full-time", value: "FULLTIME" },
  { label: "Part-time", value: "PARTTIME" },
  { label: "Contract", value: "CONTRACTOR" },
  { label: "Internship", value: "INTERN" },
];

export default function ExplorePage() {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const { user } = useAuthStore();
  const { saveJob, isJobSaved } = useJobsStore();

  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [location, setLocation] = useState("");
  const [selectedJobType, setSelectedJobType] = useState("");
  const [selectedJobTypeLabel, setSelectedJobTypeLabel] =
    useState("Select Job Type");
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [selectedSkill, setSelectedSkill] = useState("");
  const [selectedSkillLabel, setSelectedSkillLabel] = useState("Select Skill");
  const [jobTypeOpen, setJobTypeOpen] = useState(false);
  const [skillDialogOpen, setSkillDialogOpen] = useState(false);
  const [usingCachedData, setUsingCachedData] = useState(false);

  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [trendingJobs, setTrendingJobs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadingTrending, setLoadingTrending] = useState(false);

  // Fetch profile on component mount
  useEffect(() => {
    if (user) {
      fetchUserProfile();
    }
  }, [user]);

  // Fetch trending jobs when profile loads or selectedSkill changes
  useEffect(() => {
    if (profile?.skills?.length > 0) {
      const initialSkill = profile.skills[0] || "";
      setSelectedSkill(initialSkill);
      setSelectedSkillLabel(initialSkill);
      fetchTrendingJobs(initialSkill);
    }
  }, [profile]);

  const fetchUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user?.id)
        .single();

      if (error) throw error;
      setProfile(data);

      // If user has location in profile, set it as default
      if (data?.location) {
        setLocation(data.location);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const fetchTrendingJobs = async (skill: string) => {
    try {
      setLoadingTrending(true);
      setUsingCachedData(false);

      const startTime = Date.now();
      const result = await searchJobs(`trending jobs in ${skill}`, 1, 3);
      const timeTaken = Date.now() - startTime;

      // If result came back very quickly, it was likely from cache
      if (timeTaken < 300) {
        setUsingCachedData(true);
      }

      if (result?.data && Array.isArray(result.data)) {
        setTrendingJobs(result.data);
      }
    } catch (error) {
      console.error("Error fetching trending jobs:", error);
    } finally {
      setLoadingTrending(false);
    }
  };

  const handleSearch = async () => {
    try {
      setIsLoading(true);
      setUsingCachedData(false);

      // Generate optimized search query using Gemini if the profile is available
      let optimizedQuery = searchQuery;

      if (profile && !searchQuery) {
        try {
          // Generate a search query based on user profile
          const suggestedQuery = await generateJobSearchQuery(
            profile.experience?.currentTitle || "professional",
            location,
            remoteOnly
          );

          if (suggestedQuery) {
            optimizedQuery = suggestedQuery;
          }
        } catch (err) {
          console.error("Error generating search query:", err);
        }
      }

      // If still no query, use a default one
      if (!optimizedQuery) {
        optimizedQuery = profile?.experience?.currentTitle || "jobs";
      }

      // Prepare filter parameters
      const filters: any = {};

      if (selectedJobType) {
        filters.employment_types = [selectedJobType];
      }

      if (remoteOnly) {
        filters.remote_jobs_only = true;
      }

      // Build final search string
      let searchString = `${optimizedQuery} ${location}`.trim();

      // Perform the search
      const startTime = Date.now();
      const result = await searchJobsWithFilters(searchString, filters);
      const timeTaken = Date.now() - startTime;

      if (timeTaken < 300) {
        setUsingCachedData(true);
      }

      if (result?.data && Array.isArray(result.data)) {
        setSearchResults(result.data);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error("Error searching jobs:", error);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategorySelect = async (category: JobCategory) => {
    setSearchQuery(category.query);
    await handleSearch();
  };

  const handleRefreshWithCache = async () => {
    setIsRefreshing(true);
    setUsingCachedData(false);

    try {
      // Force refresh trending jobs
      if (selectedSkill) {
        await forceRefreshJobSearch(`trending jobs in ${selectedSkill}`, 1, 3);
        await fetchTrendingJobs(selectedSkill);
      }

      // Force refresh search results if any
      if (searchResults.length > 0) {
        let searchString = `${
          searchQuery || profile?.experience?.currentTitle || "jobs"
        } ${location}`.trim();
        const filters: any = {};
        if (selectedJobType) {
          filters.employment_types = [selectedJobType];
        }
        if (remoteOnly) {
          filters.remote_jobs_only = true;
        }

        await forceRefreshJobSearch(searchString, 1, 1, filters);
        await handleSearch();
      }
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSaveJob = async (job: any) => {
    try {
      // Extract salary information if available
      let salaryRange = "Not specified";

      if (job.job_min_salary && job.job_max_salary) {
        salaryRange = `$${job.job_min_salary.toLocaleString()} - $${job.job_max_salary.toLocaleString()}`;
      } else if (job.job_description) {
        const rangeRegex =
          /(?:\$|USD)\s?(\d{1,3}(?:,\d{3})*)\s?-\s?(?:\$|USD)?\s?(\d{1,3}(?:,\d{3})*)/i;
        const rangeMatch = job.job_description.match(rangeRegex);
        if (rangeMatch) {
          const minSalary = parseInt(rangeMatch[1].replace(/,/g, ""), 10);
          const maxSalary = parseInt(rangeMatch[2].replace(/,/g, ""), 10);
          salaryRange = `$${minSalary.toLocaleString()} - $${maxSalary.toLocaleString()}`;
        } else {
          const singleRegex =
            /(?:\$|USD)\s?(\d{1,3}(?:,\d{3})*)\s?(?!\s?-\s?(?:\$|USD)?\s?\d{1,3}(?:,\d{3})*)/i;
          const singleMatch = job.job_description.match(singleRegex);
          if (singleMatch) {
            const salary = parseInt(singleMatch[1].replace(/,/g, ""), 10);
            salaryRange = `$${salary.toLocaleString()}`;
          }
        }
      }

      await saveJob({
        job_title: job.job_title,
        company_name: job.employer_name,
        job_description: job.job_description,
        job_location: job.job_city || location || "Remote",
        salary_range: salaryRange,
        application_link: job.job_apply_link,
        job_source: "JSearch",
        external_job_id: job.job_id || `jobgenie-${Date.now()}`,
        status: "saved",
        match_percentage: job.match_percentage || 85,
        match_reasoning: job.match_reasoning || "Based on your search criteria",
      });

      alert("Job saved successfully!");
    } catch (error) {
      console.error("Error saving job:", error);
      alert("Failed to save job. Please try again.");
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {isLoading && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="flex flex-col items-center gap-2">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <p className="text-sm text-muted-foreground">
              Searching for jobs...
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Explore Jobs</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefreshWithCache}
          disabled={isRefreshing}
          className="hidden sm:flex items-center gap-2"
        >
          {isRefreshing ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Refreshing...</span>
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4" />
              <span>Refresh</span>
            </>
          )}
        </Button>
      </div>

      {/* Search Bar */}
      <div className="space-y-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Job title or keywords"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="pl-10"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                title="Clear search"
                aria-label="Clear search"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>

          <div className="flex gap-2 flex-1">
            <div className="relative flex-1">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="pl-10"
              />
            </div>

            <Button onClick={handleSearch}>
              <Search className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Search</span>
            </Button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <div className="flex items-center gap-2">
            <Label htmlFor="remote-only">Remote Only</Label>
            <Switch
              id="remote-only"
              checked={remoteOnly}
              onCheckedChange={setRemoteOnly}
            />
          </div>

          <DropdownMenu open={jobTypeOpen} onOpenChange={setJobTypeOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="w-full sm:w-40 flex justify-between items-center mt-2 sm:mt-0"
              >
                {selectedJobTypeLabel}
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {jobTypes.map((item) => (
                <DropdownMenuItem
                  key={item.value}
                  onClick={() => {
                    setSelectedJobType(item.value);
                    setSelectedJobTypeLabel(item.label);
                    setJobTypeOpen(false);
                  }}
                >
                  {item.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Cached data indicator */}
      {usingCachedData && (
        <Alert className="mb-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 flex items-center">
          <Database className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <AlertDescription className="ml-2 text-blue-600 dark:text-blue-400 text-sm">
            Using cached results. Pull down to refresh.
          </AlertDescription>
        </Alert>
      )}

      {/* Categories */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3">Browse by Category</h2>
        <div className="relative">
          <div className="overflow-x-auto pb-2 hide-scrollbar">
            <div className="flex space-x-2 min-w-max">
              {categories.map((category) => (
                <Button
                  key={category.name}
                  variant="outline"
                  className="flex items-center gap-2 whitespace-nowrap"
                  onClick={() => handleCategorySelect(category)}
                >
                  <span className="text-primary">{category.icon}</span>
                  <span>{category.name}</span>
                </Button>
              ))}
            </div>
          </div>
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none" />
        </div>
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3">Search Results</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {searchResults.map((item) => (
              <JobCard
                key={item.job_id || Math.random().toString()}
                job={item}
                location={location}
                isSaved={isJobSaved(item.job_id)}
                onSave={() => handleSaveJob(item)}
                onViewDetails={() =>
                  router.push(`/dashboard/job-details?jobId=${item.job_id}`)
                }
              />
            ))}
          </div>
        </div>
      )}

      {/* Trending Jobs */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
          <h2 className="text-lg font-semibold flex items-center flex-wrap">
            <span className="mr-1">Trending</span>
            <span className="text-primary truncate max-w-[100px] sm:max-w-none">
              {selectedSkill || "Skill"}
            </span>
            <span className="ml-1">Jobs</span>
          </h2>

          {profile?.skills?.length > 0 && (
            <Dialog open={skillDialogOpen} onOpenChange={setSkillDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="shrink-0">
                  {selectedSkillLabel}
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Select Skill</DialogTitle>
                </DialogHeader>
                <ScrollArea className="max-h-[50vh]">
                  <div className="space-y-1 p-2">
                    {profile.skills.map((skill: string) => (
                      <Button
                        key={skill}
                        variant="ghost"
                        className="w-full justify-start"
                        onClick={() => {
                          setSelectedSkill(skill);
                          setSelectedSkillLabel(skill);
                          setSkillDialogOpen(false);
                          fetchTrendingJobs(skill);
                        }}
                      >
                        {skill}
                      </Button>
                    ))}
                  </div>
                </ScrollArea>
              </DialogContent>
            </Dialog>
          )}
        </div>
        {loadingTrending ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="flex justify-between">
                    <div className="space-y-1">
                      <Skeleton className="h-5 w-40" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <Skeleton className="h-12 w-12 rounded" />
                  </div>
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-3/4" />
                </CardContent>
                <CardFooter>
                  <div className="flex justify-between w-full">
                    <Skeleton className="h-9 w-28" />
                    <Skeleton className="h-9 w-24" />
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : trendingJobs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {trendingJobs.map((item) => (
              <JobCard
                key={item.job_id || Math.random().toString()}
                job={item}
                location={location}
                isSaved={isJobSaved(item.job_id)}
                onSave={() => handleSaveJob(item)}
                onViewDetails={() =>
                  router.push(`/dashboard/job-details?jobId=${item.job_id}`)
                }
              />
            ))}
          </div>
        ) : (
          <Card className="flex flex-col items-center p-6">
            <TrendingUp className="h-8 w-8 text-muted-foreground mb-3" />
            <p className="text-center text-muted-foreground">
              No trending jobs available right now
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}

interface JobCardProps {
  job: any;
  location: string;
  isSaved: boolean;
  onSave: () => void;
  onViewDetails: () => void;
}

function JobCard({
  job,
  location,
  isSaved,
  onSave,
  onViewDetails,
}: JobCardProps) {
  return (
    <Card className="overflow-hidden h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="space-y-1 flex-1 pr-3">
            <CardTitle className="text-base leading-tight line-clamp-2">
              {job.job_title}
            </CardTitle>
            <CardDescription className="line-clamp-1">
              {job.employer_name}
            </CardDescription>
            <div className="flex items-center text-xs text-muted-foreground">
              <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
              <span className="truncate">
                {job.job_city || job.job_country || location || "Remote"}
              </span>
            </div>
          </div>
          {job.employer_logo && (
            <div className="h-12 w-12 rounded bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
              <Image
                src={job.employer_logo}
                alt={job.employer_name}
                width={48}
                height={48}
                className="object-contain w-10 h-10"
              />
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-sm line-clamp-3">
          {job.job_description || "No description available"}
        </p>
      </CardContent>
      <CardFooter className="flex justify-between pt-3 gap-2">
        <Button onClick={onViewDetails} className="flex-1 text-sm px-2 sm:px-4">
          View Details
        </Button>
        <Button
          variant={isSaved ? "secondary" : "outline"}
          onClick={onSave}
          disabled={isSaved}
          className="text-sm"
        >
          <Bookmark className="h-4 w-4 mr-1 sm:mr-2 flex-shrink-0" />
          <span>{isSaved ? "Saved" : "Save"}</span>
        </Button>
      </CardFooter>
    </Card>
  );
}
