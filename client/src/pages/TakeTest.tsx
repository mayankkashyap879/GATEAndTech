import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Calculator, User, FileText, BookOpen } from "lucide-react";
import type { Test, Question, TestAttempt } from "@shared/schema";

type ViewState = "instructions" | "test" | "summary";

export default function TakeTest() {
  const [, params] = useRoute("/tests/:id/take");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const testId = params?.id;

  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [viewState, setViewState] = useState<ViewState>("instructions");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [markedForReview, setMarkedForReview] = useState<Set<string>>(new Set());
  const [visitedQuestions, setVisitedQuestions] = useState<Set<string>>(new Set());
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [showCalculator, setShowCalculator] = useState(false);

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
      setViewState("test");
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
    if (viewState === "test" && timeLeft > 0) {
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
  }, [viewState, timeLeft]);

  // Mark current question as visited
  useEffect(() => {
    if (viewState === "test" && questions && questions[currentQuestionIndex]) {
      const questionId = questions[currentQuestionIndex].id;
      setVisitedQuestions(prev => new Set([...prev, questionId]));
    }
  }, [currentQuestionIndex, viewState, questions]);

  const saveResponseMutation = useMutation({
    mutationFn: async (data: { questionId: string; selectedAnswer: string; isMarkedForReview: boolean }) => {
      const response = await apiRequest("POST", `/api/attempts/${attemptId}/responses`, {
        ...data,
        timeTaken: 0,
      });
      return response.json();
    },
  });

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    
    if (attemptId) {
      saveResponseMutation.mutate({
        questionId,
        selectedAnswer: value || "",
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
      
      // Save updated mark status
      if (attemptId) {
        saveResponseMutation.mutate({
          questionId,
          selectedAnswer: answers[questionId] || "",
          isMarkedForReview: newSet.has(questionId),
        });
      }
      
      return newSet;
    });
  };

  const handleClearResponse = () => {
    const currentQuestion = questions?.[currentQuestionIndex];
    if (currentQuestion) {
      handleAnswerChange(currentQuestion.id, "");
    }
  };

  const handleSaveAndNext = () => {
    if (currentQuestionIndex < (questions?.length || 0) - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handleMarkAndNext = () => {
    const currentQuestion = questions?.[currentQuestionIndex];
    if (currentQuestion) {
      handleMarkForReview(currentQuestion.id);
    }
    handleSaveAndNext();
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

  const getQuestionStatus = (questionId: string) => {
    const hasAnswer = answers[questionId] && answers[questionId].trim() !== "";
    const isMarked = markedForReview.has(questionId);
    const isVisited = visitedQuestions.has(questionId);
    const isCurrent = questions?.findIndex(q => q.id === questionId) === currentQuestionIndex;
    
    if (hasAnswer && isMarked) return "answered-marked"; // Answered + Marked = Dark Purple
    if (hasAnswer) return "answered"; // Answered = Green
    if (isMarked && !hasAnswer) return "marked"; // Marked but no answer = Purple
    if (!hasAnswer && isVisited && !isCurrent) return "not-answered"; // Visited but no answer = Red
    if (isCurrent) return "current"; // Current question = Blue
    return "not-visited"; // Not visited = Gray
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "answered": return "bg-emerald-500 hover:bg-emerald-600 text-white";
      case "not-answered": return "bg-red-500 hover:bg-red-600 text-white";
      case "marked": return "bg-purple-500 hover:bg-purple-600 text-white";
      case "answered-marked": return "bg-purple-600 hover:bg-purple-700 text-white";
      case "current": return "bg-blue-500 hover:bg-blue-600 text-white";
      default: return "bg-slate-300 hover:bg-slate-400 text-slate-800";
    }
  };

  const getStats = () => {
    const answered = questions?.filter(q => answers[q.id] && answers[q.id].trim() !== "").length || 0;
    const answeredMarked = questions?.filter(q => 
      answers[q.id] && answers[q.id].trim() !== "" && markedForReview.has(q.id)
    ).length || 0;
    const markedOnly = questions?.filter(q => 
      markedForReview.has(q.id) && (!answers[q.id] || answers[q.id].trim() === "")
    ).length || 0;
    const notAnswered = questions?.filter(q => 
      visitedQuestions.has(q.id) && (!answers[q.id] || answers[q.id].trim() === "") && !markedForReview.has(q.id)
    ).length || 0;
    const notVisited = questions?.filter(q => 
      !visitedQuestions.has(q.id)
    ).length || 0;

    return { answered, notAnswered, marked: markedOnly, answeredMarked, notVisited };
  };

  if (isLoadingTest || isLoadingQuestions) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!test || !questions || questions.length === 0) {
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <p className="text-muted-foreground">Test not found</p>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const stats = getStats();

  // Instructions Page
  if (viewState === "instructions") {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-900">
        {/* Header */}
        <div className="bg-blue-600 text-white py-3 px-6">
          <h1 className="text-xl font-semibold" data-testid="text-test-title">{test.title}</h1>
        </div>

        <div className="container mx-auto py-8 px-4 max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Instructions */}
            <div className="lg:col-span-2">
              <Card className="p-6">
                <h2 className="text-2xl font-bold mb-4 text-blue-700 dark:text-blue-400">Instructions</h2>
                <div className="space-y-4 text-sm">
                  <div>
                    <h3 className="font-semibold mb-2">General Instructions:</h3>
                    <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                      <li>Total duration of examination is <strong>{test.duration} minutes</strong>.</li>
                      <li>The clock will be set at the server. The countdown timer in the top right corner will display the remaining time available for you to complete the examination.</li>
                      <li>The Question Palette displayed on the right side of screen will show the status of each question using symbols.</li>
                      <li>You have <strong>not visited</strong> the question yet (Gray).</li>
                      <li>You have <strong>not answered</strong> the question (Red).</li>
                      <li>You have <strong>answered</strong> the question (Green).</li>
                      <li>You have <strong>NOT answered</strong> the question, but have <strong>marked the question for review</strong> (Purple).</li>
                      <li>You have <strong>answered</strong> the question, but <strong>marked it for review</strong> (Purple).</li>
                    </ol>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-semibold mb-2">Navigating to a Question:</h3>
                    <ol className="list-decimal list-inside space-y-2 text-muted-foreground" start={9}>
                      <li>To answer a question, do the following:
                        <ul className="list-disc list-inside ml-4 mt-1">
                          <li>Click on the question number in the Question Palette to go to that question directly.</li>
                          <li>Select an answer for a multiple choice type question. Use the virtual numeric keypad to enter a number as answer for a numerical type question.</li>
                          <li>Click on <strong>Save & Next</strong> to save your answer for the current question and then go to the next question.</li>
                          <li>Click on <strong>Mark for Review & Next</strong> to save your answer for the current question, mark it for review, and then go to the next question.</li>
                        </ul>
                      </li>
                    </ol>
                  </div>

                  <Separator />

                  <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 p-4 rounded">
                    <p className="text-xs text-amber-900 dark:text-amber-100">
                      I have read and understood the instructions. All computer hardware allotted to me are in proper working condition. 
                      I declare that I am not in possession of / not wearing / not carrying any prohibited gadget like mobile phone, bluetooth devices etc.
                      I agree that in case of not adhering to the instructions, I shall be liable to be debarred from this Test and/or to disciplinary action, which may include ban from future Tests / Examinations.
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex justify-center">
                  <Button 
                    onClick={() => startTestMutation.mutate()}
                    disabled={startTestMutation.isPending}
                    size="lg"
                    className="bg-blue-600 hover:bg-blue-700"
                    data-testid="button-start-test"
                  >
                    {startTestMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Starting...
                      </>
                    ) : (
                      "I am ready to begin"
                    )}
                  </Button>
                </div>
              </Card>
            </div>

            {/* User Info */}
            <div className="space-y-4">
              <Card className="p-4 text-center">
                <div className="w-20 h-20 rounded-full bg-blue-100 dark:bg-blue-900 mx-auto mb-3 flex items-center justify-center">
                  <User className="h-10 w-10 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="font-semibold">Candidate</h3>
                <p className="text-sm text-muted-foreground">Test Taker</p>
              </Card>

              <Card className="p-4">
                <h3 className="font-semibold mb-3">Test Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Duration:</span>
                    <span className="font-medium">{test.duration} minutes</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Marks:</span>
                    <span className="font-medium">{test.totalMarks}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Questions:</span>
                    <span className="font-medium">{questions.length}</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Exam Summary Page
  if (viewState === "summary") {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-900">
        {/* Header */}
        <div className="bg-blue-600 text-white py-3 px-6 flex justify-between items-center">
          <h1 className="text-xl font-semibold">{test.title}</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm">Time Left: {formatTime(timeLeft)}</span>
          </div>
        </div>

        <div className="container mx-auto py-8 px-4 max-w-4xl">
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-6 text-center">Exam Summary</h2>
            
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Section Name</TableHead>
                  <TableHead className="text-center">No. of Questions</TableHead>
                  <TableHead className="text-center">Answered</TableHead>
                  <TableHead className="text-center">Not Answered</TableHead>
                  <TableHead className="text-center">Marked for Review</TableHead>
                  <TableHead className="text-center">Answered and Marked for Review</TableHead>
                  <TableHead className="text-center">Not Visited</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">All Questions</TableCell>
                  <TableCell className="text-center">{questions.length}</TableCell>
                  <TableCell className="text-center">{stats.answered}</TableCell>
                  <TableCell className="text-center">{stats.notAnswered}</TableCell>
                  <TableCell className="text-center">{stats.marked}</TableCell>
                  <TableCell className="text-center">{stats.answeredMarked}</TableCell>
                  <TableCell className="text-center">{stats.notVisited}</TableCell>
                </TableRow>
                <TableRow className="bg-muted/50">
                  <TableCell className="font-bold">Total</TableCell>
                  <TableCell className="text-center font-bold">{questions.length}</TableCell>
                  <TableCell className="text-center font-bold">{stats.answered}</TableCell>
                  <TableCell className="text-center font-bold">{stats.notAnswered}</TableCell>
                  <TableCell className="text-center font-bold">{stats.marked}</TableCell>
                  <TableCell className="text-center font-bold">{stats.answeredMarked}</TableCell>
                  <TableCell className="text-center font-bold">{stats.notVisited}</TableCell>
                </TableRow>
              </TableBody>
            </Table>

            <div className="mt-8 text-center">
              <p className="mb-4 text-muted-foreground">Are you sure you want to submit the Exam?</p>
              <div className="flex gap-4 justify-center">
                <Button 
                  variant="outline" 
                  onClick={() => setViewState("test")}
                  data-testid="button-back-to-test"
                >
                  No, Go Back
                </Button>
                <Button 
                  onClick={handleSubmit}
                  disabled={submitTestMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700"
                  data-testid="button-confirm-submit"
                >
                  {submitTestMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Yes, Submit"
                  )}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Test Taking Interface
  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900">
      {/* Header */}
      <div className="bg-blue-600 text-white">
        <div className="py-3 px-6 flex justify-between items-center">
          <h1 className="text-xl font-semibold">{test.title}</h1>
          <div className="flex items-center gap-6">
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-blue-700"
              onClick={() => setShowCalculator(true)}
              data-testid="button-calculator"
            >
              <Calculator className="h-4 w-4 mr-2" />
              Calculator
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-blue-700"
              data-testid="button-instructions"
            >
              <BookOpen className="h-4 w-4 mr-2" />
              Instructions
            </Button>
            <div className="text-sm font-medium" data-testid="text-timer">
              Time Left: {formatTime(timeLeft)}
            </div>
          </div>
        </div>
        
        <div className="bg-blue-700 px-6 py-2 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="bg-blue-800 text-white hover:bg-blue-800">
              Section
            </Badge>
            <span className="text-sm">All Questions</span>
          </div>
          <div className="text-sm">
            Question Type: <strong>{currentQuestion.type === "mcq_single" ? "MCQ" : currentQuestion.type === "mcq_multiple" ? "MSQ" : "Numerical"}</strong>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Main Question Area */}
        <div className="flex-1 p-6">
          <Card className="mb-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-950 border-b">
              <div className="flex justify-between items-center">
                <span className="font-medium">Question No. {currentQuestionIndex + 1}</span>
                <span className="text-sm text-muted-foreground">
                  Marks for correct answer: <span className="text-emerald-600 font-semibold">{currentQuestion.marks}</span> | 
                  Negative Marks: <span className="text-red-600 font-semibold">{currentQuestion.negativeMarks}</span>
                </span>
              </div>
            </div>

            <div className="p-6">
              <div className="prose dark:prose-invert max-w-none mb-6">
                <p className="text-base">{currentQuestion.content}</p>
                {currentQuestion.imageUrl && (
                  <img src={currentQuestion.imageUrl} alt="Question" className="mt-4 rounded-lg max-w-md" />
                )}
              </div>

              {/* Answer Options */}
              <div className="space-y-4">
                {currentQuestion.type === "mcq_single" && (
                  <RadioGroup
                    value={answers[currentQuestion.id] || ""}
                    onValueChange={(value) => handleAnswerChange(currentQuestion.id, value)}
                  >
                    {(currentQuestion.options as any)?.map((option: any) => (
                      <div key={option.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted">
                        <RadioGroupItem value={option.id} id={option.id} data-testid={`radio-option-${option.id}`} />
                        <Label htmlFor={option.id} className="flex-1 cursor-pointer">{option.text}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                )}

                {currentQuestion.type === "mcq_multiple" && (
                  <div className="space-y-3">
                    {(currentQuestion.options as any)?.map((option: any) => {
                      const selectedOptions = answers[currentQuestion.id]?.split(",") || [];
                      const isChecked = selectedOptions.includes(option.id);
                      
                      return (
                        <div key={option.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted">
                          <Checkbox
                            id={option.id}
                            checked={isChecked}
                            onCheckedChange={(checked) => {
                              const current = answers[currentQuestion.id]?.split(",").filter(Boolean) || [];
                              const updated = checked
                                ? [...current, option.id]
                                : current.filter((id) => id !== option.id);
                              handleAnswerChange(currentQuestion.id, updated.join(","));
                            }}
                            data-testid={`checkbox-option-${option.id}`}
                          />
                          <Label htmlFor={option.id} className="flex-1 cursor-pointer">{option.text}</Label>
                        </div>
                      );
                    })}
                  </div>
                )}

                {currentQuestion.type === "numerical" && (
                  <div>
                    <Label htmlFor="numerical-answer">Enter your answer:</Label>
                    <Input
                      id="numerical-answer"
                      type="text"
                      value={answers[currentQuestion.id] || ""}
                      onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                      className="mt-2 max-w-xs"
                      placeholder="Type your answer"
                      data-testid="input-numerical-answer"
                    />
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-between">
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleMarkAndNext}
                data-testid="button-mark-review"
              >
                Mark for Review & Next
              </Button>
              <Button
                variant="outline"
                onClick={handleClearResponse}
                data-testid="button-clear"
              >
                Clear Response
              </Button>
            </div>
            
            <div className="flex gap-3">
              <Button
                onClick={handleSaveAndNext}
                className="bg-blue-600 hover:bg-blue-700"
                disabled={currentQuestionIndex >= questions.length - 1}
                data-testid="button-save-next"
              >
                Save & Next
              </Button>
              <Button
                onClick={() => setViewState("summary")}
                variant="outline"
                className="border-emerald-600 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950"
                data-testid="button-submit"
              >
                Submit
              </Button>
            </div>
          </div>
        </div>

        {/* Question Palette Sidebar */}
        <div className="w-80 bg-white dark:bg-slate-800 border-l p-4 space-y-4">
          {/* User Info */}
          <Card className="p-3 text-center">
            <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900 mx-auto mb-2 flex items-center justify-center">
              <User className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <p className="font-medium text-sm">Test Taker</p>
          </Card>

          {/* Section Info */}
          <div className="bg-amber-50 dark:bg-amber-950 p-3 rounded">
            <p className="text-xs font-medium text-center">You are viewing: <span className="text-amber-700 dark:text-amber-400">All Questions</span></p>
          </div>

          {/* Question Palette */}
          <div>
            <h3 className="font-semibold mb-3 text-sm">Question Palette</h3>
            <div className="grid grid-cols-4 gap-2">
              {questions.map((q, index) => {
                const status = getQuestionStatus(q.id);
                return (
                  <Button
                    key={q.id}
                    onClick={() => setCurrentQuestionIndex(index)}
                    className={`h-10 ${getStatusColor(status)}`}
                    size="sm"
                    data-testid={`button-question-${index + 1}`}
                  >
                    {index + 1}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="space-y-2">
            <h3 className="font-semibold text-sm">Legend</h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-emerald-500"></div>
                <span>Answered</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-red-500"></div>
                <span>Not Answered</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-purple-500"></div>
                <span>Marked for Review</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-purple-600"></div>
                <span>Answered & Marked for Review</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-slate-300"></div>
                <span>Not Visited</span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <Card className="p-3">
            <h3 className="font-semibold text-sm mb-2">Statistics</h3>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Answered:</span>
                <Badge variant="secondary" className="bg-emerald-500 text-white">{stats.answered}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Not Answered:</span>
                <Badge variant="secondary" className="bg-red-500 text-white">{stats.notAnswered}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Marked for Review:</span>
                <Badge variant="secondary" className="bg-purple-500 text-white">{stats.marked}</Badge>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Calculator Dialog */}
      <Dialog open={showCalculator} onOpenChange={setShowCalculator}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Scientific Calculator</DialogTitle>
            <DialogDescription>
              Use this calculator for numerical calculations
            </DialogDescription>
          </DialogHeader>
          <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded text-center">
            <p className="text-sm text-muted-foreground">Calculator functionality coming soon...</p>
            <p className="text-xs text-muted-foreground mt-2">For now, use your system calculator</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
