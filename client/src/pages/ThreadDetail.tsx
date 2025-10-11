import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, MessageSquare, ThumbsUp, CheckCircle } from "lucide-react";
import { useLocation, useRoute } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface Thread {
  id: string;
  title: string;
  content: string;
  authorId: string;
  viewCount: number;
  createdAt: string;
  author?: {
    id: string;
    name: string;
  };
}

interface Post {
  id: string;
  threadId: string;
  content: string;
  authorId: string;
  isAcceptedAnswer: boolean;
  upvotes: number;
  createdAt: string;
  author?: {
    id: string;
    name: string;
  };
}

export default function ThreadDetail() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/discussions/:id");
  const { toast } = useToast();
  const [answer, setAnswer] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  
  const threadId = params?.id;

  const { data: thread } = useQuery<Thread>({
    queryKey: ["/api/discussions", threadId],
    enabled: !!threadId,
  });

  const { data: posts = [], isLoading: postsLoading } = useQuery<Post[]>({
    queryKey: ["/api/discussions", threadId, "posts"],
    enabled: !!threadId,
  });

  const handlePostAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer.trim()) {
      toast({
        title: "Error",
        description: "Please write an answer",
        variant: "destructive",
      });
      return;
    }

    setIsPosting(true);
    try {
      await apiRequest("POST", `/api/discussions/${threadId}/posts`, { content: answer });
      
      queryClient.invalidateQueries({ queryKey: ["/api/discussions", threadId, "posts"] });
      setAnswer("");
      
      toast({
        title: "Success",
        description: "Answer posted successfully!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to post answer. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsPosting(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (!user || !threadId) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => setLocation("/discussions")}
          data-testid="button-back-to-discussions"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Q&A Forum
        </Button>

        {/* Thread Question */}
        {thread && (
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-2xl" data-testid="text-thread-title">
                    {thread.title}
                  </CardTitle>
                  <CardDescription className="mt-2 flex items-center gap-2">
                    {thread.author && (
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs">
                            {getInitials(thread.author.name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-foreground">{thread.author.name}</span>
                      </div>
                    )}
                    <span>•</span>
                    <span>{formatDistanceToNow(new Date(thread.createdAt), { addSuffix: true })}</span>
                    <span>•</span>
                    <span>{thread.viewCount} views</span>
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-foreground whitespace-pre-wrap" data-testid="text-thread-content">
                {thread.content}
              </p>
            </CardContent>
          </Card>
        )}

        <Separator />

        {/* Answers Section */}
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            {posts.length} {posts.length === 1 ? "Answer" : "Answers"}
          </h2>

          {postsLoading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <Card key={i}>
                  <CardContent className="py-6">
                    <div className="h-4 bg-muted animate-pulse rounded w-3/4 mb-2" />
                    <div className="h-4 bg-muted animate-pulse rounded w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No answers yet. Be the first to answer!
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <Card key={post.id} data-testid={`card-post-${post.id}`}>
                  <CardContent className="py-6">
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          data-testid={`button-upvote-${post.id}`}
                        >
                          <ThumbsUp className="h-4 w-4" />
                        </Button>
                        <span className="text-sm font-medium">{post.upvotes}</span>
                        {post.isAcceptedAnswer && (
                          <CheckCircle className="h-5 w-5 text-green-600" data-testid={`icon-accepted-${post.id}`} />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-foreground whitespace-pre-wrap mb-4">{post.content}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          {post.author && (
                            <>
                              <Avatar className="h-6 w-6">
                                <AvatarFallback className="text-xs">
                                  {getInitials(post.author.name)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium text-foreground">{post.author.name}</span>
                              <span>•</span>
                            </>
                          )}
                          <span>{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Post Answer */}
        <Card>
          <CardHeader>
            <CardTitle>Your Answer</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePostAnswer} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="answer">Answer</Label>
                <Textarea
                  id="answer"
                  placeholder="Share your knowledge..."
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  rows={6}
                  data-testid="textarea-answer"
                />
              </div>
              <Button type="submit" disabled={isPosting} data-testid="button-post-answer">
                {isPosting ? "Posting..." : "Post Answer"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
