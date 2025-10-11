import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Check } from "lucide-react";
import { useState } from "react";

export default function EmailSignupSection() {
  const [email, setEmail] = useState("");
  const [agreed, setAgreed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Email submitted:", email, "Agreed:", agreed);
  };

  return (
    <section className="py-16 md:py-24 bg-accent/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center space-y-8">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Get a free GATE-style question every day
            </h2>
            <p className="text-lg text-muted-foreground">
              Sharpen your instincts in under 2 minutes—straight to your inbox.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1"
                required
                data-testid="input-email"
              />
              <Button
                type="submit"
                className="shadow-lg shadow-primary/30"
                data-testid="button-send-question"
              >
                Send Today's Question
              </Button>
            </div>

            <div className="flex items-start gap-2 justify-center">
              <Checkbox
                id="terms"
                checked={agreed}
                onCheckedChange={(checked) => setAgreed(checked as boolean)}
                data-testid="checkbox-terms"
              />
              <label
                htmlFor="terms"
                className="text-sm text-muted-foreground cursor-pointer"
              >
                I'm okay with occasional product tips.
              </label>
            </div>

            <p className="text-sm text-muted-foreground">
              Zero spam. Unsubscribe anytime.
            </p>
          </form>

          <div className="flex flex-wrap items-center justify-center gap-6 pt-4">
            <div className="flex items-center gap-2 text-sm">
              <Check className="w-4 h-4 text-primary" />
              <span>27k+ active learners</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Check className="w-4 h-4 text-primary" />
              <span>Daily brain training</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Check className="w-4 h-4 text-primary" />
              <span>Free forever</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
