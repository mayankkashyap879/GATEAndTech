import { Link } from "wouter";
import { Github, Twitter, Linkedin, Mail } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-3">
            <h3 className="text-lg font-bold">GATE And Tech</h3>
            <p className="text-sm text-muted-foreground">
              Your comprehensive exam preparation platform for GATE aspirants.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="font-semibold">Quick Links</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/login" className="hover:text-foreground transition-colors" data-testid="link-footer-login">
                  Login
                </Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-foreground transition-colors" data-testid="link-footer-register">
                  Sign Up
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-foreground transition-colors" data-testid="link-footer-about">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-foreground transition-colors" data-testid="link-footer-contact">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div className="space-y-3">
            <h4 className="font-semibold">Resources</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/help" className="hover:text-foreground transition-colors" data-testid="link-footer-help">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-foreground transition-colors" data-testid="link-footer-privacy">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-foreground transition-colors" data-testid="link-footer-terms">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-foreground transition-colors" data-testid="link-footer-faq">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Social Links */}
          <div className="space-y-3">
            <h4 className="font-semibold">Connect With Us</h4>
            <div className="flex gap-3">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="h-9 w-9 flex items-center justify-center rounded-md border hover-elevate"
                data-testid="link-footer-github"
                aria-label="GitHub"
              >
                <Github className="h-4 w-4" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="h-9 w-9 flex items-center justify-center rounded-md border hover-elevate"
                data-testid="link-footer-twitter"
                aria-label="Twitter"
              >
                <Twitter className="h-4 w-4" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="h-9 w-9 flex items-center justify-center rounded-md border hover-elevate"
                data-testid="link-footer-linkedin"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-4 w-4" />
              </a>
              <a
                href="mailto:support@gateandtech.com"
                className="h-9 w-9 flex items-center justify-center rounded-md border hover-elevate"
                data-testid="link-footer-email"
                aria-label="Email"
              >
                <Mail className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-6 border-t text-center text-sm text-muted-foreground">
          <p>© {currentYear} GATE And Tech. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
