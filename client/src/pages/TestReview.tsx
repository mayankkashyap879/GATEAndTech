import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle2, 
  XCircle, 
  Circle, 
  ChevronLeft, 
  ChevronRight,
  Home 
} from "lucide-react";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { Loader2 } from "lucide-react";
import type { TestAttempt, Question, TestResponse, Test } from "@shared/schema";

export default function TestReview() {
  const [, params] = useRoute("/attempts/:id/review");
  const [, navigate] = useLocation();
  const attemptId = params?.id;
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // Fetch attempt
  const { data: attempt, isLoading: isLoadingAttempt } = useQuery<TestAttempt>({
    queryKey: ["/api/attempts", attemptId],
  });

  // Fetch test
  const { data: test, isLoading: isLoadingTest } = useQuery<Test>({
    queryKey: ["/api/tests", attempt?.testId],
    enabled: !!attempt?.testId,
  });

  // Fetch questions
  const { data: questions, isLoading: isLoadingQuestions } = useQuery<Question[]>({
    queryKey: ["/api/tests", attempt?.testId, "questions"],
    enabled: !!attempt?.testId,
  });

  // Fetch responses
  const { data: responses, isLoading: isLoadingResponses } = useQuery<TestResponse[]>({
    queryKey: ["/api/attempts", attemptId, "responses"],
    enabled: !!attemptId,
  });

  if (isLoadingAttempt || isLoadingTest || isLoadingQuestions || isLoadingResponses) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!attempt || !test || !questions || !responses) {
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <p className="text-muted-foreground">Review not available</p>
        <Button onClick={() => navigate("/")} className="mt-4">
          <Home className="h-4 w-4 mr-2" />
          Go Home
        </Button>
      </div>
    );
  }

  // Check if solutions should be shown
  const showSolutions = test.showSolutionsAfterSubmit !== false; // default true

  const currentQuestion = questions[currentQuestionIndex];
  const currentResponse = responses.find(r => r.questionId === currentQuestion.id);

  const getAnswerStatus = (question: Question, response?: TestResponse) => {
    if (!response || !response.selectedAnswer || response.selectedAnswer.trim() === "") {
      return "unattempted";
    }
    
    if (response.isCorrect === true) {
      return "correct";
    } else if (response.isCorrect === false) {
      return "incorrect";
    }
    
    return "unattempted";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "correct":
        return "bg-green-100 dark:bg-green-900 border-green-500";
      case "incorrect":
        return "bg-red-100 dark:bg-red-900 border-red-500";
      default:
        return "bg-gray-100 dark:bg-gray-800 border-gray-400";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "correct":
        return <CheckCircle2 className="h-6 w-6 text-green-600" />;
      case "incorrect":
        return <XCircle className="h-6 w-6 text-red-600" />;
      default:
        return <Circle className="h-6 w-6 text-gray-400" />;
    }
  };

  const getCorrectAnswer = (question: Question) => {
    if (question.type === "numerical") {
      return question.correctAnswer;
    } else if (question.type === "mcq_single") {
      const correctOption = (question.options as any)?.find((opt: any) => opt.isCorrect);
      return correctOption;
    } else if (question.type === "mcq_multiple") {
      const correctOptions = (question.options as any)?.filter((opt: any) => opt.isCorrect);
      return correctOptions;
    }
    return null;
  };

  const status = getAnswerStatus(currentQuestion, currentResponse);
  const correctAnswer = showSolutions ? getCorrectAnswer(currentQuestion) : null;

  const stats = {
    correct: responses.filter(r => r.isCorrect === true).length,
    incorrect: responses.filter(r => r.isCorrect === false).length,
    unattempted: questions.length - responses.filter(r => r.selectedAnswer && r.selectedAnswer.trim() !== "").length,
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900">
      {/* Header */}
      <div className="bg-blue-600 text-white py-3 px-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-semibold">{test.title} - Review</h1>
            <p className="text-sm text-blue-100">
              Score: {attempt.score}/{attempt.maxScore} | 
              Percentile: {attempt.percentile || "N/A"}
            </p>
          </div>
          <Button
            onClick={() => navigate(`/attempts/${attemptId}/results`)}
            variant="outline"
            className="text-white border-white hover:bg-blue-700"
          >
            Back to Results
          </Button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-white dark:bg-slate-800 border-b py-3 px-6">
        <div className="flex gap-6 text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <span>Correct: <strong>{stats.correct}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-600" />
            <span>Incorrect: <strong>{stats.incorrect}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <Circle className="h-5 w-5 text-gray-400" />
            <span>Unattempted: <strong>{stats.unattempted}</strong></span>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Main Content */}
        <div className="flex-1 p-6">
          {/* Question Card */}
          <Card className={`mb-4 border-2 ${getStatusColor(status)}`}>
            <div className="p-4 bg-blue-50 dark:bg-blue-950 border-b flex justify-between items-center">
              <div className="flex items-center gap-3">
                {getStatusIcon(status)}
                <span className="font-medium">Question {currentQuestionIndex + 1} of {questions.length}</span>
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">
                  Marks: <span className="text-emerald-600 font-semibold">{currentQuestion.marks}</span> | 
                  Negative: <span className="text-red-600 font-semibold">{currentQuestion.negativeMarks}</span>
                </span>
                {currentResponse && currentResponse.marksAwarded !== undefined && (
                  <span className="ml-4">
                    Scored: <strong className={currentResponse.marksAwarded > 0 ? "text-green-600" : "text-red-600"}>
                      {currentResponse.marksAwarded}
                    </strong>
                  </span>
                )}
              </div>
            </div>

            <div className="p-6">
              {/* Question Content */}
              <div className="prose dark:prose-invert max-w-none mb-6">
                <MarkdownRenderer content={currentQuestion.content} />
                {currentQuestion.imageUrl && (
                  <img src={currentQuestion.imageUrl} alt="Question" className="mt-4 rounded-lg max-w-md" />
                )}
              </div>

              {/* Options/Answer */}
              <div className="space-y-4">
                {currentQuestion.type === "mcq_single" && (
                  <div className="space-y-3">
                    {(currentQuestion.options as any)?.map((option: any) => {
                      const isUserAnswer = currentResponse?.selectedAnswer === option.id;
                      const isCorrectOption = showSolutions && option.isCorrect;
                      
                      return (
                        <div
                          key={option.id}
                          className={`p-3 rounded-lg border-2 ${
                            isCorrectOption
                              ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                              : isUserAnswer && !isCorrectOption
                              ? "border-red-500 bg-red-50 dark:bg-red-900/20"
                              : "border-gray-300 dark:border-gray-700"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            {isUserAnswer && <Badge variant="secondary">Your Answer</Badge>}
                            {isCorrectOption && <Badge className="bg-green-600 text-white">Correct Answer</Badge>}
                          </div>
                          <div className="prose dark:prose-invert prose-sm max-w-none mt-2">
                            <MarkdownRenderer content={option.text} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {currentQuestion.type === "mcq_multiple" && (
                  <div className="space-y-3">
                    {(currentQuestion.options as any)?.map((option: any) => {
                      const userAnswers = currentResponse?.selectedAnswer?.split(",") || [];
                      const isUserAnswer = userAnswers.includes(option.id);
                      const isCorrectOption = showSolutions && option.isCorrect;
                      
                      return (
                        <div
                          key={option.id}
                          className={`p-3 rounded-lg border-2 ${
                            isCorrectOption
                              ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                              : isUserAnswer && !isCorrectOption
                              ? "border-red-500 bg-red-50 dark:bg-red-900/20"
                              : "border-gray-300 dark:border-gray-700"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            {isUserAnswer && <Badge variant="secondary">Your Answer</Badge>}
                            {isCorrectOption && <Badge className="bg-green-600 text-white">Correct Answer</Badge>}
                          </div>
                          <div className="prose dark:prose-invert prose-sm max-w-none mt-2">
                            <MarkdownRenderer content={option.text} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {currentQuestion.type === "numerical" && (
                  <div>
                    <div className="mb-4">
                      <strong>Your Answer:</strong>
                      <div className={`mt-2 p-3 rounded border-2 ${
                        status === "correct"
                          ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                          : status === "incorrect"
                          ? "border-red-500 bg-red-50 dark:bg-red-900/20"
                          : "border-gray-300 bg-gray-50 dark:bg-gray-800"
                      }`}>
                        {currentResponse?.selectedAnswer || "Not attempted"}
                      </div>
                    </div>
                    {showSolutions && (
                      <div>
                        <strong>Correct Answer:</strong>
                        <div className="mt-2 p-3 rounded border-2 border-green-500 bg-green-50 dark:bg-green-900/20">
                          {correctAnswer}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Explanation */}
              {showSolutions && currentQuestion.explanation && (
                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <h4 className="font-semibold mb-2">Explanation:</h4>
                  <div className="prose dark:prose-invert prose-sm max-w-none">
                    <MarkdownRenderer content={currentQuestion.explanation} />
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Navigation */}
          <div className="flex justify-between">
            <Button
              onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
              disabled={currentQuestionIndex === 0}
              variant="outline"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
            <Button
              onClick={() => setCurrentQuestionIndex(prev => Math.min(questions.length - 1, prev + 1))}
              disabled={currentQuestionIndex === questions.length - 1}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>

        {/* Question Palette Sidebar */}
        <div className="w-80 bg-white dark:bg-slate-800 border-l p-4">
          <h3 className="font-semibold mb-3">Question Palette</h3>
          <div className="grid grid-cols-4 gap-2">
            {questions.map((q, index) => {
              const response = responses.find(r => r.questionId === q.id);
              const qStatus = getAnswerStatus(q, response);
              const bgColor = qStatus === "correct" 
                ? "bg-green-500 text-white" 
                : qStatus === "incorrect" 
                ? "bg-red-500 text-white"
                : "bg-gray-300 dark:bg-gray-700";

              return (
                <Button
                  key={q.id}
                  onClick={() => setCurrentQuestionIndex(index)}
                  className={`h-10 ${bgColor} ${index === currentQuestionIndex ? "ring-2 ring-blue-600" : ""}`}
                  size="sm"
                >
                  {index + 1}
                </Button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
