import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

export default function TestimonialsSection() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const testimonials = [
    {
      name: "Priya S.",
      initials: "PS",
      exam: "GATE EE 2025 AIR 112",
      percentile: "+14 percentile",
      quote: "The mock felt scarier than the real thing—so the actual exam was a breeze.",
    },
    {
      name: "Rahul K.",
      initials: "RK",
      exam: "GATE CS 2025 AIR 89",
      percentile: "+18 percentile",
      quote: "The AI analytics helped me identify my weak areas and improve systematically.",
    },
    {
      name: "Anjali M.",
      initials: "AM",
      exam: "GATE ME 2025 AIR 156",
      percentile: "+12 percentile",
      quote: "Community support and mentor guidance made all the difference in my preparation.",
    },
  ];

  const nextTestimonial = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    console.log("Next testimonial");
  };

  const prevTestimonial = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
    console.log("Previous testimonial");
  };

  const currentTestimonial = testimonials[currentIndex];

  return (
    <section className="py-16 md:py-24 bg-accent/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Success Stories</h2>
          <p className="text-lg text-muted-foreground">
            Real results from real students
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <Card className="p-8 md:p-12 hover-elevate">
            <div className="flex flex-col items-center text-center space-y-6">
              <Avatar className="w-16 h-16 bg-primary text-primary-foreground text-xl font-semibold">
                <AvatarFallback>{currentTestimonial.initials}</AvatarFallback>
              </Avatar>

              <div>
                <h4 className="text-xl font-semibold mb-1">{currentTestimonial.name}</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  {currentTestimonial.exam}
                </p>
                <Badge className="shadow-sm">{currentTestimonial.percentile}</Badge>
              </div>

              <blockquote className="text-lg md:text-xl text-muted-foreground italic max-w-2xl">
                "{currentTestimonial.quote}"
              </blockquote>

              <div className="flex items-center gap-4 pt-4">
                <button
                  onClick={prevTestimonial}
                  className="w-10 h-10 rounded-full border border-border hover-elevate flex items-center justify-center"
                  data-testid="button-prev-testimonial"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <div className="flex gap-2">
                  {testimonials.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setCurrentIndex(index);
                        console.log(`Navigate to testimonial ${index}`);
                      }}
                      className={`w-2 h-2 rounded-full transition-all ${
                        index === currentIndex
                          ? "bg-primary w-6"
                          : "bg-muted-foreground/30"
                      }`}
                      data-testid={`button-dot-${index}`}
                    />
                  ))}
                </div>

                <button
                  onClick={nextTestimonial}
                  className="w-10 h-10 rounded-full border border-border hover-elevate flex items-center justify-center"
                  data-testid="button-next-testimonial"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}
