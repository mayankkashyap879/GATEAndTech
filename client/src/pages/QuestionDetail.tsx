import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Edit, CheckCircle2, XCircle, BookOpen, Info } from "lucide-react";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import DashboardNavigation from "@/components/dashboard/DashboardNavigation";
import type { Question } from "@shared/schema";

export default function QuestionDetail() {
  const { user } = useAuth();
  const [, params] = useRoute("/questions/:id");
  const questionId = params?.id;

  const { data: question, isLoading } = useQuery<Question>({
    queryKey: ["/api/questions", questionId],
    enabled: !!questionId,
  });

  const canEdit = user?.role === "admin" || user?.role === "moderator";

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      case "medium":
        return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      case "hard":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      default:
        return "bg-slate-500/10 text-slate-500 border-slate-500/20";
    }
  };

  const PageShell = ({ children }: { children: ReactNode }) => (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-8">
        <DashboardNavigation />
        {children}
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <PageShell>
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-10 w-1/3" />
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-1/2 mt-2" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
        </div>
      </PageShell>
    );
  }

  if (!question) {
    return (
      <PageShell>
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-foreground">Question not found</p>
              <Link href="/questions">
                <Button className="mt-4" variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Questions
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link href="/questions">
            <Button variant="ghost" className="gap-2" data-testid="button-back">
              <ArrowLeft className="h-4 w-4" />
              Back to Questions
            </Button>
          </Link>
          {canEdit && (
            <Link href={`/questions/${question.id}/edit`}>
              <Button variant="outline" className="gap-2" data-testid="button-edit-question">
                <Edit className="h-4 w-4" />
                Edit
              </Button>
            </Link>
          )}
        </div>

        {/* Question Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 mb-4">
              <Badge className={getDifficultyColor(question.difficulty)} variant="outline">
                {question.difficulty}
              </Badge>
              <Badge variant="secondary">
                {question.type === "mcq_single" ? "MCQ" : question.type === "mcq_multiple" ? "MSQ" : "NUMERICAL"}
              </Badge>
              <Badge variant="outline">
                {question.marks} {question.marks === 1 ? "mark" : "marks"}
              </Badge>
              {question.negativeMarks > 0 && (
                <Badge variant="destructive">
                  -{question.negativeMarks} (negative)
                </Badge>
              )}
            </div>
            <div className="prose dark:prose-invert max-w-none" data-testid="text-question-content">
              <MarkdownRenderer content={question.content} />
            </div>
          </CardHeader>

          {question.imageUrl && (
            <CardContent>
              <img
                src={question.imageUrl}
                alt="Question illustration"
                className="rounded-lg border border-border max-w-full"
              />
            </CardContent>
          )}

          {/* Options for MCQ/MSQ */}
          {(question.type === "mcq_single" || question.type === "mcq_multiple") && question.options && (
            <CardContent>
              <h3 className="text-sm font-medium mb-4">Options:</h3>
              <div className="space-y-3">
                {(question.options as any[]).map((option: any) => (
                  <div
                    key={option.id}
                    className={`p-4 rounded-lg border ${
                      option.isCorrect
                        ? "border-emerald-500/50 bg-emerald-500/5"
                        : "border-border bg-card"
                    }`}
                    data-testid={`option-${option.id}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {option.isCorrect ? (
                          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                        ) : (
                          <XCircle className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 prose dark:prose-invert prose-sm max-w-none">
                        <span className="font-medium text-sm text-muted-foreground mr-2 not-prose">
                          {option.id}.
                        </span>
                        <MarkdownRenderer content={option.text} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          )}

          {/* Correct Answer for Numerical */}
          {question.type === "numerical" && question.correctAnswer && (
            <CardContent>
              <div className="p-4 rounded-lg border border-emerald-500/50 bg-emerald-500/5">
                <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  Correct Answer:
                </h3>
                <p className="text-lg font-semibold text-foreground" data-testid="text-correct-answer">
                  {question.correctAnswer}
                </p>
              </div>
            </CardContent>
          )}

          {/* Explanation */}
          {question.explanation && (
            <CardContent>
              <div className="p-4 rounded-lg border border-border bg-muted/50">
                <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Explanation:
                </h3>
                <div className="prose dark:prose-invert prose-sm max-w-none" data-testid="text-explanation">
                  <MarkdownRenderer content={question.explanation} />
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Metadata */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Question Metadata</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status:</span>
              <Badge variant={question.isPublished ? "default" : "secondary"}>
                {question.isPublished ? "Published" : "Draft"}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Created:</span>
              <span className="text-foreground">
                {new Date(question.createdAt!).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Last Updated:</span>
              <span className="text-foreground">
                {new Date(question.updatedAt!).toLocaleDateString()}
              </span>
            </div>
          </CardContent>
      </Card>
      </div>
    </PageShell>
  );
}
