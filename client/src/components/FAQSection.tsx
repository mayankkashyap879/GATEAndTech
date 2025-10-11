import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function FAQSection() {
  const faqs = [
    {
      question: "How close are your mocks to the actual exam?",
      answer: "Our mock tests are designed to closely mirror the actual GATE exam interface, difficulty level, and question patterns. They are created by experts who have analyzed years of GATE papers to ensure maximum authenticity.",
    },
    {
      question: "Is the free plan really free forever?",
      answer: "Yes! The free plan gives you lifetime access to 30 sample tests, basic analytics, and community features. There are no time limits or hidden charges.",
    },
    {
      question: "Can I reset a test and try again?",
      answer: "Absolutely! You can reset and retake any mock test as many times as you want. This helps you practice until you're completely comfortable with the material.",
    },
    {
      question: "What happens to my progress if I upgrade?",
      answer: "All your progress, test history, and analytics are preserved when you upgrade. You'll continue right where you left off with access to additional premium features.",
    },
    {
      question: "Do you offer doubt-solving sessions?",
      answer: "Yes! Pro members get priority access to our doubt-solving sessions where mentors who have cleared GATE help clarify concepts and solve tricky questions.",
    },
    {
      question: "How does the refund work?",
      answer: "We offer a 7-day money-back guarantee. If you're not satisfied with the Pro plan for any reason within the first 7 days, contact us for a full refund—no questions asked.",
    },
  ];

  return (
    <section className="py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-muted-foreground">
            Everything you need to know about getting started
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="border border-border rounded-lg px-6 hover-elevate"
              >
                <AccordionTrigger className="text-left hover:no-underline">
                  <span className="font-semibold">{faq.question}</span>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
