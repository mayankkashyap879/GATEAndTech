import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Shield, CreditCard, RefreshCw } from "lucide-react";

export default function PricingSection() {
  const plans = [
    {
      name: "Starter",
      subtitle: "Perfect for getting started",
      price: "₹0",
      period: "Forever Free",
      features: [
        "Unlimited practice on 30 sample tests",
        "Basic analytics dashboard",
        "Peer discussion access",
        "Progress tracking",
        "Mobile app access",
      ],
      cta: "Get Started Free",
      popular: false,
    },
    {
      name: "Pro Test-Series Pack",
      subtitle: "Complete exam preparation",
      price: "₹999",
      period: "per year",
      features: [
        "120+ full-length mock tests",
        "Adaptive analytics & AI insights",
        "Topic-level drilling exercises",
        "Mentor priority replies",
        "Streak rewards & gamification",
        "Detailed performance reports",
        "Exclusive study materials",
        "24/7 doubt solving support",
      ],
      cta: "Upgrade to Pro",
      popular: true,
    },
  ];

  return (
    <section id="pricing" className="py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Choose Your Growth Path
          </h2>
          <p className="text-lg text-muted-foreground">
            Start free, upgrade when you're ready to accelerate
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto mb-8">
          {plans.map((plan, index) => (
            <Card
              key={index}
              className={`p-8 relative hover-elevate ${
                plan.popular ? "border-primary shadow-xl shadow-primary/20" : ""
              }`}
            >
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 shadow-lg">
                  Most Popular
                </Badge>
              )}

              <div className="space-y-6">
                <div>
                  <h3 className="text-2xl font-bold mb-1">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground">{plan.subtitle}</p>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">/ {plan.period}</span>
                </div>

                <ul className="space-y-3">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className={`w-full ${plan.popular ? "shadow-lg shadow-primary/30" : ""}`}
                  variant={plan.popular ? "default" : "outline"}
                  data-testid={`button-${plan.name.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  {plan.cta}
                </Button>
              </div>
            </Card>
          ))}
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
