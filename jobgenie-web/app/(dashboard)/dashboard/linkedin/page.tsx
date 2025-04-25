// app/dashboard/linkedin/page.tsx
"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LinkedInProfileForm } from '@/components/linkedin/LinkedInProfileForm';
import { LinkedInOptimizationService } from '@/lib/services/linkedinOptimization';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {  Copy, Linkedin } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAuthStore } from '@/lib/stores/auth';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

export default function LinkedInOptimizationPage() {
  const [optimization, setOptimization] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [currentTab, setCurrentTab] = useState('input');
  const [targetRole, setTargetRole] = useState('');
  const [industry, setIndustry] = useState('');
  const { toast } = useToast();
  const {user } = useAuthStore();
  const userId = user?.id || '';

  const optimizationService = new LinkedInOptimizationService();

  const handleAnalyzeProfile = async (profile: any) => {
    if (!targetRole || !industry) {
      toast({
        title: "Missing Information",
        description: "Please specify your target role and industry",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const result = await optimizationService.analyzeProfile(profile, targetRole, industry);
      setOptimization(result);
      
      // Save the optimization
      await optimizationService.saveOptimization(userId, result, profile);
      
      setCurrentTab('results');
      toast({
        title: "Analysis Complete",
        description: "Your LinkedIn profile has been analyzed",
      });
    } catch (error) {
      console.error('Error optimizing profile:', error);
      toast({
        title: "Error",
        description: "Failed to analyze your profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-6xl py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">LinkedIn Profile Optimization</h1>
        <p className="text-muted-foreground">
          Get your LinkedIn profile optimized for your target role
        </p>
      </div>

      <Tabs value={currentTab} onValueChange={setCurrentTab}>
        <TabsList>
          <TabsTrigger value="input">Profile Input</TabsTrigger>
          <TabsTrigger value="results" disabled={!optimization}>Optimization Results</TabsTrigger>
        </TabsList>

        <TabsContent value="input" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="targetRole">Target Role</Label>
              <Input
                id="targetRole"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="e.g., Senior Software Engineer"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="industry">Industry</Label>
              <Input
                id="industry"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="e.g., Technology, Finance"
              />
            </div>
          </div>

          <LinkedInProfileForm onSubmit={handleAnalyzeProfile} />
        </TabsContent>

        <TabsContent value="results" className="space-y-6">
          {optimization && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Profile Score</span>
                    <Badge variant={optimization.overallScore >= 80 ? "default" : "secondary"}>
                      {optimization.overallScore}/100
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Progress value={optimization.overallScore} className="h-4" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    {optimization.overallScore >= 80 
                      ? "Your profile is well-optimized for your target role!"
                      : "There's room for improvement in your profile."}
                  </p>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Optimized Headline</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-muted p-4 rounded-lg">
                      <p className="font-medium">{optimization.optimizedHeadline}</p>
                    </div>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => {
                        navigator.clipboard.writeText(optimization.optimizedHeadline);
                        toast({ title: "Copied to clipboard" });
                      }}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Headline
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Keywords to Add</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {optimization.keywordsToAdd.map((keyword: string, index: number) => (
                        <Badge key={index} variant="secondary">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Optimized Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="whitespace-pre-wrap">{optimization.optimizedSummary}</p>
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => {
                      navigator.clipboard.writeText(optimization.optimizedSummary);
                      toast({ title: "Copied to clipboard" });
                    }}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Summary
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Section Feedback</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {Object.entries(optimization.sectionFeedback as Record<string, string | string[]>).map(([section, feedback]) => (
                      <div key={section} className="space-y-2">
                        <h3 className="font-medium capitalize">{section}</h3>
                        {Array.isArray(feedback) ? (
                          <ul className="list-disc pl-6 space-y-1">
                            {feedback.map((item, index) => (
                              <li key={index} className="text-sm text-muted-foreground">{item}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-muted-foreground">{feedback}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-center">
                <Button
                  className="bg-[#0077B5] hover:bg-[#006399] text-white"
                  onClick={() => window.open('https://www.linkedin.com/in/', '_blank')}
                >
                  <Linkedin className="h-4 w-4 mr-2" />
                  Update My LinkedIn Profile
                </Button>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
