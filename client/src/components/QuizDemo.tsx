import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useState, useEffect } from "react";

export default function QuizDemo() {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(30);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 30));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const options = [
    { id: "A", text: "O(n)" },
    { id: "B", text: "O(log n)" },
    { id: "C", text: "O(n²)" },
    { id: "D", text: "O(1)" },
  ];

  return (
    <section className="py-16 md:py-24 bg-accent/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Try 5 real exam questions right here →
          </h2>
          <p className="text-lg text-muted-foreground">
            Experience the authentic exam simulation
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <Card className="p-8 space-y-6">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="text-xs">
                Question 1 of 3
              </Badge>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full border-2 border-chart-4 flex items-center justify-center">
                  <span className="text-sm font-bold text-chart-4">{timeLeft}s</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-6">
                What is the time complexity of binary search?
              </h3>

              <div className="space-y-3">
                {options.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => {
                      setSelectedOption(option.id);
                      console.log(`Selected option: ${option.id}`);
                    }}
                    className={`w-full text-left p-4 rounded-lg border transition-all hover-elevate ${
                      selectedOption === option.id
                        ? "border-primary bg-primary/10"
                        : "border-border bg-card"
                    }`}
                    data-testid={`button-option-${option.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        selectedOption === option.id
                          ? "border-primary bg-primary"
                          : "border-border"
                      }`}>
                        {selectedOption === option.id && (
                          <div className="w-2 h-2 rounded-full bg-primary-foreground"></div>
                        )}
                      </div>
                      <span className="font-medium">{option.id}</span>
                      <span className="text-muted-foreground">{option.text}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </Card>

          <div className="relative">
            <Badge className="absolute -top-3 -right-3 z-10 shadow-lg">
              Live Demo
            </Badge>
            <div className="rounded-xl overflow-hidden border border-border shadow-xl">
              <div className="aspect-[4/3] bg-gradient-to-br from-card to-accent p-6">
                <div className="h-full bg-card/50 backdrop-blur-sm rounded-lg border border-border/30 p-6 space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="h-4 w-24 bg-muted rounded"></div>
                    <div className="h-8 w-8 rounded-full bg-chart-4/30"></div>
                  </div>
                  <div className="h-6 w-3/4 bg-muted rounded"></div>
                  <div className="space-y-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="h-12 bg-muted/50 rounded"></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
