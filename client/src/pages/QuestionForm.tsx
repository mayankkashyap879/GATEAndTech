import { useState, useEffect } from "react";
import { useRoute, useLocation, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ArrowLeft, Plus, Trash2, Save } from "lucide-react";
import { RichTextEditor } from "@/components/RichTextEditor";
import type { Question, Topic, Subject } from "@shared/schema";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

const questionSchema = z.object({
  content: z.string().min(10, "Question content must be at least 10 characters"),
  type: z.enum(["mcq_single", "mcq_multiple", "numerical"]),
  difficulty: z.enum(["easy", "medium", "hard"]),
  marks: z.number().min(1).max(10),
  negativeMarks: z.number().min(0).max(5),
  explanation: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
  isPublished: z.boolean(),
  options: z.array(z.object({
    id: z.string(),
    text: z.string().min(1, "Option text is required"),
    isCorrect: z.boolean(),
  })).optional(),
  correctAnswer: z.string().optional(),
  topicId: z.string().min(1, "Please select a topic"),
});

type QuestionFormData = z.infer<typeof questionSchema>;

export default function QuestionForm() {
  const { user } = useAuth();
  const [, params] = useRoute("/questions/:id/edit");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const questionId = params?.id;
  const isEditing = !!questionId;

  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [isNewTopicDialogOpen, setIsNewTopicDialogOpen] = useState(false);
  const [newTopicName, setNewTopicName] = useState("");
  const [newTopicDescription, setNewTopicDescription] = useState("");

  // Fetch subjects
  const { data: subjects = [] } = useQuery<Subject[]>({
    queryKey: ["/api/subjects"],
  });

  // Fetch topics based on selected subject
  const { data: topics = [] } = useQuery<Topic[]>({
    queryKey: ["/api/topics", selectedSubjectId],
    enabled: !!selectedSubjectId,
    queryFn: async () => {
      const response = await fetch(`/api/topics?subjectId=${selectedSubjectId}`);
      if (!response.ok) throw new Error("Failed to fetch topics");
      return response.json();
    },
  });

  // Fetch existing question if editing
  const { data: question } = useQuery<Question>({
    queryKey: ["/api/questions", questionId],
    enabled: isEditing,
  });

  const form = useForm<QuestionFormData>({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      content: "",
      type: "mcq_single",
      difficulty: "medium",
      marks: 1,
      negativeMarks: 0,
      explanation: "",
      imageUrl: "",
      isPublished: false,
      options: [
        { id: "A", text: "", isCorrect: false },
        { id: "B", text: "", isCorrect: false },
        { id: "C", text: "", isCorrect: false },
        { id: "D", text: "", isCorrect: false },
      ],
      correctAnswer: "",
      topicId: "",
    },
  });

  const questionType = form.watch("type");

  // Update form when question data is loaded
  useEffect(() => {
    if (question) {
      const questionWithTopics = question as any;
      form.reset({
        content: question.content,
        type: question.type,
        difficulty: question.difficulty,
        marks: question.marks,
        negativeMarks: question.negativeMarks,
        explanation: question.explanation || "",
        imageUrl: question.imageUrl || "",
        isPublished: question.isPublished,
        options: question.options as any || [],
        correctAnswer: question.correctAnswer || "",
        topicId: questionWithTopics.topics?.[0]?.id || "",
      });
    }
  }, [question, form]);

  const createMutation = useMutation({
    mutationFn: async (data: QuestionFormData) => {
      const response = await apiRequest("POST", "/api/questions", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/questions"] });
      toast({
        title: "Success",
        description: "Question created successfully",
      });
      setLocation("/questions");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create question",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: QuestionFormData) => {
      const response = await apiRequest("PATCH", `/api/questions/${questionId}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/questions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/questions", questionId] });
      toast({
        title: "Success",
        description: "Question updated successfully",
      });
      setLocation(`/questions/${questionId}`);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update question",
        variant: "destructive",
      });
    },
  });

  const createTopicMutation = useMutation({
    mutationFn: async (data: { name: string; slug: string; subjectId: string; description?: string }) => {
      return apiRequest("POST", "/api/topics", data);
    },
    onSuccess: (newTopic: Topic) => {
      queryClient.invalidateQueries({ queryKey: ["/api/topics"] });
      setIsNewTopicDialogOpen(false);
      setNewTopicName("");
      setNewTopicDescription("");
      form.setValue("topicId", newTopic.id);
      toast({ title: "Topic created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create topic", variant: "destructive" });
    },
  });

  const handleCreateTopic = () => {
    if (!selectedSubjectId || !newTopicName.trim()) {
      toast({ title: "Please provide topic name", variant: "destructive" });
      return;
    }
    const slug = newTopicName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    createTopicMutation.mutate({
      name: newTopicName.trim(),
      slug,
      subjectId: selectedSubjectId,
      description: newTopicDescription.trim() || undefined,
    });
  };

  const onSubmit = (data: QuestionFormData) => {
    if (isEditing) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const addOption = () => {
    const currentOptions = form.getValues("options") || [];
    const nextLetter = String.fromCharCode(65 + currentOptions.length); // A, B, C, ...
    form.setValue("options", [
      ...currentOptions,
      { id: nextLetter, text: "", isCorrect: false },
    ]);
  };

  const removeOption = (index: number) => {
    const currentOptions = form.getValues("options") || [];
    form.setValue("options", currentOptions.filter((_, i) => i !== index));
  };

  // All authenticated users can create/edit questions
  if (!user) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-lg font-medium text-foreground">Access Denied</p>
              <p className="text-sm text-muted-foreground mt-1">
                You need to be logged in to manage questions
              </p>
              <Link href="/login">
                <Button className="mt-4" variant="outline">
                  Go to Login
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link href="/questions">
            <Button variant="ghost" className="gap-2" data-testid="button-back">
              <ArrowLeft className="h-4 w-4" />
              Back to Questions
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{isEditing ? "Edit Question" : "Create New Question"}</CardTitle>
            <CardDescription>
              {isEditing ? "Update question details" : "Add a new question to the question bank"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Basic Information */}
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <RichTextEditor
                          value={field.value}
                          onChange={field.onChange}
                          label="Question Content *"
                          placeholder="Write your question here... You can use Markdown, LaTeX equations ($...$), and code blocks."
                          minHeight="250px"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Question Type *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-question-type">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="mcq_single">MCQ (Single Correct)</SelectItem>
                            <SelectItem value="mcq_multiple">MSQ (Multiple Correct)</SelectItem>
                            <SelectItem value="numerical">Numerical Answer</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="difficulty"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Difficulty *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-difficulty">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="easy">Easy</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="hard">Hard</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="marks"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Marks *</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            min="1"
                            max="10"
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                            data-testid="input-marks"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="negativeMarks"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Negative Marks</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            min="0"
                            max="5"
                            step="0.25"
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                            data-testid="input-negative-marks"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormItem>
                    <FormLabel>Subject *</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        setSelectedSubjectId(value);
                        form.setValue("topicId", ""); // Reset topic when subject changes
                      }}
                      value={selectedSubjectId}
                    >
                      <SelectTrigger data-testid="select-subject">
                        <SelectValue placeholder="Select subject" />
                      </SelectTrigger>
                      <SelectContent>
                        {subjects.map((subject) => (
                          <SelectItem key={subject.id} value={subject.id}>
                            {subject.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>

                  <FormField
                    control={form.control}
                    name="topicId"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between">
                          <FormLabel>Topic *</FormLabel>
                          {selectedSubjectId && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setIsNewTopicDialogOpen(true)}
                              className="gap-1"
                              data-testid="button-add-new-topic"
                            >
                              <Plus className="h-3 w-3" />
                              New Topic
                            </Button>
                          )}
                        </div>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={!selectedSubjectId}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-topic">
                              <SelectValue
                                placeholder={
                                  selectedSubjectId
                                    ? "Select topic"
                                    : "Select a subject first"
                                }
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {topics.map((topic) => (
                              <SelectItem key={topic.id} value={topic.id}>
                                {topic.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Options for MCQ/MSQ */}
                {(questionType === "mcq_single" || questionType === "mcq_multiple") && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <FormLabel>Options *</FormLabel>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addOption}
                        className="gap-2"
                        data-testid="button-add-option"
                      >
                        <Plus className="h-4 w-4" />
                        Add Option
                      </Button>
                    </div>
                    <div className="space-y-3">
                      {(form.watch("options") || []).map((option, index) => (
                        <div key={index} className="flex items-start gap-3 p-4 border rounded-lg">
                          <FormField
                            control={form.control}
                            name={`options.${index}.isCorrect`}
                            render={({ field }) => (
                              <FormItem className="flex items-center space-y-0">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    data-testid={`checkbox-option-${index}-correct`}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <div className="flex-1">
                            <FormField
                              control={form.control}
                              name={`options.${index}.text`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Textarea
                                      {...field}
                                      placeholder={`Option ${option.id} (supports LaTeX: $x^2$)`}
                                      data-testid={`input-option-${index}`}
                                      className="min-h-20 font-mono text-sm"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeOption(index)}
                            disabled={(form.watch("options")?.length || 0) <= 2}
                            data-testid={`button-remove-option-${index}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                    <FormDescription>
                      Check the box next to the correct option(s)
                    </FormDescription>
                  </div>
                )}

                {/* Correct Answer for Numerical */}
                {questionType === "numerical" && (
                  <FormField
                    control={form.control}
                    name="correctAnswer"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Correct Answer *</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Enter the correct numerical answer"
                            data-testid="input-correct-answer"
                          />
                        </FormControl>
                        <FormDescription>
                          Enter the numerical value or range
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Additional Information */}
                <FormField
                  control={form.control}
                  name="explanation"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <RichTextEditor
                          value={field.value || ""}
                          onChange={field.onChange}
                          label="Explanation"
                          placeholder="Explain the correct answer with detailed solution steps..."
                          minHeight="200px"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Image URL</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="https://example.com/image.jpg"
                          data-testid="input-image-url"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isPublished"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Publish Question</FormLabel>
                        <FormDescription>
                          Make this question visible to students
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-published"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {/* Submit Button */}
                <div className="flex justify-end gap-4">
                  <Link href="/questions">
                    <Button type="button" variant="outline" data-testid="button-cancel">
                      Cancel
                    </Button>
                  </Link>
                  <Button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="gap-2"
                    data-testid="button-submit"
                  >
                    <Save className="h-4 w-4" />
                    {isEditing ? "Update Question" : "Create Question"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isNewTopicDialogOpen} onOpenChange={setIsNewTopicDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Topic</DialogTitle>
            <DialogDescription>
              Add a new topic to {subjects.find(s => s.id === selectedSubjectId)?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="new-topic-name">Topic Name *</Label>
              <Input
                id="new-topic-name"
                value={newTopicName}
                onChange={(e) => setNewTopicName(e.target.value)}
                placeholder="e.g., Arrays and Strings"
                data-testid="input-new-topic-name"
              />
            </div>
            <div>
              <Label htmlFor="new-topic-description">Description</Label>
              <Textarea
                id="new-topic-description"
                value={newTopicDescription}
                onChange={(e) => setNewTopicDescription(e.target.value)}
                placeholder="Brief description of the topic"
                rows={3}
                data-testid="input-new-topic-description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsNewTopicDialogOpen(false)}
              data-testid="button-cancel-new-topic"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateTopic}
              disabled={createTopicMutation.isPending || !newTopicName.trim()}
              data-testid="button-create-new-topic"
            >
              {createTopicMutation.isPending ? "Creating..." : "Create Topic"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
