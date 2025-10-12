import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Calendar, Clock, CheckCircle, XCircle, BookOpen } from "lucide-react";
import { useLocation } from "wouter";
import { formatDistanceToNow } from "date-fns";

interface TestSeries {
  id: string;
  title: string;
  description: string;
  price: number;
  validityDays: number;
  tier: string;
  isActive: boolean;
}

interface UserPurchase {
  id: string;
  userId: string;
  testSeriesId: string;
  purchaseDate: string;
  expiryDate: string;
  status: "active" | "expired";
  transactionId: string | null;
}

interface PurchaseWithSeries extends UserPurchase {
  testSeries?: TestSeries;
}

export default function MyPurchases() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  const { data: purchases, isLoading, error } = useQuery<PurchaseWithSeries[]>({
    queryKey: ["/api/payments/purchases"],
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) {
    setLocation("/login");
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" data-testid="loader-purchases" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-destructive text-lg mb-4" data-testid="text-error">
            Failed to load your purchases
          </p>
          <Button onClick={() => window.location.reload()} data-testid="button-retry">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const activePurchases = purchases?.filter((p) => p.status === "active") || [];
  const expiredPurchases = purchases?.filter((p) => p.status === "expired") || [];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2" data-testid="text-purchases-title">My Purchases</h1>
          <p className="text-muted-foreground text-lg" data-testid="text-purchases-subtitle">
            Manage your test series subscriptions
          </p>
        </div>

        {activePurchases.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
              <Badge className="text-base" data-testid="badge-active-section">
                Active Subscriptions
              </Badge>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activePurchases.map((purchase) => {
                const testSeries = purchase.testSeries;
                if (!testSeries) return null;

                const expiryDate = new Date(purchase.expiryDate);
                const purchaseDate = new Date(purchase.purchaseDate);
                const daysLeft = Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

                return (
                  <Card
                    key={purchase.id}
                    className="hover-elevate flex flex-col border-primary/50"
                    data-testid={`card-purchase-${purchase.id}`}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <CardTitle className="text-xl" data-testid={`text-title-${purchase.id}`}>
                          {testSeries.title}
                        </CardTitle>
                        <Badge variant="default" data-testid={`badge-status-${purchase.id}`}>
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Active
                        </Badge>
                      </div>
                      <CardDescription data-testid={`text-description-${purchase.id}`}>
                        {testSeries.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span data-testid={`text-purchase-date-${purchase.id}`}>
                          Purchased {formatDistanceToNow(purchaseDate, { addSuffix: true })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span
                          className={daysLeft <= 7 ? "text-orange-500 font-medium" : ""}
                          data-testid={`text-expiry-${purchase.id}`}
                        >
                          {daysLeft > 0 ? `${daysLeft} days remaining` : "Expires today"}
                        </span>
                      </div>
                      <div className="pt-2 text-sm text-muted-foreground">
                        Expires on {expiryDate.toLocaleDateString()}
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button
                        className="w-full"
                        onClick={() => setLocation("/tests")}
                        data-testid={`button-view-tests-${purchase.id}`}
                      >
                        <BookOpen className="w-4 h-4 mr-2" />
                        View Tests
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {expiredPurchases.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
              <Badge variant="secondary" className="text-base" data-testid="badge-expired-section">
                Expired Subscriptions
              </Badge>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {expiredPurchases.map((purchase) => {
                const testSeries = purchase.testSeries;
                if (!testSeries) return null;

                const expiryDate = new Date(purchase.expiryDate);

                return (
                  <Card
                    key={purchase.id}
                    className="hover-elevate flex flex-col opacity-75"
                    data-testid={`card-purchase-${purchase.id}`}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <CardTitle className="text-xl" data-testid={`text-title-${purchase.id}`}>
                          {testSeries.title}
                        </CardTitle>
                        <Badge variant="secondary" data-testid={`badge-status-${purchase.id}`}>
                          <XCircle className="w-3 h-3 mr-1" />
                          Expired
                        </Badge>
                      </div>
                      <CardDescription data-testid={`text-description-${purchase.id}`}>
                        {testSeries.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1">
                      <div className="text-sm text-muted-foreground">
                        Expired on {expiryDate.toLocaleDateString()}
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => setLocation("/shop")}
                        data-testid={`button-renew-${purchase.id}`}
                      >
                        Renew Subscription
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {!purchases || purchases.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg mb-4" data-testid="text-no-purchases">
              You haven't purchased any test series yet
            </p>
            <Button onClick={() => setLocation("/shop")} data-testid="button-browse-shop">
              Browse Test Series
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
