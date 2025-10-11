import { Button } from "@/components/ui/button";
import { Menu, User, LogOut } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useViewAsRole } from "@/contexts/ViewAsRoleContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

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
  const { user, isAuthenticated, logout } = useAuth();
  const { effectiveRole } = useViewAsRole();
  const [, setLocation] = useLocation();

  const handleLogout = async () => {
    await logout();
    setLocation("/");
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <Logo />
              <span className="text-lg font-semibold">GATE And Tech</span>
            </div>
          </Link>

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
            {!isAuthenticated && (
              <Link href="/login" data-testid="link-login">
                <span className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                  Login
                </span>
              </Link>
            )}
          </div>

          <div className="hidden md:flex items-center gap-2">
            {isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" data-testid="button-user-menu">
                    <Avatar>
                      <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>
                    {user.name}
                    <p className="text-xs font-normal text-muted-foreground">{user.email}</p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setLocation("/dashboard")} data-testid="menu-dashboard">
                    Dashboard
                  </DropdownMenuItem>
                  {(effectiveRole === "admin" || effectiveRole === "moderator") && (
                    <DropdownMenuItem onClick={() => setLocation("/questions")} data-testid="menu-questions">
                      Question Bank
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => setLocation("/discussions")} data-testid="menu-discussions">
                    Q&A Forum
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setLocation("/tests")} data-testid="menu-tests">
                    My Tests
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setLocation("/analytics")} data-testid="menu-analytics">
                    Analytics
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setLocation("/profile")} data-testid="menu-profile">
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} data-testid="menu-logout">
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" data-testid="button-login-nav">
                    Login
                  </Button>
                </Link>
                <Link href="/register">
                  <Button className="shadow-lg shadow-primary/30" data-testid="button-get-started-nav">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
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
              {isAuthenticated && user ? (
                <>
                  <Link href="/dashboard">
                    <span className="text-sm text-muted-foreground">Dashboard</span>
                  </Link>
                  {(effectiveRole === "admin" || effectiveRole === "moderator") && (
                    <Link href="/questions">
                      <span className="text-sm text-muted-foreground">Question Bank</span>
                    </Link>
                  )}
                  <Link href="/discussions">
                    <span className="text-sm text-muted-foreground">Q&A Forum</span>
                  </Link>
                  <Link href="/analytics">
                    <span className="text-sm text-muted-foreground">Analytics</span>
                  </Link>
                  <Button variant="outline" onClick={handleLogout} className="w-full">
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Link href="/login">
                    <span className="text-sm text-muted-foreground">Login</span>
                  </Link>
                  <Link href="/register">
                    <Button className="w-full" data-testid="button-get-started-mobile">
                      Get Started
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
