import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Edit, Trash2, BookOpen } from "lucide-react";
import type { Subject, Topic } from "@shared/schema";
import DashboardNavigation from "@/components/dashboard/DashboardNavigation";

export default function SubjectManagement() {
  const { toast } = useToast();
  const [isSubjectDialogOpen, setIsSubjectDialogOpen] = useState(false);
  const [isTopicDialogOpen, setIsTopicDialogOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);

  const { data: subjects, isLoading } = useQuery<Subject[]>({
    queryKey: ["/api/subjects"],
  });

  const { data: topics } = useQuery<Topic[]>({
    queryKey: ["/api/topics", selectedSubject?.id],
    enabled: !!selectedSubject,
    queryFn: async () => {
      const response = await fetch(`/api/topics?subjectId=${selectedSubject?.id}`);
      if (!response.ok) throw new Error("Failed to fetch topics");
      return response.json();
    },
  });

  const createSubjectMutation = useMutation({
    mutationFn: async (data: { name: string; slug: string; description?: string; displayOrder?: number }) => {
      return apiRequest("POST", "/api/subjects", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subjects"] });
      setIsSubjectDialogOpen(false);
      toast({ title: "Subject created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create subject", variant: "destructive" });
    },
  });

  const updateSubjectMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Subject> }) => {
      return apiRequest("PATCH", `/api/subjects/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subjects"] });
      setIsSubjectDialogOpen(false);
      setEditingSubject(null);
      toast({ title: "Subject updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update subject", variant: "destructive" });
    },
  });

  const deleteSubjectMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/subjects/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subjects"] });
      toast({ title: "Subject deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete subject", variant: "destructive" });
    },
  });

  const createTopicMutation = useMutation({
    mutationFn: async (data: { name: string; slug: string; subjectId: string; description?: string }) => {
      return apiRequest("POST", "/api/topics", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/topics"] });
      setIsTopicDialogOpen(false);
      toast({ title: "Topic created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create topic", variant: "destructive" });
    },
  });

  const updateTopicMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Topic> }) => {
      return apiRequest("PATCH", `/api/topics/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/topics"] });
      setIsTopicDialogOpen(false);
      setEditingTopic(null);
      toast({ title: "Topic updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update topic", variant: "destructive" });
    },
  });

  const deleteTopicMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/topics/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/topics"] });
      toast({ title: "Topic deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete topic", variant: "destructive" });
    },
  });

  const handleSubjectSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      slug: formData.get("slug") as string,
      description: formData.get("description") as string || undefined,
      displayOrder: parseInt(formData.get("displayOrder") as string) || 0,
    };

    if (editingSubject) {
      updateSubjectMutation.mutate({ id: editingSubject.id, data });
    } else {
      createSubjectMutation.mutate(data);
    }
  };

  const handleTopicSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      slug: formData.get("slug") as string,
      subjectId: selectedSubject?.id || "",
      description: formData.get("description") as string || undefined,
    };

    if (editingTopic) {
      updateTopicMutation.mutate({ id: editingTopic.id, data });
    } else {
      createTopicMutation.mutate(data);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen" data-testid="loading-subjects">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <DashboardNavigation />
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold" data-testid="page-title">Subject & Topic Management</h1>
          <p className="text-muted-foreground">Manage GATE subjects and their topics</p>
        </div>
        <Button 
          onClick={() => {
            setEditingSubject(null);
            setIsSubjectDialogOpen(true);
          }}
          data-testid="button-add-subject"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Subject
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Subjects ({subjects?.length || 0})</CardTitle>
            <CardDescription>All GATE subjects</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {subjects?.map((subject) => (
              <div
                key={subject.id}
                className={`p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors ${
                  selectedSubject?.id === subject.id ? "bg-accent" : ""
                }`}
                onClick={() => setSelectedSubject(subject)}
                data-testid={`subject-item-${subject.id}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold" data-testid={`subject-name-${subject.id}`}>
                      {subject.name}
                    </h3>
                    {subject.description && (
                      <p className="text-sm text-muted-foreground">{subject.description}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingSubject(subject);
                        setIsSubjectDialogOpen(true);
                      }}
                      data-testid={`button-edit-subject-${subject.id}`}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm("Are you sure you want to delete this subject?")) {
                          deleteSubjectMutation.mutate(subject.id);
                        }
                      }}
                      data-testid={`button-delete-subject-${subject.id}`}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>
                  {selectedSubject ? `Topics in ${selectedSubject.name}` : "Topics"}
                </CardTitle>
                <CardDescription>
                  {selectedSubject ? `${topics?.length || 0} topics` : "Select a subject to view topics"}
                </CardDescription>
              </div>
              {selectedSubject && (
                <Button
                  size="sm"
                  onClick={() => {
                    setEditingTopic(null);
                    setIsTopicDialogOpen(true);
                  }}
                  data-testid="button-add-topic"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Topic
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!selectedSubject ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <BookOpen className="h-12 w-12 mb-4" />
                <p>Select a subject to view and manage topics</p>
              </div>
            ) : topics && topics.length > 0 ? (
              <div className="space-y-2">
                {topics.map((topic) => (
                  <div
                    key={topic.id}
                    className="p-3 border rounded-lg hover:bg-accent"
                    data-testid={`topic-item-${topic.id}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium" data-testid={`topic-name-${topic.id}`}>
                          {topic.name}
                        </h4>
                        {topic.description && (
                          <p className="text-sm text-muted-foreground">{topic.description}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingTopic(topic);
                            setIsTopicDialogOpen(true);
                          }}
                          data-testid={`button-edit-topic-${topic.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm("Are you sure you want to delete this topic?")) {
                              deleteTopicMutation.mutate(topic.id);
                            }
                          }}
                          data-testid={`button-delete-topic-${topic.id}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <p>No topics yet. Click "Add Topic" to create one.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isSubjectDialogOpen} onOpenChange={setIsSubjectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSubject ? "Edit Subject" : "Add Subject"}</DialogTitle>
            <DialogDescription>
              {editingSubject ? "Update the subject details" : "Create a new GATE subject"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubjectSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Subject Name</Label>
              <Input
                id="name"
                name="name"
                defaultValue={editingSubject?.name || ""}
                required
                data-testid="input-subject-name"
              />
            </div>
            <div>
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                name="slug"
                defaultValue={editingSubject?.slug || ""}
                required
                data-testid="input-subject-slug"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={editingSubject?.description || ""}
                rows={3}
                data-testid="input-subject-description"
              />
            </div>
            <div>
              <Label htmlFor="displayOrder">Display Order</Label>
              <Input
                id="displayOrder"
                name="displayOrder"
                type="number"
                defaultValue={editingSubject?.displayOrder || 0}
                data-testid="input-subject-display-order"
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsSubjectDialogOpen(false)}
                data-testid="button-cancel-subject"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createSubjectMutation.isPending || updateSubjectMutation.isPending}
                data-testid="button-save-subject"
              >
                {createSubjectMutation.isPending || updateSubjectMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isTopicDialogOpen} onOpenChange={setIsTopicDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTopic ? "Edit Topic" : "Add Topic"}</DialogTitle>
            <DialogDescription>
              {editingTopic ? "Update the topic details" : `Create a new topic in ${selectedSubject?.name}`}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleTopicSubmit} className="space-y-4">
            <div>
              <Label htmlFor="topic-name">Topic Name</Label>
              <Input
                id="topic-name"
                name="name"
                defaultValue={editingTopic?.name || ""}
                required
                data-testid="input-topic-name"
              />
            </div>
            <div>
              <Label htmlFor="topic-slug">Slug</Label>
              <Input
                id="topic-slug"
                name="slug"
                defaultValue={editingTopic?.slug || ""}
                required
                data-testid="input-topic-slug"
              />
            </div>
            <div>
              <Label htmlFor="topic-description">Description</Label>
              <Textarea
                id="topic-description"
                name="description"
                defaultValue={editingTopic?.description || ""}
                rows={3}
                data-testid="input-topic-description"
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsTopicDialogOpen(false)}
                data-testid="button-cancel-topic"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createTopicMutation.isPending || updateTopicMutation.isPending}
                data-testid="button-save-topic"
              >
                {createTopicMutation.isPending || updateTopicMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
