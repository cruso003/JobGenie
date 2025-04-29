// components/JobCard.tsx
import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { MapPin, DollarSign, ChevronRight, Star } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface JobCardProps {
  job: any;
  className?: string;
}

export default function JobCard({ job, className }: JobCardProps) {
  const router = useRouter();

  const handleViewDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/dashboard/job-details?jobId=${job.job_id || job.id || job.external_job_id || String(Math.random())}&source=job-card`);
  };

  const formatSalary = () => {
    // Check for pre-formatted salary_range (for saved jobs)
    if (job.salary_range && job.salary_range !== "Not specified") {
      const salaryMatch = job.salary_range.match(/\$(\d{1,3}(?:,\d{3})*)\s?(?:-\s?\$(\d{1,3}(?:,\d{3})*))?/);
      if (salaryMatch) {
        const minSalary = parseInt(salaryMatch[1].replace(/,/g, ''), 10);
        if (salaryMatch[2]) {
          const maxSalary = parseInt(salaryMatch[2].replace(/,/g, ''), 10);
          return `$${minSalary.toLocaleString()} - $${maxSalary.toLocaleString()}`;
        }
        return `$${minSalary.toLocaleString()}`;
      }
      return job.salary_range; // Fallback if the format doesn't match
    }
  
    // Check for job_min_salary and job_max_salary (for recommended jobs)
    if (job.job_min_salary && job.job_max_salary) {
      return `$${job.job_min_salary.toLocaleString()} - $${job.job_max_salary.toLocaleString()}`;
    }
  
    // Try to extract salary from job_description
    if (job.job_description) {
      // Check for a salary range (e.g., "$140,000 - $200,000")
      const rangeRegex = /(?:\$|USD)\s?(\d{1,3}(?:,\d{3})*)\s?-\s?(?:\$|USD)?\s?(\d{1,3}(?:,\d{3})*)/i;
      const rangeMatch = job.job_description.match(rangeRegex);
      if (rangeMatch) {
        const minSalary = parseInt(rangeMatch[1].replace(/,/g, ''), 10);
        const maxSalary = parseInt(rangeMatch[2].replace(/,/g, ''), 10);
        return `$${minSalary.toLocaleString()} - $${maxSalary.toLocaleString()}`;
      }
  
      // Check for a single salary (e.g., "Salary 140,000 annually")
      const singleRegex = /(?:\$|USD)\s?(\d{1,3}(?:,\d{3})*)\s?(?!\s?-\s?(?:\$|USD)?\s?\d{1,3}(?:,\d{3})*)/i;
      const singleMatch = job.job_description.match(singleRegex);
      if (singleMatch) {
        const salary = parseInt(singleMatch[1].replace(/,/g, ''), 10);
        return `$${salary.toLocaleString()}`;
      }
    }
  
    // Fallback
    return "Salary not specified";
  };

  const matchPercentage = job.match_percentage || 85;

  return (
    <Card className={`overflow-hidden h-full ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-md overflow-hidden bg-muted flex items-center justify-center">
            {job.employer_logo ? (
              <Image
                src={job.employer_logo}
                alt={job.employer_name || "Company logo"}
                width={40}
                height={40}
                className="object-contain"
              />
            ) : (
              <div className="w-full h-full bg-primary flex items-center justify-center">
                <span className="text-lg font-bold text-white">
                  {job.employer_name?.charAt(0) || "J"}
                </span>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base leading-tight line-clamp-1">
              {job.job_title}
            </CardTitle>
            <CardDescription className="line-clamp-1">
              {job.employer_name}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pb-3">
        <div className="flex flex-wrap gap-4 mb-3 text-sm text-muted-foreground">
          <div className="flex items-center">
            <MapPin className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
            <span>{job.job_city || job.job_country || "Remote"}</span>
          </div>
          
          <div className="flex items-center">
            <DollarSign className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
            <span>{formatSalary()}</span>
          </div>
        </div>
        
        <p className="text-sm line-clamp-2 text-muted-foreground">
          {job.job_description ? `${job.job_description.substring(0, 120)}...` : "No description available"}
        </p>
      </CardContent>
      
      <CardFooter className="flex justify-between pt-3 border-t">
        <Button 
          size="sm" 
          onClick={handleViewDetails}
          className="flex items-center gap-1"
        >
          <span>View Details</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
        
        <Badge 
          variant="secondary" 
          className="flex items-center gap-1"
        >
          <Star className="h-3.5 w-3.5 fill-primary text-primary" />
          <span className="text-primary">{matchPercentage}% Match</span>
        </Badge>
      </CardFooter>
    </Card>
  );
}
