import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAuth } from "./AuthContext";

interface ViewAsRoleContextType {
  viewAsRole: string;
  setViewAsRole: (role: string) => void;
  effectiveRole: string; // The role to use for access control
}

const ViewAsRoleContext = createContext<ViewAsRoleContextType | undefined>(undefined);

export function ViewAsRoleProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [viewAsRole, setViewAsRole] = useState<string>(user?.role || "student");

  // Update viewAsRole when user changes
  useEffect(() => {
    if (user) {
      setViewAsRole(user.role);
    }
  }, [user]);

  // Effective role is the viewAsRole if admin, otherwise use actual user role
  const effectiveRole = user?.role === "admin" ? viewAsRole : (user?.role || "student");

  return (
    <ViewAsRoleContext.Provider value={{ viewAsRole, setViewAsRole, effectiveRole }}>
      {children}
    </ViewAsRoleContext.Provider>
  );
}

export function useViewAsRole() {
  const context = useContext(ViewAsRoleContext);
  if (context === undefined) {
    throw new Error("useViewAsRole must be used within a ViewAsRoleProvider");
  }
  return context;
}
