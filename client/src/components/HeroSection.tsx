import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";

export default function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex items-center pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="space-y-8">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight leading-tight">
              Turn exam anxiety into{" "}
              <span className="bg-gradient-to-r from-primary via-chart-2 to-chart-3 bg-clip-text text-transparent">
                focused confidence
              </span>
            </h1>
            
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl leading-relaxed">
              Adaptive mock tests and insights that fuel growth.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                className="shadow-lg shadow-primary/30 text-base"
                data-testid="button-get-started-hero"
              >
                Get Started Free
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-base"
                data-testid="button-watch-tour"
              >
                <Play className="w-4 h-4 mr-2" />
                Watch 90-sec Tour
              </Button>
            </div>
          </div>

          <div className="relative">
            <div className="relative rounded-xl overflow-hidden shadow-2xl shadow-primary/20 border border-border/50 transform hover:scale-[1.02] transition-transform duration-300">
              <div className="aspect-[4/3] bg-gradient-to-br from-card via-card to-accent p-8">
                <div className="h-full bg-gradient-to-br from-primary/20 via-chart-2/10 to-chart-3/20 rounded-lg flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-card/50 backdrop-blur-sm p-4 rounded-lg border border-border/30">
                        <div className="h-16 bg-gradient-to-t from-primary/40 to-primary/10 rounded"></div>
                      </div>
                      <div className="bg-card/50 backdrop-blur-sm p-4 rounded-lg border border-border/30">
                        <div className="h-20 bg-gradient-to-t from-chart-2/40 to-chart-2/10 rounded"></div>
                      </div>
                      <div className="bg-card/50 backdrop-blur-sm p-4 rounded-lg border border-border/30">
                        <div className="h-12 bg-gradient-to-t from-chart-3/40 to-chart-3/10 rounded"></div>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground font-mono">Dashboard Analytics</div>
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
