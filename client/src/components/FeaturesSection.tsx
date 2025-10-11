import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, BarChart3, Users } from "lucide-react";

export default function FeaturesSection() {
  const features = [
    {
      icon: FileText,
      badge: "120+ Mock Tests",
      title: "Simulate the real exam",
      description: "Feel the pressure-free practice of full-length, timed papers that mirror the exact interface you'll face on test day.",
      imagePosition: "right" as const,
    },
    {
      icon: BarChart3,
      badge: "AI-Powered Analytics",
      title: "See where to focus next",
      description: "Our adaptive dashboard pinpoints weak topics, predicts your percentile, and builds a personalized revision path in one click.",
      imagePosition: "left" as const,
    },
    {
      icon: Users,
      badge: "27k+ Active Community",
      title: "Stay motivated with peers",
      description: "Earn streak badges, join topic rooms, and discuss tricky questions with mentors who've already cracked the exam.",
      imagePosition: "right" as const,
    },
  ];

  return (
    <section className="py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Learn • Practice • Belong
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Transform your exam preparation with our three-pillar approach to focused growth
          </p>
        </div>

        <div className="space-y-24">
          {features.map((feature, index) => (
            <div
              key={index}
              className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center ${
                feature.imagePosition === "left" ? "lg:flex-row-reverse" : ""
              }`}
            >
              <div className={`space-y-6 ${feature.imagePosition === "left" ? "lg:order-2" : ""}`}>
                <div className="inline-flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <Badge className="shadow-sm">{feature.badge}</Badge>
                </div>
                
                <h3 className="text-2xl md:text-3xl font-bold">{feature.title}</h3>
                
                <p className="text-lg text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>

              <div className={feature.imagePosition === "left" ? "lg:order-1" : ""}>
                <Card className="overflow-hidden hover-elevate border-border/50">
                  <div className="aspect-[4/3] bg-gradient-to-br from-accent via-card to-muted p-6">
                    <div className="h-full bg-card/50 backdrop-blur-sm rounded-lg border border-border/30 p-6">
                      {index === 0 && (
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <div className="h-4 w-32 bg-muted rounded"></div>
                            <div className="h-8 w-8 rounded-full bg-chart-4/30"></div>
                          </div>
                          <div className="h-6 w-2/3 bg-muted rounded"></div>
                          <div className="grid grid-cols-2 gap-3 pt-4">
                            {[1, 2, 3, 4].map((i) => (
                              <div key={i} className="h-16 bg-muted/50 rounded"></div>
                            ))}
                          </div>
                        </div>
                      )}
                      {index === 1 && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-3 gap-3">
                            {[20, 28, 16].map((h, i) => (
                              <div key={i} className="flex flex-col justify-end h-32">
                                <div
                                  className="bg-gradient-to-t from-primary/40 to-primary/10 rounded"
                                  style={{ height: `${h * 4}px` }}
                                ></div>
                              </div>
                            ))}
                          </div>
                          <div className="space-y-2">
                            <div className="h-3 w-full bg-muted rounded"></div>
                            <div className="h-3 w-3/4 bg-muted rounded"></div>
                          </div>
                        </div>
                      )}
                      {index === 2 && (
                        <div className="space-y-3">
                          {[1, 2, 3].map((i) => (
                            <div key={i} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                              <div className="w-10 h-10 rounded-full bg-primary/20"></div>
                              <div className="flex-1 space-y-2">
                                <div className="h-3 w-2/3 bg-muted rounded"></div>
                                <div className="h-2 w-1/2 bg-muted/60 rounded"></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
