import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Shield, CreditCard, RefreshCw, BookOpen, Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";

interface TestSeries {
  id: string;
  title: string;
  description: string;
  price: number;
  validityDays: number;
  tier: string;
  isActive: boolean;
}

export default function PricingSection() {
  const [, setLocation] = useLocation();

  const { data: testSeriesList } = useQuery<TestSeries[]>({
    queryKey: ["/api/test-series"],
    enabled: true,
  });

  // Get top 3 test series for display (1 free, 2 premium)
  const displaySeries = testSeriesList
    ?.filter((ts) => ts.isActive)
    .sort((a, b) => {
      // Free tier first, then by price
      if (a.tier === "free" && b.tier !== "free") return -1;
      if (a.tier !== "free" && b.tier === "free") return 1;
      return a.price - b.price;
    })
    .slice(0, 3) || [];

  return (
    <section id="pricing" className="py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Choose Your Test Series
          </h2>
          <p className="text-lg text-muted-foreground">
            One-time purchase with flexible validity periods
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto mb-8">
          {displaySeries.length > 0 ? (
            displaySeries.map((series, index) => (
              <Card
                key={series.id}
                className={`p-8 relative hover-elevate ${
                  series.tier === "pro" ? "border-primary shadow-xl shadow-primary/20" : ""
                }`}
                data-testid={`card-pricing-${series.id}`}
              >
                {series.tier === "pro" && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 shadow-lg">
                    Most Popular
                  </Badge>
                )}

                <div className="space-y-6">
                  <div>
                    <h3 className="text-2xl font-bold mb-1">{series.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">{series.description}</p>
                  </div>

                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold">
                      {series.tier === "free" ? "Free" : `₹${series.price}`}
                    </span>
                    {series.tier !== "free" && (
                      <span className="text-muted-foreground">one-time</span>
                    )}
                  </div>

                  <div className="space-y-3">
                    {series.tier !== "free" && (
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4 text-primary" />
                        <span>{series.validityDays} days access</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm">
                      <BookOpen className="w-4 h-4 text-primary" />
                      <span>Full-length mock tests</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-primary" />
                      <span>Detailed analytics</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-primary" />
                      <span>GATE-authentic interface</span>
                    </div>
                  </div>

                  <Button
                    className={`w-full ${series.tier === "pro" ? "shadow-lg shadow-primary/30" : ""}`}
                    variant={series.tier === "pro" ? "default" : "outline"}
                    onClick={() => setLocation("/shop")}
                    data-testid={`button-view-series-${series.id}`}
                  >
                    {series.tier === "free" ? "Get Started" : "View Details"}
                  </Button>
                </div>
              </Card>
            ))
          ) : (
            <div className="col-span-3 text-center py-8 text-muted-foreground">
              Test series coming soon...
            </div>
          )}
        </div>

        <div className="text-center mb-6">
          <Button variant="outline" size="lg" onClick={() => setLocation("/shop")} data-testid="button-view-all">
            View All Test Series
          </Button>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            <span>No hidden fees</span>
          </div>
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            <span>Razorpay secure</span>
          </div>
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            <span>7-day money-back guarantee</span>
          </div>
        </div>
      </div>
    </section>
  );
}
