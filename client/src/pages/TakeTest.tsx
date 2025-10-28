import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, Calculator, BookOpen } from "lucide-react";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import type { Test, Question, TestAttempt } from "@shared/schema";
import QuestionPalette from "@/components/test/QuestionPalette";
import TestInstructions from "@/components/test/TestInstructions";
import TestSummary from "@/components/test/TestSummary";
import CalculatorDialog from "@/components/test/CalculatorDialog";

type ViewState = "instructions" | "test" | "summary";

export default function TakeTest() {
  const [, params] = useRoute("/tests/:id");
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
  
  // Refs for debouncing - avoids cleanup effect dependency issues
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pendingSaveRef = useRef<{ questionId: string; answer: string; isMarked: boolean } | null>(null);
  const attemptIdRef = useRef<string | null>(null);
  const answersRef = useRef<Record<string, string>>({});
  const markedForReviewRef = useRef<Set<string>>(new Set());
  const currentQuestionIndexRef = useRef<number>(0);

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

  // Sync refs with state to avoid stale closures
  useEffect(() => {
    attemptIdRef.current = attemptId;
  }, [attemptId]);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  useEffect(() => {
    markedForReviewRef.current = markedForReview;
  }, [markedForReview]);

  useEffect(() => {
    currentQuestionIndexRef.current = currentQuestionIndex;
  }, [currentQuestionIndex]);

  // Mark current question as visited
  useEffect(() => {
    if (viewState === "test" && questions && questions[currentQuestionIndex]) {
      const questionId = questions[currentQuestionIndex].id;
      setVisitedQuestions(prev => new Set(Array.from(prev).concat(questionId)));
    }
  }, [currentQuestionIndex, viewState, questions]);

  // Cleanup: flush pending save on unmount only
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        // Flush the pending save using the ref data
        if (pendingSaveRef.current && attemptIdRef.current) {
          const { questionId, answer, isMarked } = pendingSaveRef.current;
          fetch(`/api/attempts/${attemptIdRef.current}/responses`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              questionId,
              selectedAnswer: answer,
              isMarkedForReview: isMarked,
              timeTaken: 0,
            }),
            keepalive: true,
          }).catch(() => {
            // Ignore errors during cleanup
          });
        }
      }
    };
  }, []);

  const saveResponseMutation = useMutation({
    mutationFn: async (data: { questionId: string; selectedAnswer: string; isMarkedForReview: boolean }) => {
      const response = await apiRequest("POST", `/api/attempts/${attemptId}/responses`, {
        ...data,
        timeTaken: 0,
      });
      return response.json();
    },
  });

  // Shared helper to flush any pending debounced save
  const flushPendingSave = () => {
    // Clear any pending timer
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    
    // If there's a pending save, flush it
    if (pendingSaveRef.current && attemptIdRef.current) {
      const { questionId, answer, isMarked } = pendingSaveRef.current;
      saveResponseMutation.mutate({
        questionId,
        selectedAnswer: answer,
        isMarkedForReview: isMarked,
      });
      pendingSaveRef.current = null;
    }
    // Even if pendingSaveRef is null (debounce already fired), ensure current answer is saved
    // This handles the case where debounce fired but mutation might have failed or is pending
    else if (attemptIdRef.current && questions && questions[currentQuestionIndexRef.current]) {
      const currentQuestion = questions[currentQuestionIndexRef.current];
      const currentAnswer = answersRef.current[currentQuestion.id] || "";
      const isMarked = markedForReviewRef.current.has(currentQuestion.id);
      
      // Only save if there's an answer or mark status (avoid unnecessary saves)
      if (currentAnswer || isMarked) {
        saveResponseMutation.mutate({
          questionId: currentQuestion.id,
          selectedAnswer: currentAnswer,
          isMarkedForReview: isMarked,
        });
      }
    }
  };

  const handleAnswerChange = (questionId: string, value: string, isNumerical: boolean = false) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    
    // Clear existing timer if exists
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    
    if (attemptId) {
      // For numerical inputs, debounce to avoid race conditions
      if (isNumerical) {
        // Store pending save data in ref
        pendingSaveRef.current = {
          questionId,
          answer: value || "",
          isMarked: markedForReview.has(questionId),
        };
        
        // Set debounced timer
        saveTimerRef.current = setTimeout(() => {
          if (pendingSaveRef.current) {
            const { questionId, answer, isMarked } = pendingSaveRef.current;
            saveResponseMutation.mutate({
              questionId,
              selectedAnswer: answer,
              isMarkedForReview: isMarked,
            });
            pendingSaveRef.current = null;
          }
          saveTimerRef.current = null;
        }, 500);
      } else {
        // For MCQ, save immediately
        saveResponseMutation.mutate({
          questionId,
          selectedAnswer: value || "",
          isMarkedForReview: markedForReview.has(questionId),
        });
      }
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
    flushPendingSave();
    
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
    flushPendingSave();
    submitTestMutation.mutate();
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleQuestionSelect = (index: number) => {
    flushPendingSave();
    setCurrentQuestionIndex(index);
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

  // Instructions Page
  if (viewState === "instructions") {
    return (
      <TestInstructions
        test={test}
        questions={questions}
        onBegin={() => startTestMutation.mutate()}
        isStarting={startTestMutation.isPending}
      />
    );
  }

  // Exam Summary Page
  if (viewState === "summary") {
    return (
      <TestSummary
        test={test}
        questions={questions}
        answers={answers}
        markedForReview={markedForReview}
        visitedQuestions={visitedQuestions}
        timeLeft={timeLeft}
        onBack={() => setViewState("test")}
        onSubmit={handleSubmit}
        isSubmitting={submitTestMutation.isPending}
      />
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
                <MarkdownRenderer content={currentQuestion.content} />
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
                        <Label htmlFor={option.id} className="flex-1 cursor-pointer prose dark:prose-invert prose-sm max-w-none">
                          <MarkdownRenderer content={option.text} />
                        </Label>
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
                          <Label htmlFor={option.id} className="flex-1 cursor-pointer prose dark:prose-invert prose-sm max-w-none">
                            <MarkdownRenderer content={option.text} />
                          </Label>
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
                      onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value, true)}
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
                onClick={() => {
                  flushPendingSave();
                  setViewState("summary");
                }}
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
        <QuestionPalette
          questions={questions}
          currentIndex={currentQuestionIndex}
          answers={answers}
          markedForReview={markedForReview}
          visitedQuestions={visitedQuestions}
          onQuestionSelect={handleQuestionSelect}
        />
      </div>

      {/* Calculator Dialog */}
      <CalculatorDialog
        open={showCalculator}
        onOpenChange={setShowCalculator}
      />
    </div>
  );
}
