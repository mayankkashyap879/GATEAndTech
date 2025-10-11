import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3, TrendingUp, Target, Clock, Award, Activity } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { format } from "date-fns";

interface PerformanceStats {
  totalTests: number;
  averageScore: number;
  averagePercentage: number;
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  unanswered: number;
  averageTimeTaken: number;
  accuracy: number;
}

interface TopicPerformance {
  topicId: string;
  topicName: string;
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  accuracy: number;
}

interface DifficultyPerformance {
  difficulty: string;
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  accuracy: number;
}

interface PerformanceTrend {
  attemptId: string;
  testTitle: string;
  score: number;
  maxScore: number;
  percentage: number;
  submittedAt: string;
}

const COLORS = {
  easy: "hsl(var(--chart-1))",
  medium: "hsl(var(--chart-2))",
  hard: "hsl(var(--chart-3))",
  correct: "hsl(var(--chart-4))",
  incorrect: "hsl(var(--chart-5))",
};

export default function Analytics() {
  const { data: stats, isLoading: statsLoading } = useQuery<PerformanceStats>({
    queryKey: ["/api/analytics/performance"],
  });

  const { data: topicPerformance, isLoading: topicLoading } = useQuery<TopicPerformance[]>({
    queryKey: ["/api/analytics/topics"],
  });

  const { data: difficultyPerformance, isLoading: difficultyLoading } = useQuery<DifficultyPerformance[]>({
    queryKey: ["/api/analytics/difficulty"],
  });

  const { data: trend, isLoading: trendLoading } = useQuery<PerformanceTrend[]>({
    queryKey: ["/api/analytics/trend"],
  });

  if (statsLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-48" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>No Data Available</CardTitle>
            <CardDescription>Take some tests to see your analytics</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const responseDistribution = [
    { name: "Correct", value: stats.correctAnswers, fill: COLORS.correct },
    { name: "Incorrect", value: stats.incorrectAnswers, fill: COLORS.incorrect },
    { name: "Unanswered", value: stats.unanswered, fill: "hsl(var(--muted))" },
  ];

  return (
    <div className="container mx-auto p-6 space-y-6" data-testid="page-analytics">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="text-analytics-title">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Track your performance and progress</p>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card data-testid="card-total-tests">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tests</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-tests">{stats.totalTests}</div>
            <p className="text-xs text-muted-foreground">{stats.totalQuestions} questions attempted</p>
          </CardContent>
        </Card>

        <Card data-testid="card-average-score">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-average-score">{stats.averageScore}</div>
            <p className="text-xs text-muted-foreground">{stats.averagePercentage}% average</p>
          </CardContent>
        </Card>

        <Card data-testid="card-accuracy">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Accuracy</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-accuracy">{stats.accuracy}%</div>
            <p className="text-xs text-muted-foreground">{stats.correctAnswers} correct answers</p>
          </CardContent>
        </Card>

        <Card data-testid="card-avg-time">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Time/Test</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-avg-time">
              {Math.floor(stats.averageTimeTaken / 60)}m
            </div>
            <p className="text-xs text-muted-foreground">{stats.averageTimeTaken}s total</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Performance Trend */}
        <Card data-testid="card-performance-trend">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Performance Trend
            </CardTitle>
            <CardDescription>Your score progression over time</CardDescription>
          </CardHeader>
          <CardContent>
            {trendLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : trend && trend.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="submittedAt" 
                    tickFormatter={(value) => format(new Date(value), 'MMM dd')}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(value) => format(new Date(value), 'PPP')}
                    formatter={(value: number) => [`${value}%`, 'Score']}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="percentage" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    name="Score %"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-64 items-center justify-center text-muted-foreground">
                No test history available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Response Distribution */}
        <Card data-testid="card-response-distribution">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Response Distribution
            </CardTitle>
            <CardDescription>Breakdown of your answers</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={responseDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {responseDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Topic-wise Performance */}
      <Card data-testid="card-topic-performance">
        <CardHeader>
          <CardTitle>Topic-wise Performance</CardTitle>
          <CardDescription>Your accuracy across different topics</CardDescription>
        </CardHeader>
        <CardContent>
          {topicLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : topicPerformance && topicPerformance.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topicPerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="topicName" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="accuracy" fill="hsl(var(--primary))" name="Accuracy %" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-64 items-center justify-center text-muted-foreground">
              No topic data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Difficulty-wise Performance */}
      <Card data-testid="card-difficulty-performance">
        <CardHeader>
          <CardTitle>Difficulty-wise Performance</CardTitle>
          <CardDescription>How you perform at different difficulty levels</CardDescription>
        </CardHeader>
        <CardContent>
          {difficultyLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : difficultyPerformance && difficultyPerformance.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={difficultyPerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="difficulty" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="correctAnswers" fill={COLORS.correct} name="Correct" />
                <Bar dataKey="incorrectAnswers" fill={COLORS.incorrect} name="Incorrect" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-64 items-center justify-center text-muted-foreground">
              No difficulty data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Weak Areas */}
      {topicPerformance && topicPerformance.length > 0 && (
        <Card data-testid="card-weak-areas">
          <CardHeader>
            <CardTitle>Areas for Improvement</CardTitle>
            <CardDescription>Topics where you need more practice</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topicPerformance
                .sort((a, b) => a.accuracy - b.accuracy)
                .slice(0, 5)
                .map((topic) => (
                  <div key={topic.topicId} className="flex items-center justify-between" data-testid={`weak-area-${topic.topicId}`}>
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">{topic.topicName}</p>
                      <p className="text-sm text-muted-foreground">
                        {topic.correctAnswers}/{topic.totalQuestions} correct
                      </p>
                    </div>
                    <div className="ml-auto font-medium">
                      <span className={topic.accuracy < 50 ? "text-destructive" : "text-muted-foreground"}>
                        {topic.accuracy}%
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
