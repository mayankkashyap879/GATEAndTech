import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { Clock, FileText, Plus, Trophy } from "lucide-react";
import type { Test } from "@shared/schema";

export default function Tests() {
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [tierFilter, setTierFilter] = useState<string>("all");

  const { data: tests, isLoading } = useQuery<Test[]>({
    queryKey: ["/api/tests", statusFilter, tierFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (tierFilter !== "all") params.append("isPro", tierFilter);
      const response = await fetch(`/api/tests?${params}`);
      if (!response.ok) throw new Error("Failed to fetch tests");
      return response.json();
    },
  });

  const canCreateTest = user && (user.role === "admin" || user.role === "moderator");

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Mock Tests</h1>
          <p className="text-muted-foreground mt-2">Practice with GATE-style mock tests</p>
        </div>
        {canCreateTest && (
          <Link href="/tests/new">
            <Button data-testid="button-create-test">
              <Plus className="mr-2 h-4 w-4" />
              Create Test
            </Button>
          </Link>
        )}
      </div>

      <div className="flex gap-4 mb-6">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]" data-testid="select-status-filter">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>

        <Select value={tierFilter} onValueChange={setTierFilter}>
          <SelectTrigger className="w-[180px]" data-testid="select-tier-filter">
            <SelectValue placeholder="Tier" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tiers</SelectItem>
            <SelectItem value="false">Free</SelectItem>
            <SelectItem value="true">Pro</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tests?.map((test) => (
            <Card key={test.id} className="hover-elevate" data-testid={`card-test-${test.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-xl" data-testid={`text-test-title-${test.id}`}>{test.title}</CardTitle>
                  {test.isPro && (
                    <Badge variant="default" data-testid={`badge-pro-${test.id}`}>
                      <Trophy className="mr-1 h-3 w-3" />
                      Pro
                    </Badge>
                  )}
                </div>
                {test.description && (
                  <CardDescription className="line-clamp-2" data-testid={`text-description-${test.id}`}>
                    {test.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge variant="outline" data-testid={`badge-duration-${test.id}`}>
                    <Clock className="mr-1 h-3 w-3" />
                    {test.duration} min
                  </Badge>
                  <Badge variant="outline" data-testid={`badge-marks-${test.id}`}>
                    <FileText className="mr-1 h-3 w-3" />
                    {test.totalMarks} marks
                  </Badge>
                  <Badge
                    variant={
                      test.status === "published"
                        ? "default"
                        : test.status === "draft"
                        ? "secondary"
                        : "outline"
                    }
                    data-testid={`badge-status-${test.id}`}
                  >
                    {test.status}
                  </Badge>
                </div>
              </CardContent>
              <CardFooter className="flex gap-2">
                <Link href={`/tests/${test.id}`}>
                  <Button variant="default" className="flex-1" data-testid={`button-start-test-${test.id}`}>
                    Start Test
                  </Button>
                </Link>
                {canCreateTest && (
                  <Link href={`/tests/${test.id}/edit`}>
                    <Button variant="outline" size="icon" data-testid={`button-edit-test-${test.id}`}>
                      <FileText className="h-4 w-4" />
                    </Button>
                  </Link>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {!isLoading && tests?.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground" data-testid="text-no-tests">No tests found</p>
          {canCreateTest && (
            <Link href="/tests/new">
              <Button className="mt-4" data-testid="button-create-first-test">
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Test
              </Button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
