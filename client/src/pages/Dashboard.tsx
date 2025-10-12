import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useViewAsRole } from "@/contexts/ViewAsRoleContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLocation } from "wouter";
import { BookOpen, TrendingUp, Calendar, Users, Eye, FileQuestion, BarChart3, MessageSquare, ShoppingCart, Package } from "lucide-react";

export default function Dashboard() {
  const { user, isLoading } = useAuth();
  const { viewAsRole, setViewAsRole, effectiveRole } = useViewAsRole();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !user) {
      setLocation("/login");
    }
  }, [user, isLoading, setLocation]);

  if (isLoading || !user) {
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
          <div className="flex-1">
            <h1 className="text-3xl font-bold" data-testid="text-dashboard-title">
              Welcome back, {user.name}!
            </h1>
            <p className="text-muted-foreground mt-1">
              Track your progress and prepare for GATE
            </p>
          </div>
          
          {/* Role Switcher (Admin and Moderator) */}
          {(user.role === "admin" || user.role === "moderator") && (
            <div className="flex items-center gap-2 mr-4">
              <Eye className="h-4 w-4 text-muted-foreground" />
              <Select value={viewAsRole} onValueChange={setViewAsRole}>
                <SelectTrigger className="w-[160px]" data-testid="select-view-as-role">
                  <SelectValue placeholder="View as..." />
                </SelectTrigger>
                <SelectContent>
                  {user.role === "admin" && (
                    <SelectItem value="admin" data-testid="option-view-as-admin">Admin</SelectItem>
                  )}
                  <SelectItem value="moderator" data-testid="option-view-as-moderator">Moderator</SelectItem>
                  <SelectItem value="student" data-testid="option-view-as-student">Student</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          
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

        {/* Quick Links */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Quick Links</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="hover-elevate cursor-pointer" onClick={() => setLocation("/tests")} data-testid="card-quick-link-tests">
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <div>
                  <CardTitle className="text-base">Mock Tests</CardTitle>
                  <CardDescription className="mt-1">Practice with full-length tests</CardDescription>
                </div>
                <BookOpen className="h-6 w-6 text-primary" />
              </CardHeader>
            </Card>
            
            {(effectiveRole === "admin" || effectiveRole === "moderator") && (
              <Card className="hover-elevate cursor-pointer" onClick={() => setLocation("/questions")} data-testid="card-quick-link-questions">
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <div>
                    <CardTitle className="text-base">Question Bank</CardTitle>
                    <CardDescription className="mt-1">Create and manage exam questions</CardDescription>
                  </div>
                  <FileQuestion className="h-6 w-6 text-primary" />
                </CardHeader>
              </Card>
            )}
            
            {effectiveRole === "student" && (
              <Card className="hover-elevate cursor-pointer" onClick={() => setLocation("/discussions")} data-testid="card-quick-link-discussions">
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <div>
                    <CardTitle className="text-base">Q&A Forum</CardTitle>
                    <CardDescription className="mt-1">Ask doubts and get answers</CardDescription>
                  </div>
                  <MessageSquare className="h-6 w-6 text-primary" />
                </CardHeader>
              </Card>
            )}
            
            <Card className="hover-elevate cursor-pointer" onClick={() => setLocation("/analytics")} data-testid="card-quick-link-analytics">
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <div>
                  <CardTitle className="text-base">Analytics</CardTitle>
                  <CardDescription className="mt-1">Track your performance</CardDescription>
                </div>
                <BarChart3 className="h-6 w-6 text-primary" />
              </CardHeader>
            </Card>
            
            {effectiveRole === "student" && (
              <>
                <Card className="hover-elevate cursor-pointer" onClick={() => setLocation("/shop")} data-testid="card-quick-link-shop">
                  <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                    <div>
                      <CardTitle className="text-base">Test Series Shop</CardTitle>
                      <CardDescription className="mt-1">Browse and purchase test series</CardDescription>
                    </div>
                    <ShoppingCart className="h-6 w-6 text-primary" />
                  </CardHeader>
                </Card>
                
                <Card className="hover-elevate cursor-pointer" onClick={() => setLocation("/my-purchases")} data-testid="card-quick-link-purchases">
                  <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                    <div>
                      <CardTitle className="text-base">My Purchases</CardTitle>
                      <CardDescription className="mt-1">View your subscriptions</CardDescription>
                    </div>
                    <Package className="h-6 w-6 text-primary" />
                  </CardHeader>
                </Card>
              </>
            )}
          </div>
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

        {/* Test Series Banner */}
        {effectiveRole === "student" && (
          <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle>Explore Test Series</CardTitle>
              <CardDescription>
                Access premium mock tests and boost your GATE preparation
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Comprehensive test series for all subjects</li>
                <li>• GATE-authentic exam interface</li>
                <li>• Detailed performance analytics</li>
              </ul>
              <Button onClick={() => setLocation("/shop")} data-testid="button-browse-shop">
                Browse Shop
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
