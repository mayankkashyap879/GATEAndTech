import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, Users, Video, Eye } from "lucide-react";

export default function YouTubeSection() {
  return (
    <section className="py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Learn with Our YouTube Channel
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Join thousands of GATE aspirants on our YouTube channel for free tutorials, tips and comprehensive preparation strategies.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <Card className="p-8 text-center hover-elevate">
            <Users className="w-8 h-8 text-primary mx-auto mb-4" />
            <div className="text-4xl font-bold text-primary mb-2">3.6K+</div>
            <div className="text-sm text-muted-foreground">Subscribers</div>
          </Card>
          
          <Card className="p-8 text-center hover-elevate">
            <Video className="w-8 h-8 text-primary mx-auto mb-4" />
            <div className="text-4xl font-bold text-primary mb-2">460+</div>
            <div className="text-sm text-muted-foreground">Videos</div>
          </Card>
          
          <Card className="p-8 text-center hover-elevate">
            <Eye className="w-8 h-8 text-primary mx-auto mb-4" />
            <div className="text-4xl font-bold text-primary mb-2">160K+</div>
            <div className="text-sm text-muted-foreground">Views</div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h3 className="text-2xl font-bold">Free GATE Preparation Content</h3>
            <p className="text-muted-foreground">
              Our channel offers comprehensive tutorials, step-by-step solving strategies, discussions of previous year questions and expert tips to help you crack GATE confidently.
            </p>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-sm">Weekly new video uploads</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-sm">Topic-wise detailed explanations</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-sm">Solutions to previous year questions</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-sm">Study tips and strategies</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-sm">Live doubt-solving sessions</span>
              </div>
            </div>

            <Button className="shadow-lg shadow-primary/30" data-testid="button-subscribe">
              Subscribe to Channel
            </Button>
          </div>

          <div className="relative">
            <div className="aspect-video rounded-xl overflow-hidden border border-border shadow-xl">
              <div className="w-full h-full bg-gradient-to-br from-accent to-card flex items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
                    <Play className="w-8 h-8 text-primary" />
                  </div>
                  <div className="text-sm text-muted-foreground">YouTube Video Player</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Play({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}
