import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Loader2, CheckCircle2, XCircle, Clock, Award, Target, TrendingUp, AlertCircle } from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from "recharts";
import type { Test, TestAttempt, TestResponse, Question } from "@shared/schema";

export default function TestResults() {
  const [, params] = useRoute("/attempts/:id/results");
  const [, navigate] = useLocation();
  const attemptId = params?.id;

  const { data: attempt, isLoading: isLoadingAttempt } = useQuery<TestAttempt>({
    queryKey: ["/api/attempts", attemptId],
  });

  const { data: responses } = useQuery<TestResponse[]>({
    queryKey: ["/api/attempts", attemptId, "responses"],
    queryFn: async () => {
      const response = await fetch(`/api/attempts/${attemptId}/responses`);
      if (!response.ok) throw new Error("Failed to fetch responses");
      return response.json();
    },
    enabled: !!attemptId,
  });

  const { data: test } = useQuery<Test>({
    queryKey: ["/api/tests", attempt?.testId],
    enabled: !!attempt?.testId,
  });

  const { data: questions } = useQuery<Question[]>({
    queryKey: ["/api/tests", attempt?.testId, "questions"],
    enabled: !!attempt?.testId,
  });

  const { data: detailedAnalytics } = useQuery({
    queryKey: ["/api/analytics/attempts", attemptId, "detailed"],
    queryFn: async () => {
      const response = await fetch(`/api/analytics/attempts/${attemptId}/detailed`);
      if (!response.ok) throw new Error("Failed to fetch detailed analytics");
      return response.json();
    },
    enabled: !!attemptId,
  });

  const { data: weakAreas } = useQuery({
    queryKey: ["/api/analytics/weak-areas"],
    enabled: !!attempt,
  });

  if (isLoadingAttempt) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!attempt) {
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <p className="text-muted-foreground">Test attempt not found</p>
      </div>
    );
  }

  const scorePercentage = attempt.maxScore ? (attempt.score! / attempt.maxScore) * 100 : 0;
  const correctCount = responses?.filter(r => r.isCorrect).length || 0;
  const incorrectCount = responses?.filter(r => !r.isCorrect && r.selectedAnswer).length || 0;
  const unattemptedCount = responses?.filter(r => !r.selectedAnswer).length || 0;

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2" data-testid="text-page-title">Test Results</h1>
        <p className="text-muted-foreground">{test?.title}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Your Score</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-score">
              {attempt.score} / {attempt.maxScore}
            </div>
            <p className="text-xs text-muted-foreground">
              {scorePercentage.toFixed(1)}%
            </p>
            <Progress value={scorePercentage} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Time Taken</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-time-taken">
              {Math.floor((attempt.timeTaken || 0) / 60)} min
            </div>
            <p className="text-xs text-muted-foreground">
              {attempt.timeTaken || 0} seconds total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Accuracy</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-accuracy">
              {responses?.length ? ((correctCount / responses.length) * 100).toFixed(1) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              {correctCount} correct out of {responses?.length || 0}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Question Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <span data-testid="text-correct-count">Correct: {correctCount}</span>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-destructive" />
              <span data-testid="text-incorrect-count">Incorrect: {incorrectCount}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-5 w-5 rounded-full border-2 border-muted-foreground" />
              <span data-testid="text-unattempted-count">Unattempted: {unattemptedCount}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Percentile Card */}
      {attempt.percentile !== null && attempt.percentile !== undefined && (
        <Card className="mb-8 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:from-purple-950">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Percentile Rank
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">
              {attempt.percentile}th
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              You scored better than {attempt.percentile}% of test takers
            </p>
          </CardContent>
        </Card>
      )}

      {/* Analytics Charts */}
      {detailedAnalytics && (
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          {/* Performance Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Distribution</CardTitle>
              <CardDescription>Breakdown of your answers</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      { name: "Correct", value: detailedAnalytics.stats.correct, fill: "#22c55e" },
                      { name: "Incorrect", value: detailedAnalytics.stats.incorrect, fill: "#ef4444" },
                      { name: "Unattempted", value: detailedAnalytics.stats.unattempted, fill: "#94a3b8" },
                    ]}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {[
                      <Cell key="correct" fill="#22c55e" />,
                      <Cell key="incorrect" fill="#ef4444" />,
                      <Cell key="unattempted" fill="#94a3b8" />,
                    ]}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Topic-wise Performance */}
          {detailedAnalytics.topicBreakdown && detailedAnalytics.topicBreakdown.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Topic-wise Accuracy</CardTitle>
                <CardDescription>Performance across different topics</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={detailedAnalytics.topicBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="topic" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="correct" fill="#22c55e" name="Correct" />
                    <Bar dataKey="incorrect" fill="#ef4444" name="Incorrect" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Weak Areas Recommendations */}
      {weakAreas && weakAreas.recommendations && weakAreas.recommendations.length > 0 && (
        <Card className="mb-8 border-orange-200 dark:border-orange-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
              <AlertCircle className="h-5 w-5" />
              Areas for Improvement
            </CardTitle>
            <CardDescription>Topics that need more practice</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {weakAreas.recommendations.map((rec: any, idx: number) => (
                <div key={idx} className="p-4 bg-orange-50 dark:bg-orange-950 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold">{rec.topic}</h4>
                    <Badge variant="outline" className="text-orange-600">
                      {rec.accuracy}% accuracy
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{rec.reason}</p>
                  <p className="text-sm font-medium text-orange-600 dark:text-orange-400">
                    💡 {rec.suggestion}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Link to Review Mode */}
      {test?.showSolutionsAfterSubmit !== false && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Review Your Answers</CardTitle>
            <CardDescription>See detailed solutions with color-coded answers</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate(`/attempts/${attemptId}/review`)} className="w-full">
              Open Review Mode
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Detailed Solutions</CardTitle>
          <CardDescription>Review your answers and explanations</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {questions?.map((question, index) => {
            const response = responses?.find(r => r.questionId === question.id);
            const isCorrect = response?.isCorrect || false;

            return (
              <div key={question.id} className="space-y-3" data-testid={`solution-${question.id}`}>
                <div className="flex items-start gap-3">
                  <Badge variant={isCorrect ? "default" : response?.selectedAnswer ? "destructive" : "outline"}>
                    Q{index + 1}
                  </Badge>
                  <div className="flex-1">
                    <p className="font-medium mb-2">{question.content}</p>
                    
                    {question.type === "numerical" ? (
                      <div className="space-y-2">
                        <div>
                          <span className="text-sm text-muted-foreground">Your answer: </span>
                          <span className={isCorrect ? "text-green-600 font-medium" : "text-destructive font-medium"}>
                            {response?.selectedAnswer || "Not attempted"}
                          </span>
                        </div>
                        <div>
                          <span className="text-sm text-muted-foreground">Correct answer: </span>
                          <span className="text-green-600 font-medium">{question.correctAnswer}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {(question.options as any)?.map((option: any) => {
                          const isSelected = response?.selectedAnswer === option.id;
                          const isCorrectOption = option.isCorrect;

                          return (
                            <div
                              key={option.id}
                              className={`p-3 rounded-md border ${
                                isCorrectOption
                                  ? "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800"
                                  : isSelected
                                  ? "bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800"
                                  : "bg-card"
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{option.id}.</span>
                                <span>{option.text}</span>
                                {isCorrectOption && (
                                  <CheckCircle2 className="h-4 w-4 text-green-600 ml-auto" />
                                )}
                                {isSelected && !isCorrectOption && (
                                  <XCircle className="h-4 w-4 text-destructive ml-auto" />
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {question.explanation && (
                      <div className="mt-3 p-3 bg-muted rounded-md">
                        <p className="text-sm font-medium mb-1">Explanation:</p>
                        <p className="text-sm text-muted-foreground">{question.explanation}</p>
                      </div>
                    )}

                    <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                      <span>Marks: {question.marks}</span>
                      {response?.marksAwarded !== undefined && (
                        <span>Awarded: {response.marksAwarded}</span>
                      )}
                      {response?.timeTaken && (
                        <span>Time: {response.timeTaken}s</span>
                      )}
                    </div>
                  </div>
                </div>
                {index < questions.length - 1 && <Separator />}
              </div>
            );
          })}
        </CardContent>
      </Card>

      <div className="mt-8 flex gap-4">
        <Button onClick={() => navigate("/tests")} data-testid="button-back-to-tests">
          Back to Tests
        </Button>
        <Button onClick={() => navigate("/dashboard")} variant="outline" data-testid="button-dashboard">
          Go to Dashboard
        </Button>
      </div>
    </div>
  );
}
