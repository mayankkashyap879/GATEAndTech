import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { BookOpen, TrendingUp, Calendar, Users } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  if (!user) {
    setLocation("/login");
    return null;
  }

  const stats = [
    {
      title: "Tests Taken",
      value: "0",
      icon: BookOpen,
      description: "Total tests completed",
    },
    {
      title: "Average Score",
      value: "N/A",
      icon: TrendingUp,
      description: "Your performance",
    },
    {
      title: "Upcoming Tests",
      value: "0",
      icon: Calendar,
      description: "Scheduled for you",
    },
    {
      title: "Rank",
      value: "N/A",
      icon: Users,
      description: "Among all users",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold" data-testid="text-dashboard-title">
              Welcome back, {user.name}!
            </h1>
            <p className="text-muted-foreground mt-1">
              Track your progress and prepare for GATE
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setLocation("/tests")} data-testid="button-browse-tests">
              Browse Tests
            </Button>
            <Button variant="outline" onClick={() => setLocation("/practice")}>
              Practice
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid={`text-stat-${index}`}>
                  {stat.value}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Activity */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Tests</CardTitle>
              <CardDescription>
                Your latest test attempts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                No tests taken yet. Start practicing now!
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Performance Analytics</CardTitle>
              <CardDescription>
                Topic-wise performance breakdown
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Take tests to see your analytics
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pro Banner */}
        {user.currentPlan === "free" && (
          <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle>Upgrade to Pro</CardTitle>
              <CardDescription>
                Unlock premium features and mock tests
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Access to all premium tests</li>
                <li>• Detailed performance analytics</li>
                <li>• Personalized study recommendations</li>
              </ul>
              <Button onClick={() => setLocation("/pricing")}>
                Upgrade Now
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
