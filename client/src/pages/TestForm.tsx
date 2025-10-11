import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, Plus, X } from "lucide-react";
import type { Test, Question, Topic } from "@shared/schema";

const testFormSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  duration: z.coerce.number().int().positive("Duration must be positive"),
  totalMarks: z.coerce.number().int().positive("Total marks must be positive"),
  status: z.enum(["draft", "published", "archived"]),
  isPro: z.boolean(),
  scheduledAt: z.string().optional(),
  questionIds: z.array(z.string()).min(1, "Select at least one question"),
});

type TestFormData = z.infer<typeof testFormSchema>;

export default function TestForm() {
  const [, params] = useRoute("/tests/:id/edit");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const testId = params?.id;
  const isEdit = !!testId;
  
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [topicFilter, setTopicFilter] = useState<string>("all");

  const { data: test, isLoading: isLoadingTest } = useQuery<Test>({
    queryKey: ["/api/tests", testId],
    enabled: isEdit,
  });

  const { data: questions } = useQuery<Question[]>({
    queryKey: ["/api/questions", topicFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (topicFilter !== "all") params.append("topicId", topicFilter);
      const response = await fetch(`/api/questions?${params}`);
      if (!response.ok) throw new Error("Failed to fetch questions");
      return response.json();
    },
  });

  const { data: topics } = useQuery<Topic[]>({
    queryKey: ["/api/topics"],
  });

  const form = useForm<TestFormData>({
    resolver: zodResolver(testFormSchema),
    defaultValues: {
      title: "",
      description: "",
      duration: 60,
      totalMarks: 100,
      status: "draft",
      isPro: false,
      scheduledAt: "",
      questionIds: [],
    },
  });

  useEffect(() => {
    if (test) {
      form.reset({
        title: test.title,
        description: test.description || "",
        duration: test.duration,
        totalMarks: test.totalMarks,
        status: test.status,
        isPro: test.isPro,
        scheduledAt: test.scheduledAt ? new Date(test.scheduledAt).toISOString().slice(0, 16) : "",
        questionIds: [],
      });
    }
  }, [test, form]);

  const createMutation = useMutation({
    mutationFn: async (data: TestFormData) => {
      const response = await apiRequest("POST", "/api/tests", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tests"] });
      toast({
        title: "Success",
        description: "Test created successfully",
      });
      navigate("/tests");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create test",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: TestFormData) => {
      const response = await apiRequest("PATCH", `/api/tests/${testId}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tests", testId] });
      toast({
        title: "Success",
        description: "Test updated successfully",
      });
      navigate("/tests");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update test",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: TestFormData) => {
    const formData = {
      ...data,
      questionIds: selectedQuestions,
      scheduledAt: data.scheduledAt ? new Date(data.scheduledAt).toISOString() : undefined,
    };

    if (isEdit) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const toggleQuestion = (questionId: string) => {
    setSelectedQuestions(prev =>
      prev.includes(questionId)
        ? prev.filter(id => id !== questionId)
        : [...prev, questionId]
    );
  };

  if (isEdit && isLoadingTest) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      <h1 className="text-3xl font-bold mb-8" data-testid="text-page-title">
        {isEdit ? "Edit Test" : "Create Test"}
      </h1>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Test Details</CardTitle>
              <CardDescription>Basic information about the test</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="GATE 2024 Mock Test 1" {...field} data-testid="input-title" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Full-length mock test covering all topics"
                        {...field}
                        data-testid="textarea-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration (minutes)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} data-testid="input-duration" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="totalMarks"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Marks</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} data-testid="input-totalMarks" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-status">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="published">Published</SelectItem>
                          <SelectItem value="archived">Archived</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="scheduledAt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Schedule (optional)</FormLabel>
                      <FormControl>
                        <Input
                          type="datetime-local"
                          {...field}
                          data-testid="input-scheduledAt"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="isPro"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Pro Only</FormLabel>
                      <FormDescription>
                        Restrict this test to Pro subscribers
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="switch-isPro"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Select Questions</CardTitle>
              <CardDescription>Choose questions to include in this test</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Select value={topicFilter} onValueChange={setTopicFilter}>
                  <SelectTrigger className="w-[200px]" data-testid="select-topic-filter">
                    <SelectValue placeholder="Filter by topic" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Topics</SelectItem>
                    {topics?.map((topic) => (
                      <SelectItem key={topic.id} value={topic.id}>
                        {topic.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {questions?.map((question) => (
                  <div
                    key={question.id}
                    className="flex items-start space-x-3 p-3 border rounded-md hover-elevate"
                    data-testid={`question-item-${question.id}`}
                  >
                    <Checkbox
                      id={question.id}
                      checked={selectedQuestions.includes(question.id)}
                      onCheckedChange={() => toggleQuestion(question.id)}
                      data-testid={`checkbox-question-${question.id}`}
                    />
                    <label
                      htmlFor={question.id}
                      className="flex-1 text-sm cursor-pointer"
                    >
                      <div className="font-medium">{question.content.substring(0, 100)}...</div>
                      <div className="text-muted-foreground text-xs mt-1">
                        {question.type} • {question.difficulty} • {question.marks} marks
                      </div>
                    </label>
                  </div>
                ))}
              </div>

              {selectedQuestions.length > 0 && (
                <div className="mt-4 p-3 bg-muted rounded-md">
                  <p className="text-sm font-medium" data-testid="text-selected-count">
                    {selectedQuestions.length} question(s) selected
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              data-testid="button-submit"
            >
              {(createMutation.isPending || updateMutation.isPending) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isEdit ? "Update Test" : "Create Test"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/tests")}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
