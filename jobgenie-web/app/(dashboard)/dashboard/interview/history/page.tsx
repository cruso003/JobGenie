// app/dashboard/interview/history/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuthStore } from "@/lib/stores/auth";
import { useToast } from "@/components/ui/use-toast";
import {
  Briefcase,
  Users,
  Code,
  Clock,
  Calendar,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  BarChart2,
  Video,
  MessageSquare,
  Star,
  TrendingUp,
  Award,
} from "lucide-react";
import LoadingIndicator from "@/components/ui/loading-indicator";
import { format } from "date-fns";
import { getInterviewHistory, InterviewSession } from "@/lib/supabase/interview";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";

interface InterviewWithFeedback extends InterviewSession {
  feedback?: {
    avg_score: number;
    feedback_count: number;
  };
}

export default function InterviewHistoryPage() {
  const [interviews, setInterviews] = useState<InterviewWithFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({
    totalInterviews: 0,
    avgScore: 0,
    totalDuration: 0,
    completionRate: 0,
  });
  const itemsPerPage = 10;

  const { user } = useAuthStore();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchInterviewHistory();
      fetchInterviewStats();
    }
  }, [user, currentPage, filterType, filterStatus, searchTerm]);

  const fetchInterviewHistory = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // First get all interviews with basic filtering
      const { data: interviews, error: interviewError } = await supabase
        .from("interview_sessions")
        .select("*")
        .eq("user_id", user.id)
        .order("start_time", { ascending: false });

      if (interviewError) throw interviewError;

      // Then get feedback for each interview
      const interviewsWithFeedback = await Promise.all(
        interviews.map(async (interview) => {
          const { data: feedback, error: feedbackError } = await supabase
            .from("interview_feedback")
            .select("score")
            .eq("session_id", interview.id);

          if (feedbackError) {
            console.error("Error fetching feedback:", feedbackError);
            return interview;
          }

          const avgScore = feedback.length > 0
            ? feedback.reduce((sum, f) => sum + f.score, 0) / feedback.length
            : null;

          return {
            ...interview,
            feedback: {
              avg_score: avgScore,
              feedback_count: feedback.length,
            },
          };
        })
      );

      // Apply client-side filtering
      let filteredInterviews = interviewsWithFeedback;

      if (filterType !== "all") {
        filteredInterviews = filteredInterviews.filter(
          (interview) => interview.interview_type === filterType
        );
      }

      if (filterStatus !== "all") {
        filteredInterviews = filteredInterviews.filter(
          (interview) => interview.status === filterStatus
        );
      }

      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        filteredInterviews = filteredInterviews.filter(
          (interview) =>
            interview.role.toLowerCase().includes(searchLower) ||
            (interview.company && interview.company.toLowerCase().includes(searchLower))
        );
      }

      // Pagination
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const paginatedInterviews = filteredInterviews.slice(startIndex, endIndex);

      setInterviews(paginatedInterviews);
      setTotalPages(Math.ceil(filteredInterviews.length / itemsPerPage));
    } catch (error) {
      console.error("Error fetching interview history:", error);
      toast({
        title: "Error",
        description: "Failed to load interview history",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchInterviewStats = async () => {
    try {
      // Get all interviews for stats calculation
      const { data: allInterviews, error: interviewError } = await supabase
        .from("interview_sessions")
        .select("*")
        .eq("user_id", user?.id);

      if (interviewError) throw interviewError;

      const totalInterviews = allInterviews.length;
      const completedInterviews = allInterviews.filter(
        (interview) => interview.status === "completed"
      ).length;
      const totalDurationSeconds = allInterviews.reduce(
        (sum, interview) => sum + (interview.duration_seconds || 0),
        0
      );

      // Get average score from feedback
      const { data: feedback, error: feedbackError } = await supabase
        .from("interview_feedback")
        .select("score")
        .in("session_id", allInterviews.map(interview => interview.id));

      let avgScore = 0;
      if (!feedbackError && feedback.length > 0) {
        avgScore = feedback.reduce((sum, f) => sum + f.score, 0) / feedback.length;
      }

      setStats({
        totalInterviews,
        avgScore,
        totalDuration: totalDurationSeconds,
        completionRate: totalInterviews ? (completedInterviews / totalInterviews) * 100 : 0,
      });
    } catch (error) {
      console.error("Error fetching interview stats:", error);
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "N/A";
    const minutes = Math.floor(seconds / 60);
    return `${minutes} min`;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "behavioral":
        return <Users className="h-4 w-4" />;
      case "technical":
        return <Code className="h-4 w-4" />;
      default:
        return <Briefcase className="h-4 w-4" />;
    }
  };

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case "video":
        return <Video className="h-4 w-4" />;
      case "text":
        return <MessageSquare className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      case "in_progress":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
      case "abandoned":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
    }
  };

  const ScoreStars = ({ score }: { score: number | null }) => {
    if (!score) return <span className="text-sm text-muted-foreground">No feedback</span>;
    
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= Math.round(score) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
            }`}
          />
        ))}
        <span className="ml-2 text-sm font-medium">{score.toFixed(1)}</span>
      </div>
    );
  };

  if (loading) {
    return <LoadingIndicator message="Loading interview history..." />;
  }

  return (
    <div className="container max-w-7xl py-6">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Interview History</h1>
            <p className="text-muted-foreground">
              Review your past practice sessions and track your progress
            </p>
          </div>
          <Button onClick={() => router.push("/dashboard/interview")}>
            New Interview
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Interviews</CardTitle>
              <BarChart2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalInterviews}</div>
              <p className="text-xs text-muted-foreground">
                All practice sessions
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Average Score</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgScore.toFixed(1)}/5</div>
              <p className="text-xs text-muted-foreground">
                Based on AI feedback
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Duration</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.floor(stats.totalDuration / 3600)}h {Math.floor((stats.totalDuration % 3600) / 60)}m
              </div>
              <p className="text-xs text-muted-foreground">
                Time spent practicing
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completionRate.toFixed(0)}%</div>
              <p className="text-xs text-muted-foreground">
                Sessions completed
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by role or company..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Interview Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="behavioral">Behavioral</SelectItem>
              <SelectItem value="technical">Technical</SelectItem>
              <SelectItem value="general">General</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="abandoned">Abandoned</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Score</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {interviews.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    <p className="text-muted-foreground">No interviews found</p>
                  </TableCell>
                </TableRow>
              ) : (
                interviews.map((interview) => (
                  <TableRow key={interview.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {format(new Date(interview.start_time), "MMM d, yyyy")}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getTypeIcon(interview.interview_type)}
                        <span className="capitalize">{interview.interview_type}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getModeIcon(interview.mode)}
                        <span className="capitalize">{interview.mode}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{interview.role}</TableCell>
                    <TableCell>{interview.company || "—"}</TableCell>
                    <TableCell>{formatDuration(interview.duration_seconds || null)}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(interview.status)}>
                        {interview.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <ScoreStars score={interview.feedback?.avg_score || null} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/dashboard/interview/session/${interview.id}`)}
                      >
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
