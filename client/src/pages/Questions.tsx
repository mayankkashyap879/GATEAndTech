import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Filter, BookOpen, Clock, BarChart } from "lucide-react";
import type { Question, Topic } from "@shared/schema";
import DashboardNavigation from "@/components/dashboard/DashboardNavigation";

export default function Questions() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedTopic, setSelectedTopic] = useState<string>("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");

  // Fetch topics
  const { data: topics = [] } = useQuery<Topic[]>({
    queryKey: ["/api/topics"],
  });

  // Fetch questions with filters
  const queryParams = new URLSearchParams();
  if (selectedTopic !== "all") queryParams.append("topicId", selectedTopic);
  if (selectedDifficulty !== "all") queryParams.append("difficulty", selectedDifficulty);
  if (selectedType !== "all") queryParams.append("type", selectedType);

  const { data: questions = [], isLoading } = useQuery<Question[]>({
    queryKey: ["/api/questions", selectedTopic, selectedDifficulty, selectedType],
    queryFn: async () => {
      const response = await fetch(`/api/questions?${queryParams.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch questions");
      return response.json();
    },
    enabled: !isAuthLoading, // Only fetch when auth is loaded
  });

  // All authenticated users (student, moderator, admin) can create questions
  // Wait for auth to load before showing the button
  const canManageQuestions =
    !isAuthLoading &&
    !!user &&
    (user.role === "admin" || user.role === "moderator");

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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "mcq_single":
        return <BookOpen className="h-4 w-4" />;
      case "numerical":
        return <BarChart className="h-4 w-4" />;
      case "mcq_multiple":
        return <Filter className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <DashboardNavigation />
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Question Bank</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Browse and practice from our comprehensive question collection
            </p>
          </div>
          {canManageQuestions && (
            <Button
              className="gap-2"
              data-testid="button-create-question"
              onClick={() => setLocation("/questions/new")}
            >
              <Plus className="h-4 w-4" />
              Add Question
            </Button>
          )}
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Topic</label>
              <Select value={selectedTopic} onValueChange={setSelectedTopic}>
                <SelectTrigger data-testid="select-topic">
                  <SelectValue placeholder="All Topics" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Topics</SelectItem>
                  {topics.map((topic) => (
                    <SelectItem key={topic.id} value={topic.id}>
                      {topic.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Difficulty</label>
              <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                <SelectTrigger data-testid="select-difficulty">
                  <SelectValue placeholder="All Levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Type</label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger data-testid="select-type">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="mcq_single">MCQ (Single)</SelectItem>
                  <SelectItem value="mcq_multiple">MSQ (Multiple)</SelectItem>
                  <SelectItem value="numerical">Numerical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Question List */}
        <div className="space-y-4">
          {isLoading ? (
            // Loading skeleton
            Array.from({ length: 5 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2 mt-2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full" />
                </CardContent>
              </Card>
            ))
          ) : questions.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium text-foreground">No questions found</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Try adjusting your filters or add a new question
                </p>
              </CardContent>
            </Card>
          ) : (
            questions.map((question) => (
              <Link key={question.id} href={`/questions/${question.id}`}>
                <Card className="hover-elevate cursor-pointer transition-all" data-testid={`card-question-${question.id}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex items-center gap-1">
                            {getTypeIcon(question.type)}
                            <span className="text-xs font-medium text-muted-foreground uppercase">
                              {question.type === "mcq_single" ? "MCQ" : question.type === "mcq_multiple" ? "MSQ" : "NUM"}
                            </span>
                          </div>
                          <Badge className={getDifficultyColor(question.difficulty)} variant="outline">
                            {question.difficulty}
                          </Badge>
                          <Badge variant="secondary" className="gap-1">
                            <Clock className="h-3 w-3" />
                            {question.marks} {question.marks === 1 ? "mark" : "marks"}
                          </Badge>
                        </div>
                        <CardTitle className="text-base line-clamp-2">
                          {question.content}
                        </CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  {question.explanation && (
                    <CardContent>
                      <CardDescription className="line-clamp-2">
                        {question.explanation}
                      </CardDescription>
                    </CardContent>
                  )}
                </Card>
              </Link>
            ))
          )}
        </div>

        {/* Results count */}
        {!isLoading && questions.length > 0 && (
          <div className="text-center text-sm text-muted-foreground">
            Showing {questions.length} {questions.length === 1 ? "question" : "questions"}
          </div>
        )}
      </div>
    </div>
  );
}
