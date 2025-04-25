// components/linkedin/LinkedInProfileForm.tsx
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Linkedin } from 'lucide-react';

interface LinkedInProfileFormProps {
  onSubmit: (profile: any) => void;
}

export function LinkedInProfileForm({ onSubmit }: LinkedInProfileFormProps) {
  const [profile, setProfile] = useState({
    headline: '',
    summary: '',
    experience: [{ title: '', company: '', description: '', duration: '' }],
    skills: '',
    education: [{ school: '', degree: '', field: '' }],
  });

  const handleExperienceChange = (index: number, field: string, value: string) => {
    const newExperience = [...profile.experience];
    newExperience[index] = { ...newExperience[index], [field]: value };
    setProfile({ ...profile, experience: newExperience });
  };

  const handleEducationChange = (index: number, field: string, value: string) => {
    const newEducation = [...profile.education];
    newEducation[index] = { ...newEducation[index], [field]: value };
    setProfile({ ...profile, education: newEducation });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...profile,
      skills: profile.skills.split(',').map(skill => skill.trim()),
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Linkedin className="h-5 w-5" />
          LinkedIn Profile Information
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="headline">Headline</Label>
            <Input
              id="headline"
              value={profile.headline}
              onChange={(e) => setProfile({ ...profile, headline: e.target.value })}
              placeholder="Your current LinkedIn headline"
              maxLength={220}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="summary">About/Summary</Label>
            <Textarea
              id="summary"
              value={profile.summary}
              onChange={(e) => setProfile({ ...profile, summary: e.target.value })}
              placeholder="Your LinkedIn summary/about section"
              rows={6}
            />
          </div>

          <div className="space-y-4">
            <Label>Experience</Label>
            {profile.experience.map((exp, index) => (
              <div key={index} className="border p-4 rounded-lg space-y-2">
                <Input
                  placeholder="Job Title"
                  value={exp.title}
                  onChange={(e) => handleExperienceChange(index, 'title', e.target.value)}
                />
                <Input
                  placeholder="Company"
                  value={exp.company}
                  onChange={(e) => handleExperienceChange(index, 'company', e.target.value)}
                />
                <Textarea
                  placeholder="Job Description"
                  value={exp.description}
                  onChange={(e) => handleExperienceChange(index, 'description', e.target.value)}
                />
                <Input
                  placeholder="Duration (e.g., Jan 2020 - Present)"
                  value={exp.duration}
                  onChange={(e) => handleExperienceChange(index, 'duration', e.target.value)}
                />
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={() => setProfile({
                ...profile,
                experience: [...profile.experience, { title: '', company: '', description: '', duration: '' }]
              })}
            >
              Add Experience
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="skills">Skills (comma-separated)</Label>
            <Input
              id="skills"
              value={profile.skills}
              onChange={(e) => setProfile({ ...profile, skills: e.target.value })}
              placeholder="e.g., JavaScript, React, Node.js, Team Leadership"
            />
          </div>

          <Button type="submit" className="w-full">
            Analyze Profile
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
