// app/resources/interview-tips/page.tsx
"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  Code, 
  Briefcase, 
  ArrowLeft, 
  Lightbulb, 
  AlertTriangle,
  CheckCircle2,
  Star,
  Brain,
  Video,
  Mic,
  Clock,
  MessageSquare
} from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

const tipCategories = [
  {
    id: "behavioral",
    title: "Behavioral Interview",
    icon: Users,
    color: "text-blue-600 bg-blue-100 dark:text-blue-300 dark:bg-blue-900/30",
    tips: [
      {
        title: "STAR Method",
        description: "Structure your answers with Situation, Task, Action, Result",
        content: "When answering behavioral questions, use the STAR method: Describe the Situation, explain the Task you faced, detail the Actions you took, and share the Result you achieved. This framework ensures comprehensive and structured responses."
      },
      {
        title: "Prepare Stories",
        description: "Have 5-7 versatile stories ready",
        content: "Prepare diverse stories showcasing leadership, problem-solving, teamwork, and overcoming challenges. Each story should be adaptable to multiple questions, saving you from scrambling for examples during the interview."
      },
      {
        title: "Be Specific",
        description: "Use real examples with measurable outcomes",
        content: "Instead of general statements, provide specific examples with quantifiable results. For instance, 'Increased customer satisfaction scores by 25% through implementing a new feedback system' is more impactful than 'I improved customer satisfaction.'"
      },
      {
        title: "Focus on 'I', not 'We'",
        description: "Highlight your individual contributions",
        content: "While teamwork is important, interviews assess your personal contributions. Use 'I' statements to clearly communicate your role and impact in team projects, while still acknowledging the team's success."
      }
    ]
  },
  {
    id: "technical",
    title: "Technical Interview",
    icon: Code,
    color: "text-green-600 bg-green-100 dark:text-green-300 dark:bg-green-900/30",
    tips: [
      {
        title: "Think Aloud",
        description: "Verbalize your problem-solving process",
        content: "During technical interviews, explain your thought process out loud. This helps the interviewer understand your approach, even if you don't reach the optimal solution. They're interested in how you think, not just the final answer."
      },
      {
        title: "Ask Clarifying Questions",
        description: "Ensure you understand the problem fully",
        content: "Before diving into a solution, ask about edge cases, constraints, and expected outputs. This demonstrates thoroughness and helps prevent solving the wrong problem."
      },
      {
        title: "Start Simple",
        description: "Begin with a brute-force solution, then optimize",
        content: "First, implement a working solution, even if it's not optimal. Once working, discuss optimization opportunities. This shows you can balance pragmatism with efficiency."
      },
      {
        title: "Practice on Real Problems",
        description: "Use platforms like LeetCode and HackerRank",
        content: "Regular practice with coding challenges builds both speed and confidence. Focus on understanding patterns rather than memorizing solutions."
      }
    ]
  },
  {
    id: "general",
    title: "General Interview",
    icon: Briefcase,
    color: "text-purple-600 bg-purple-100 dark:text-purple-300 dark:bg-purple-900/30",
    tips: [
      {
        title: "Research the Company",
        description: "Know their values, products, and recent news",
        content: "Demonstrate genuine interest by researching the company's mission, recent achievements, and industry position. This helps you tailor your responses and ask insightful questions."
      },
      {
        title: "Prepare Questions",
        description: "Ask thoughtful questions about the role and company",
        content: "Prepare 3-5 questions about the team structure, company culture, and role expectations. This shows engagement and helps you evaluate if the company is a good fit for you."
      },
      {
        title: "Body Language",
        description: "Maintain eye contact and confident posture",
        content: "Even in video interviews, good posture and eye contact (looking at the camera) convey confidence and engagement. Smile naturally and use hand gestures to emphasize points."
      },
      {
        title: "Follow Up",
        description: "Send a thank-you email within 24 hours",
        content: "A brief, personalized thank-you email reinforces your interest and professionalism. Reference specific conversation points to show you were engaged."
      }
    ]
  }
];

const commonMistakes = [
  {
    mistake: "Arriving late or unprepared",
    solution: "Plan to arrive 10-15 minutes early with extra copies of your resume"
  },
  {
    mistake: "Speaking negatively about previous employers",
    solution: "Focus on what you learned and why you're excited about new opportunities"
  },
  {
    mistake: "Giving vague or rambling answers",
    solution: "Use structured response frameworks like STAR and practice conciseness"
  },
  {
    mistake: "Not asking any questions",
    solution: "Prepare thoughtful questions that show research and genuine interest"
  },
  {
    mistake: "Failing to follow up after the interview",
    solution: "Send a personalized thank-you email within 24 hours"
  }
];

