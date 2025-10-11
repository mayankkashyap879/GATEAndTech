import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Loader2, CheckCircle2, XCircle, Clock, Award, Target } from "lucide-react";
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
