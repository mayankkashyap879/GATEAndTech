import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, Clock, ChevronLeft, ChevronRight, Flag, CheckCircle2 } from "lucide-react";
import type { Test, Question, TestAttempt } from "@shared/schema";

export default function TakeTest() {
  const [, params] = useRoute("/tests/:id");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const testId = params?.id;

  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [markedForReview, setMarkedForReview] = useState<Set<string>>(new Set());
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [testStarted, setTestStarted] = useState(false);

  const { data: test, isLoading: isLoadingTest } = useQuery<Test>({
    queryKey: ["/api/tests", testId],
  });

  const { data: questions, isLoading: isLoadingQuestions } = useQuery<Question[]>({
    queryKey: ["/api/tests", testId, "questions"],
    enabled: !!testId,
  });

  const startTestMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/attempts", { testId });
      return response.json();
    },
    onSuccess: (attempt: TestAttempt) => {
      setAttemptId(attempt.id);
      setTimeLeft((test?.duration || 0) * 60);
      setTestStarted(true);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to start test",
        variant: "destructive",
      });
    },
  });

  const submitTestMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("PATCH", `/api/attempts/${attemptId}/submit`, {
        timeTaken: ((test?.duration || 0) * 60) - timeLeft,
      });
      return response.json();
    },
    onSuccess: (attempt: TestAttempt) => {
      queryClient.invalidateQueries({ queryKey: ["/api/attempts"] });
      navigate(`/attempts/${attempt.id}/results`);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit test",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (testStarted && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [testStarted, timeLeft]);

  const saveResponseMutation = useMutation({
    mutationFn: async (data: { questionId: string; selectedAnswer: string; isMarkedForReview: boolean }) => {
      const response = await apiRequest("POST", `/api/attempts/${attemptId}/responses`, {
        ...data,
        timeTaken: 0, // Will be calculated on submit
      });
      return response.json();
    },
  });

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    
    // Save response to backend (including when clearing answer)
    if (attemptId) {
      saveResponseMutation.mutate({
        questionId,
        selectedAnswer: value || "", // Empty string if cleared
        isMarkedForReview: markedForReview.has(questionId),
      });
    }
  };

  const handleMarkForReview = (questionId: string) => {
    setMarkedForReview((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  const handleSubmit = () => {
    submitTestMutation.mutate();
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (isLoadingTest || isLoadingQuestions) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!test || !questions) {
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <p className="text-muted-foreground">Test not found</p>
      </div>
    );
  }

  if (!testStarted) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl" data-testid="text-test-title">{test.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {test.description && (
              <p className="text-muted-foreground">{test.description}</p>
            )}
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span data-testid="text-duration">Duration: {test.duration} minutes</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                <span data-testid="text-total-questions">Questions: {questions.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <span data-testid="text-total-marks">Total Marks: {test.totalMarks}</span>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <h3 className="font-semibold">Instructions:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>The timer will start when you click "Start Test"</li>
                <li>You can navigate between questions using the navigation buttons</li>
                <li>Mark questions for review if you want to revisit them</li>
                <li>The test will auto-submit when time runs out</li>
                <li>Click "Submit Test" to finish before time expires</li>
              </ul>
            </div>

            <Button
              onClick={() => startTestMutation.mutate()}
              disabled={startTestMutation.isPending}
              className="w-full"
              data-testid="button-start-test"
            >
              {startTestMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Start Test
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const answeredCount = Object.keys(answers).length;
  const progress = (answeredCount / questions.length) * 100;

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="border-b bg-background sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-semibold" data-testid="text-test-title-header">{test.title}</h1>
              <p className="text-sm text-muted-foreground">
                Question {currentQuestionIndex + 1} of {questions.length}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="text-lg px-4 py-2">
                <Clock className="mr-2 h-4 w-4" />
                <span data-testid="text-timer">{formatTime(timeLeft)}</span>
              </Badge>
              <Button
                onClick={() => setShowSubmitDialog(true)}
                variant="default"
                data-testid="button-submit-test"
              >
                Submit Test
              </Button>
            </div>
          </div>
          <Progress value={progress} className="mt-3" />
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">
                    Question {currentQuestionIndex + 1}
                  </CardTitle>
                  <Badge>{currentQuestion.marks} marks</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-lg" data-testid={`text-question-${currentQuestion.id}`}>
                  {currentQuestion.content}
                </p>

                {currentQuestion.imageUrl && (
                  <img
                    src={currentQuestion.imageUrl}
                    alt="Question"
                    className="max-w-full rounded-md"
                  />
                )}

                {currentQuestion.type === "numerical" ? (
                  <div className="space-y-2">
                    <Label htmlFor="numerical-answer">Your Answer</Label>
                    <Input
                      id="numerical-answer"
                      type="number"
                      step="any"
                      value={answers[currentQuestion.id] || ""}
                      onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                      placeholder="Enter numerical answer"
                      data-testid={`input-answer-${currentQuestion.id}`}
                    />
                  </div>
                ) : currentQuestion.type === "mcq_single" ? (
                  <RadioGroup
                    value={answers[currentQuestion.id] || ""}
                    onValueChange={(value) => handleAnswerChange(currentQuestion.id, value)}
                  >
                    {(currentQuestion.options as any)?.map((option: any) => (
                      <div key={option.id} className="flex items-center space-x-2 p-3 rounded-md hover-elevate">
                        <RadioGroupItem value={option.id} id={option.id} data-testid={`radio-${option.id}`} />
                        <Label htmlFor={option.id} className="flex-1 cursor-pointer">
                          <span className="font-medium">{option.id}.</span> {option.text}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                ) : (
                  <div className="space-y-2">
                    {(currentQuestion.options as any)?.map((option: any) => {
                      const selectedOptions = answers[currentQuestion.id]?.split(",") || [];
                      const isChecked = selectedOptions.includes(option.id);

                      return (
                        <div key={option.id} className="flex items-center space-x-2 p-3 rounded-md hover-elevate">
                          <Checkbox
                            id={option.id}
                            checked={isChecked}
                            onCheckedChange={(checked) => {
                              const current = selectedOptions.filter(Boolean);
                              const newValue = checked
                                ? [...current, option.id].join(",")
                                : current.filter((id) => id !== option.id).join(",");
                              handleAnswerChange(currentQuestion.id, newValue);
                            }}
                            data-testid={`checkbox-${option.id}`}
                          />
                          <Label htmlFor={option.id} className="flex-1 cursor-pointer">
                            <span className="font-medium">{option.id}.</span> {option.text}
                          </Label>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="flex items-center gap-4 pt-4">
                  <Button
                    variant={markedForReview.has(currentQuestion.id) ? "default" : "outline"}
                    onClick={() => handleMarkForReview(currentQuestion.id)}
                    data-testid="button-mark-for-review"
                  >
                    <Flag className="mr-2 h-4 w-4" />
                    {markedForReview.has(currentQuestion.id) ? "Marked for Review" : "Mark for Review"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center justify-between mt-6">
              <Button
                variant="outline"
                onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                disabled={currentQuestionIndex === 0}
                data-testid="button-previous"
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>
              <Button
                onClick={() =>
                  setCurrentQuestionIndex((prev) => Math.min(questions.length - 1, prev + 1))
                }
                disabled={currentQuestionIndex === questions.length - 1}
                data-testid="button-next"
              >
                Next
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="text-lg">Question Navigator</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 gap-2">
                  {questions.map((q, index) => {
                    const isAnswered = !!answers[q.id];
                    const isMarked = markedForReview.has(q.id);
                    const isCurrent = index === currentQuestionIndex;

                    return (
                      <Button
                        key={q.id}
                        variant={isCurrent ? "default" : isAnswered ? "secondary" : "outline"}
                        className={`h-10 ${isMarked ? "border-2 border-orange-500" : ""}`}
                        onClick={() => setCurrentQuestionIndex(index)}
                        data-testid={`nav-question-${index + 1}`}
                      >
                        {index + 1}
                      </Button>
                    );
                  })}
                </div>

                <div className="mt-6 space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 bg-primary rounded" />
                    <span>Current</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 bg-secondary rounded" />
                    <span>Answered ({answeredCount})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-orange-500 rounded" />
                    <span>Marked ({markedForReview.size})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 border rounded" />
                    <span>Not Answered ({questions.length - answeredCount})</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit Test?</AlertDialogTitle>
            <AlertDialogDescription>
              You have answered {answeredCount} out of {questions.length} questions.
              {markedForReview.size > 0 && ` ${markedForReview.size} questions are marked for review.`}
              <br /><br />
              Are you sure you want to submit? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-submit">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSubmit}
              disabled={submitTestMutation.isPending}
              data-testid="button-confirm-submit"
            >
              {submitTestMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Test
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