const videoInterviewTips = [
  {
    title: "Technical Setup",
    icon: Video,
    tips: [
      "Test your equipment 30 minutes before the interview",
      "Use a stable internet connection with backup options",
      "Position your camera at eye level",
      "Use proper lighting facing you, not behind you"
    ]
  },
  {
    title: "Environment",
    icon: Brain,
    tips: [
      "Choose a quiet, professional background",
      "Remove clutter and distractions from view",
      "Inform others in your space about your interview",
      "Use a virtual background if your space isn't ideal"
    ]
  },
  {
    title: "Audio Quality",
    icon: Mic,
    tips: [
      "Use headphones to prevent echo",
      "Test your microphone beforehand",
      "Mute notifications on all devices",
      "Keep a glass of water nearby"
    ]
  },
  {
    title: "Professionalism",
    icon: Clock,
    tips: [
      "Dress professionally from head to toe",
      "Log in 5-10 minutes early",
      "Maintain eye contact with the camera",
      "Minimize on-screen distractions"
    ]
  }
];

export default function InterviewTipsPage() {
  const [selectedCategory, setSelectedCategory] = useState("behavioral");
  const router = useRouter();

  return (
    <div className="container max-w-6xl py-6 px-4 mx-auto">
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Interview Tips & Resources</h1>
        <p className="text-muted-foreground">
          Comprehensive guide to acing your next interview
        </p>
      </div>

      <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="behavioral">Behavioral</TabsTrigger>
          <TabsTrigger value="technical">Technical</TabsTrigger>
          <TabsTrigger value="general">General</TabsTrigger>
        </TabsList>

        {tipCategories.map((category) => (
          <TabsContent key={category.id} value={category.id}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${category.color}`}>
                      <category.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle>{category.title} Tips</CardTitle>
                      <CardDescription>Essential strategies for success</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 md:grid-cols-2">
                    {category.tips.map((tip, index) => (
                      <Card key={index} className="shadow-sm">
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Lightbulb className="h-5 w-5 text-yellow-500" />
                            {tip.title}
                          </CardTitle>
                          <CardDescription>{tip.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm">{tip.content}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Video Interview Tips Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="mt-8"
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="h-6 w-6 text-primary" />
              Video Interview Best Practices
            </CardTitle>
            <CardDescription>
              Master the unique challenges of virtual interviews
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {videoInterviewTips.map((section, index) => (
                <div key={index} className="space-y-4">
                  <div className="flex items-center gap-2 font-medium">
                    <section.icon className="h-5 w-5 text-primary" />
                    {section.title}
                  </div>
                  <ul className="space-y-2">
                    {section.tips.map((tip, tipIndex) => (
                      <li key={tipIndex} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Common Mistakes Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="mt-8"
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-6 w-6 text-destructive" />
              Common Interview Mistakes to Avoid
            </CardTitle>
            <CardDescription>
              Learn from others' experiences and sidestep these pitfalls
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {commonMistakes.map((item, index) => (
                <div key={index} className="flex gap-4 p-4 rounded-lg border">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded-full bg-destructive/10 flex items-center justify-center">
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-destructive">{item.mistake}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{item.solution}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Best Practices Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="mt-8"
      >
        <Card className="bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-6 w-6 text-primary" />
              Golden Rules for Interview Success
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-4 bg-background rounded-lg shadow-sm">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Brain className="h-5 w-5 text-primary" />
                  Preparation
                </h4>
                <p className="text-sm text-muted-foreground">
                  Research the company, practice common questions, and prepare thoughtful questions of your own.
                </p>
              </div>
              <div className="p-4 bg-background rounded-lg shadow-sm">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  Communication
                </h4>
                <p className="text-sm text-muted-foreground">
                  Be clear, concise, and structured in your responses. Listen actively and engage genuinely.
                </p>
              </div>
              <div className="p-4 bg-background rounded-lg shadow-sm">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Professionalism
                </h4>
                <p className="text-sm text-muted-foreground">
                  Dress appropriately, arrive early, maintain positive body language, and follow up promptly.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* CTA Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="mt-8 text-center"
      >
        <Card className="bg-gradient-to-r from-primary/10 to-primary/5">
          <CardContent className="pt-6">
            <h3 className="text-2xl font-bold mb-4">Ready to Practice?</h3>
            <p className="text-muted-foreground mb-6">
              Put these tips into action with our AI-powered mock interviews
            </p>
            <Button
              size="lg"
              onClick={() => router.push("/dashboard/interview")}
              className="w-full sm:w-auto"
            >
              Start Interview Practice
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
