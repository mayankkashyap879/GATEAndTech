import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, ShoppingCart, Clock, CheckCircle, BookOpen, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";

interface TestSeries {
  id: string;
  title: string;
  description: string;
  price: number;
  validityDays: number;
  tier: string;
  isActive: boolean;
  testCount?: number;
}

interface UserPurchase {
  id: string;
  testSeriesId: string;
  expiryDate: string;
  status: string;
}

export default function Shop() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [purchasingSeriesId, setPurchasingSeriesId] = useState<string | null>(null);

  const { data: testSeriesList, isLoading: isLoadingTestSeries, error: testSeriesError } = useQuery<TestSeries[]>({
    queryKey: ["/api/test-series"],
    enabled: true,
  });

  const { data: purchases, error: purchasesError } = useQuery<UserPurchase[]>({
    queryKey: ["/api/payments/purchases"],
    enabled: isAuthenticated,
  });

  const { data: razorpayConfig, isLoading: isLoadingRazorpay, error: razorpayError } = useQuery<{ key: string }>({
    queryKey: ["/api/payments/key"],
    enabled: true,
  });

  useEffect(() => {
    if (razorpayError) {
      toast({
        title: "Payment System Error",
        description: "Payment system is currently unavailable",
        variant: "destructive",
      });
    }
  }, [razorpayError, toast]);

  useEffect(() => {
    if (purchasesError && isAuthenticated) {
      toast({
        title: "Error Loading Purchases",
        description: "Unable to load your purchase history",
        variant: "destructive",
      });
    }
  }, [purchasesError, isAuthenticated, toast]);

  const handlePurchase = async (testSeries: TestSeries) => {
    if (!isAuthenticated) {
      setLocation("/login");
      return;
    }

    if (!razorpayConfig?.key) {
      toast({
        title: "Payment System Unavailable",
        description: "Unable to process payments at this time. Please try again later.",
        variant: "destructive",
      });
      return;
    }

    setPurchasingSeriesId(testSeries.id);

    try {
      const response = await apiRequest("POST", "/api/payments/create-order", {
        testSeriesId: testSeries.id,
        validityDays: testSeries.validityDays,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create order");
      }

      const data = await response.json();
      const { orderId, amount } = data;

      if (!orderId || !amount) {
        throw new Error("Invalid order details received");
      }

      const options = {
        key: razorpayConfig?.key || "",
        amount,
        currency: "INR",
        name: "GATE And Tech",
        description: testSeries.title,
        order_id: orderId,
        handler: async (response: any) => {
          try {
            const verifyResponse = await apiRequest("POST", "/api/payments/verify", response);

            if (!verifyResponse.ok) {
              const errorData = await verifyResponse.json();
              throw new Error(errorData.error || "Verification failed");
            }

            toast({
              title: "Purchase Successful!",
              description: `You now have access to ${testSeries.title}`,
            });

            setLocation("/my-purchases");
          } catch (error: any) {
            toast({
              title: "Verification Failed",
              description: error.message || "Please contact support",
              variant: "destructive",
            });
          }
        },
        prefill: {
          name: user?.name,
          email: user?.email,
        },
        theme: {
          color: "#10b981",
        },
      };

      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();
    } catch (error: any) {
      toast({
        title: "Purchase Failed",
        description: error.message || "Unable to initiate payment",
        variant: "destructive",
      });
    } finally {
      setPurchasingSeriesId(null);
    }
  };

  const isPurchased = (testSeriesId: string) => {
    return purchases?.some(
      (p) => p.testSeriesId === testSeriesId && p.status === "active"
    );
  };

  if (isLoadingTestSeries || isLoadingRazorpay) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" data-testid="loader-shop" />
      </div>
    );
  }

  if (testSeriesError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-destructive text-lg mb-4" data-testid="text-error">
            Failed to load test series
          </p>
          <Button onClick={() => window.location.reload()} data-testid="button-retry">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const activeTestSeries = testSeriesList?.filter((ts) => ts.isActive) || [];
  const freeTestSeries = activeTestSeries.filter((ts) => ts.tier === "free");
  const paidTestSeries = activeTestSeries.filter((ts) => ts.tier !== "free");

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2" data-testid="text-shop-title">Test Series Shop</h1>
          <p className="text-muted-foreground text-lg" data-testid="text-shop-subtitle">
            Choose from our comprehensive test series to ace your GATE exam
          </p>
        </div>

        {(razorpayError || !razorpayConfig?.key) && (
          <Alert variant="destructive" className="mb-6" data-testid="alert-payment-unavailable">
            <XCircle className="h-4 w-4" />
            <AlertTitle>Payment System Unavailable</AlertTitle>
            <AlertDescription>
              Our payment system is currently unavailable. You can browse test series, but purchases are temporarily disabled.
              Please try again later.
            </AlertDescription>
          </Alert>
        )}

        {freeTestSeries.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
              <Badge variant="secondary" className="text-base" data-testid="badge-free-section">
                Free Test Series
              </Badge>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {freeTestSeries.map((testSeries) => (
                <Card key={testSeries.id} className="hover-elevate flex flex-col" data-testid={`card-test-series-${testSeries.id}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <CardTitle className="text-xl" data-testid={`text-title-${testSeries.id}`}>
                        {testSeries.title}
                      </CardTitle>
                      <Badge variant="outline" className="shrink-0" data-testid={`badge-tier-${testSeries.id}`}>
                        Free
                      </Badge>
                    </div>
                    <CardDescription data-testid={`text-description-${testSeries.id}`}>
                      {testSeries.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <BookOpen className="w-4 h-4" />
                        <span data-testid={`text-test-count-${testSeries.id}`}>
                          {testSeries.testCount || 0} Tests
                        </span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button
                      className="w-full"
                      variant="outline"
                      onClick={() => setLocation("/tests")}
                      data-testid={`button-view-tests-${testSeries.id}`}
                    >
                      View Tests
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        )}

        {paidTestSeries.length > 0 && (
          <div>
            <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
              <Badge className="text-base" data-testid="badge-premium-section">
                Premium Test Series
              </Badge>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paidTestSeries.map((testSeries) => {
                const purchased = isPurchased(testSeries.id);
                const isPurchasing = purchasingSeriesId === testSeries.id;

                return (
                  <Card
                    key={testSeries.id}
                    className={`hover-elevate flex flex-col ${
                      testSeries.tier === "pro" ? "border-primary" : ""
                    }`}
                    data-testid={`card-test-series-${testSeries.id}`}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <CardTitle className="text-xl" data-testid={`text-title-${testSeries.id}`}>
                          {testSeries.title}
                        </CardTitle>
                        <Badge
                          variant={testSeries.tier === "pro" ? "default" : "secondary"}
                          data-testid={`badge-tier-${testSeries.id}`}
                        >
                          {testSeries.tier === "pro" ? "Pro" : "Premium"}
                        </Badge>
                      </div>
                      <CardDescription data-testid={`text-description-${testSeries.id}`}>
                        {testSeries.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1">
                      <div className="space-y-3">
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-bold" data-testid={`text-price-${testSeries.id}`}>
                            ₹{testSeries.price}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span data-testid={`text-validity-${testSeries.id}`}>
                              {testSeries.validityDays} days
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <BookOpen className="w-4 h-4" />
                            <span data-testid={`text-test-count-${testSeries.id}`}>
                              {testSeries.testCount || 0} Tests
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      {purchased ? (
                        <Button
                          className="w-full"
                          variant="outline"
                          onClick={() => setLocation("/my-purchases")}
                          data-testid={`button-view-purchase-${testSeries.id}`}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Purchased
                        </Button>
                      ) : (
                        <Button
                          className="w-full"
                          onClick={() => handlePurchase(testSeries)}
                          disabled={isPurchasing || !razorpayConfig?.key}
                          data-testid={`button-purchase-${testSeries.id}`}
                        >
                          {isPurchasing ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Processing...
                            </>
                          ) : !razorpayConfig?.key ? (
                            <>
                              <XCircle className="w-4 h-4 mr-2" />
                              Payment Unavailable
                            </>
                          ) : (
                            <>
                              <ShoppingCart className="w-4 h-4 mr-2" />
                              Purchase Now
                            </>
                          )}
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {activeTestSeries.length === 0 && (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg" data-testid="text-no-series">
              No test series available at the moment
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
