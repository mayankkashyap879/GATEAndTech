import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useViewAsRole } from "@/contexts/ViewAsRoleContext";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  FileText,
  BarChart3,
  MessageSquare,
  BookOpen,
  ShoppingCart,
  Package,
  Shield,
  Users,
  Layers,
  LogOut,
} from "lucide-react";

type Role = "student" | "moderator" | "admin";

type DashboardNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  roles?: Role[];
};

const navItems: DashboardNavItem[] = [
  {
    label: "Overview",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "My Tests",
    href: "/tests",
    icon: FileText,
  },
  {
    label: "Analytics",
    href: "/analytics",
    icon: BarChart3,
  },
  {
    label: "Q&A Forum",
    href: "/discussions",
    icon: MessageSquare,
  },
  {
    label: "Question Bank",
    href: "/questions",
    icon: BookOpen,
    roles: ["admin", "moderator"],
  },
  {
    label: "Shop",
    href: "/shop",
    icon: ShoppingCart,
    roles: ["student"],
  },
  {
    label: "My Purchases",
    href: "/my-purchases",
    icon: Package,
    roles: ["student"],
  },
  {
    label: "Security",
    href: "/security",
    icon: Shield,
  },
  {
    label: "Role Management",
    href: "/admin/roles",
    icon: Users,
    roles: ["admin"],
  },
  {
    label: "Subject Management",
    href: "/admin/subjects",
    icon: Layers,
    roles: ["admin"],
  },
];

function isPathActive(currentPath: string, href: string) {
  const normalizedCurrent = currentPath.split("?")[0];
  if (normalizedCurrent === href) {
    return true;
  }
  return normalizedCurrent.startsWith(`${href}/`);
}

export function DashboardNavigation({ className }: { className?: string }) {
  const { user, logout } = useAuth();
  const { effectiveRole } = useViewAsRole();
  const [location, setLocation] = useLocation();

  if (!user) {
    return null;
  }

  const role = (effectiveRole || user.role) as Role;
  const items = navItems.filter((item) => !item.roles || item.roles.includes(role));

  if (items.length === 0) {
    return null;
  }

  const handleLogout = async () => {
    await logout();
    setLocation("/");
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 bg-card/80 px-4 py-3 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary font-bold">
            G
          </span>
          <span className="text-lg">GATE And Tech</span>
        </Link>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-muted-foreground sm:inline">
            Signed in as <span className="font-medium text-foreground">{user.name}</span>
          </span>
          <Button variant="outline" size="sm" onClick={handleLogout} data-testid="button-dashboard-logout">
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>
      <nav
        aria-label="Dashboard navigation"
        className="w-full rounded-xl border border-border/60 bg-card/80 px-3 py-2 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/60"
      >
        <div className="flex items-center gap-2 overflow-x-auto">
          {items.map((item) => {
            const Icon = item.icon;
            const active = isPathActive(location, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 rounded-lg border border-transparent px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap",
                  active
                    ? "border-primary/30 bg-primary/10 text-primary shadow-sm"
                    : "text-muted-foreground hover:border-border hover:bg-muted/60 hover:text-foreground",
                )}
                data-testid={`dashboard-nav-${item.label.toLowerCase().replace(/[^a-z]+/g, "-")}`}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

export default DashboardNavigation;
