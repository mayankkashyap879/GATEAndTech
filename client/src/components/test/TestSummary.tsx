import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import type { Test, Question } from "@shared/schema";

interface TestSummaryProps {
  test: Test;
  questions: Question[];
  answers: Record<string, string>;
  markedForReview: Set<string>;
  visitedQuestions: Set<string>;
  timeLeft: number;
  onBack: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export default function TestSummary({
  test,
  questions,
  answers,
  markedForReview,
  visitedQuestions,
  timeLeft,
  onBack,
  onSubmit,
  isSubmitting,
}: TestSummaryProps) {
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
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

  const stats = getStats();

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
                onClick={onBack}
                data-testid="button-back-to-test"
              >
                No, Go Back
              </Button>
              <Button 
                onClick={onSubmit}
                disabled={isSubmitting}
                className="bg-emerald-600 hover:bg-emerald-700"
                data-testid="button-confirm-submit"
              >
                {isSubmitting ? (
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
