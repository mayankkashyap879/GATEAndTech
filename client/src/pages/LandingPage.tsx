import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import HeroSection from "@/components/HeroSection";
import YouTubeSection from "@/components/YouTubeSection";
import QuizDemo from "@/components/QuizDemo";
import FeaturesSection from "@/components/FeaturesSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import PricingSection from "@/components/PricingSection";
import FAQSection from "@/components/FAQSection";
import EmailSignupSection from "@/components/EmailSignupSection";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main>
        <HeroSection />
        <YouTubeSection />
        <QuizDemo />
        <FeaturesSection />
        <TestimonialsSection />
        <PricingSection />
        <FAQSection />
        <EmailSignupSection />
      </main>
      <Footer />
    </div>
  );
}
