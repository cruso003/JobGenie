// components/linkedin/LinkedInAnalytics.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, Eye, UserCheck, ArrowUpRight } from 'lucide-react';

interface LinkedInAnalyticsProps {
  analytics: {
    viewsBefore: number;
    viewsAfter: number;
    profileStrengthBefore: number;
    profileStrengthAfter: number;
    keywordsAdded: string[];
  };
}

export function LinkedInAnalytics({ analytics }: LinkedInAnalyticsProps) {
  const data = [
    {
      name: 'Before',
      views: analytics.viewsBefore,
      strength: analytics.profileStrengthBefore,
    },
    {
      name: 'After',
      views: analytics.viewsAfter,
      strength: analytics.profileStrengthAfter,
    },
  ];

  const viewsImprovement = ((analytics.viewsAfter - analytics.viewsBefore) / analytics.viewsBefore) * 100;
  const strengthImprovement = analytics.profileStrengthAfter - analytics.profileStrengthBefore;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profile Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.viewsAfter}</div>
            <p className="text-xs text-green-600 flex items-center">
              <ArrowUpRight className="h-4 w-4 mr-1" />
              {viewsImprovement.toFixed(1)}% improvement
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profile Strength</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.profileStrengthAfter}%</div>
            <p className="text-xs text-green-600 flex items-center">
              <ArrowUpRight className="h-4 w-4 mr-1" />
              +{strengthImprovement} points
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Keywords Added</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.keywordsAdded.length}</div>
            <p className="text-xs text-muted-foreground">
              New keywords for better visibility
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="views" fill="#0077B5" name="Profile Views" />
                <Bar dataKey="strength" fill="#00A0DC" name="Profile Strength" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
