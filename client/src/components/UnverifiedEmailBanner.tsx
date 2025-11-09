import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Mail, X, Loader2, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface UnverifiedEmailBannerProps {
  user: {
    emailVerified: Date | null;
    email: string;
  };
}

export default function UnverifiedEmailBanner({ user }: UnverifiedEmailBannerProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isResending, setIsResending] = useState(false);
  const [resent, setResent] = useState(false);
  const { toast } = useToast();

  if (!user || user.emailVerified || !isVisible) {
    return null;
  }

  const handleResend = async () => {
    setIsResending(true);
    try {
      const response = await apiRequest("POST", "/api/auth/resend-verification", {});
      
      if (response.ok) {
        setResent(true);
        toast({
          title: "Email Sent",
          description: "Verification email has been sent. Please check your inbox.",
        });
        
        // Hide the banner after showing success for a few seconds
        setTimeout(() => {
          setIsVisible(false);
        }, 5000);
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.error || "Failed to send verification email. Please try again later.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <Alert className="border-amber-500 bg-amber-50 dark:bg-amber-950/20 mb-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          {resent ? (
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-500 mt-0.5" />
          ) : (
            <Mail className="h-5 w-5 text-amber-600 dark:text-amber-500 mt-0.5" />
          )}
          <div className="flex-1">
            <AlertDescription className="text-sm text-amber-900 dark:text-amber-100">
              {resent ? (
                <div>
                  <strong className="font-semibold">Verification Email Sent!</strong>
                  <p className="mt-1">
                    We've sent a new verification email to <strong>{user.email}</strong>. 
                    Please check your inbox and click the verification link.
                  </p>
                </div>
              ) : (
                <div>
                  <strong className="font-semibold">Please Verify Your Email</strong>
                  <p className="mt-1">
                    To access all features, please verify your email address. 
                    Check your inbox for the verification link or request a new one.
                  </p>
                </div>
              )}
            </AlertDescription>
            {!resent && (
              <Button
                onClick={handleResend}
                disabled={isResending}
                size="sm"
                variant="outline"
                className="mt-3 h-8 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/30"
              >
                {isResending ? (
                  <>
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-3 w-3" />
                    Resend Verification Email
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
        <Button
          onClick={() => setIsVisible(false)}
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </Alert>
  );
}
