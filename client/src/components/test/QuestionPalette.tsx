import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User } from "lucide-react";
import type { Question } from "@shared/schema";

interface QuestionPaletteProps {
  questions: Question[];
  currentIndex: number;
  answers: Record<string, string>;
  markedForReview: Set<string>;
  visitedQuestions: Set<string>;
  onQuestionSelect: (index: number) => void;
}

export default function QuestionPalette({
  questions,
  currentIndex,
  answers,
  markedForReview,
  visitedQuestions,
  onQuestionSelect,
}: QuestionPaletteProps) {
  const getQuestionStatus = (questionId: string) => {
    const hasAnswer = answers[questionId] && answers[questionId].trim() !== "";
    const isMarked = markedForReview.has(questionId);
    const isVisited = visitedQuestions.has(questionId);
    const isCurrent = questions?.findIndex(q => q.id === questionId) === currentIndex;
    
    if (hasAnswer && isMarked) return "answered-marked";
    if (hasAnswer) return "answered";
    if (isMarked && !hasAnswer) return "marked";
    if (!hasAnswer && isVisited && !isCurrent) return "not-answered";
    if (isCurrent) return "current";
    return "not-visited";
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

  const stats = getStats();

  return (
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
                onClick={() => onQuestionSelect(index)}
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
          <div className="flex justify-between">
            <span className="text-muted-foreground">Answered & Marked:</span>
            <Badge variant="secondary" className="bg-purple-600 text-white">{stats.answeredMarked}</Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Not Visited:</span>
            <Badge variant="secondary" className="bg-slate-400 text-white">{stats.notVisited}</Badge>
          </div>
        </div>
      </Card>
    </div>
  );
}
