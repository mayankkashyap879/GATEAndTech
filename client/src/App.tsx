import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ViewAsRoleProvider } from "@/contexts/ViewAsRoleContext";
import LandingPage from "@/pages/LandingPage";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import VerifyEmail from "@/pages/VerifyEmail";
import Dashboard from "@/pages/Dashboard";
import Security from "@/pages/Security";
import Questions from "@/pages/Questions";
import QuestionDetail from "@/pages/QuestionDetail";
import QuestionForm from "@/pages/QuestionForm";
import Tests from "@/pages/Tests";
import TestForm from "@/pages/TestForm";
import TakeTest from "@/pages/TakeTest";
import TestResults from "@/pages/TestResults";
import TestReview from "@/pages/TestReview";
import Analytics from "@/pages/Analytics";
import Discussions from "@/pages/Discussions";
import ThreadDetail from "@/pages/ThreadDetail";
import Shop from "@/pages/Shop";
import MyPurchases from "@/pages/MyPurchases";
import RoleManagement from "@/pages/RoleManagement";
import SubjectManagement from "@/pages/SubjectManagement";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/verify-email" component={VerifyEmail} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/security" component={Security} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/discussions" component={Discussions} />
      <Route path="/discussions/:id" component={ThreadDetail} />
      <Route path="/shop" component={Shop} />
      <Route path="/my-purchases" component={MyPurchases} />
      <Route path="/questions" component={Questions} />
      <Route path="/questions/new" component={QuestionForm} />
      <Route path="/questions/:id" component={QuestionDetail} />
      <Route path="/questions/:id/edit" component={QuestionForm} />
      <Route path="/tests" component={Tests} />
      <Route path="/tests/new" component={TestForm} />
      <Route path="/tests/:id/edit" component={TestForm} />
      <Route path="/tests/:id" component={TakeTest} />
      <Route path="/attempts/:id/results" component={TestResults} />
      <Route path="/attempts/:id/review" component={TestReview} />
      <Route path="/admin/roles" component={RoleManagement} />
      <Route path="/admin/subjects" component={SubjectManagement} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ViewAsRoleProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </ViewAsRoleProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
