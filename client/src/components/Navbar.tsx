import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { useState } from "react";

function Logo() {
  return (
    <svg className="w-8 h-8" viewBox="0 0 500 500" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M250 50C138.954 50 50 138.954 50 250C50 361.046 138.954 450 250 450C361.046 450 450 361.046 450 250H350C350 305.228 305.228 350 250 350C194.772 350 150 305.228 150 250C150 194.772 194.772 150 250 150V50Z"
        fill="currentColor"
        className="text-primary"
      />
      <path
        d="M450 200H250V300H450V200Z"
        fill="currentColor"
        className="text-primary"
      />
    </svg>
  );
}

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <Logo />
            <span className="text-lg font-semibold">GATE And Tech</span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <a
              href="#product"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              data-testid="link-product"
            >
              Product
            </a>
            <a
              href="#pricing"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              data-testid="link-pricing"
            >
              Pricing
            </a>
            <a
              href="#blog"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              data-testid="link-blog"
            >
              Blog
            </a>
            <a
              href="#login"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              data-testid="link-login"
            >
              Login
            </a>
          </div>

          <div className="hidden md:block">
            <Button
              className="shadow-lg shadow-primary/30"
              data-testid="button-get-started-nav"
            >
              Get Started
            </Button>
          </div>

          <button
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            data-testid="button-mobile-menu"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border/50">
            <div className="flex flex-col gap-4">
              <a href="#product" className="text-sm text-muted-foreground" data-testid="link-product-mobile">
                Product
              </a>
              <a href="#pricing" className="text-sm text-muted-foreground" data-testid="link-pricing-mobile">
                Pricing
              </a>
              <a href="#blog" className="text-sm text-muted-foreground" data-testid="link-blog-mobile">
                Blog
              </a>
              <a href="#login" className="text-sm text-muted-foreground" data-testid="link-login-mobile">
                Login
              </a>
              <Button className="w-full" data-testid="button-get-started-mobile">
                Get Started
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
