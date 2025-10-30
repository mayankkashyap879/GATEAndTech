import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Shield, KeyRound, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import DashboardNavigation from "@/components/dashboard/DashboardNavigation";

export default function Security() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [showSetup2FA, setShowSetup2FA] = useState(false);
  const [showDisable2FA, setShowDisable2FA] = useState(false);
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [verifyToken, setVerifyToken] = useState("");
  const [disablePassword, setDisablePassword] = useState("");

  // Setup 2FA
  const setup2FAMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/auth/2fa/setup");
      return await response.json();
    },
    onSuccess: (data) => {
      setQrCode(data.qrCode);
      setSecret(data.secret);
      setShowSetup2FA(true);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to setup 2FA",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Verify and enable 2FA
  const verify2FAMutation = useMutation({
    mutationFn: async (token: string) => {
      await apiRequest("POST", "/api/auth/2fa/verify", { token, secret });
    },
    onSuccess: () => {
      toast({
        title: "2FA Enabled",
        description: "Two-factor authentication has been enabled for your account.",
      });
      setShowSetup2FA(false);
      setQrCode("");
      setSecret("");
      setVerifyToken("");
      refreshUser();
    },
    onError: (error: any) => {
      toast({
        title: "Verification failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Disable 2FA
  const disable2FAMutation = useMutation({
    mutationFn: async (password: string) => {
      await apiRequest("POST", "/api/auth/2fa/disable", { password });
    },
    onSuccess: () => {
      toast({
        title: "2FA Disabled",
        description: "Two-factor authentication has been disabled.",
      });
      setShowDisable2FA(false);
      setDisablePassword("");
      refreshUser();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to disable 2FA",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleVerify2FA = () => {
    if (verifyToken.length === 6) {
      verify2FAMutation.mutate(verifyToken);
    }
  };

  const handleDisable2FA = () => {
    if (disablePassword) {
      disable2FAMutation.mutate(disablePassword);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-8">
        <DashboardNavigation />
        <div className="space-y-8">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Shield className="h-8 w-8" />
              Security Settings
            </h1>
            <p className="text-muted-foreground">
              Manage your account security and authentication methods
            </p>
          </div>

          <div className="space-y-6">
            {/* Two-Factor Authentication */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <KeyRound className="h-5 w-5" />
                  Two-Factor Authentication
                </CardTitle>
                <CardDescription>
                  Add an extra layer of security to your account by requiring a verification code in addition to your password.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-md">
                    <div className="flex-1">
                      <p className="font-medium">
                        Status: {user?.twofaEnabled ? (
                          <span className="text-green-600 dark:text-green-400">Enabled</span>
                        ) : (
                          <span className="text-muted-foreground">Disabled</span>
                        )}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {user?.twofaEnabled
                          ? "Your account is protected with 2FA"
                          : "Enable 2FA to secure your account"}
                      </p>
                    </div>
                    <div>
                      {user?.twofaEnabled ? (
                        <Button
                          variant="destructive"
                          onClick={() => setShowDisable2FA(true)}
                          data-testid="button-disable-2fa"
                        >
                          Disable 2FA
                        </Button>
                      ) : (
                        <Button
                          onClick={() => setup2FAMutation.mutate()}
                          disabled={setup2FAMutation.isPending}
                          data-testid="button-enable-2fa"
                        >
                          {setup2FAMutation.isPending ? "Setting up..." : "Enable 2FA"}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Password Management */}
            <Card>
              <CardHeader>
                <CardTitle>Password</CardTitle>
                <CardDescription>
                  Change your password to keep your account secure.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" data-testid="button-change-password">
                  Change Password
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* 2FA Setup Dialog */}
          <Dialog open={showSetup2FA} onOpenChange={setShowSetup2FA}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Setup Two-Factor Authentication</DialogTitle>
                <DialogDescription>
                  Scan the QR code with your authenticator app (Google Authenticator, Authy, etc.)
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {qrCode && (
                  <div className="flex justify-center">
                    <img src={qrCode} alt="2FA QR Code" className="w-48 h-48" data-testid="img-2fa-qr" />
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Enter the 6-digit code from your app</Label>
                  <div className="flex justify-center">
                    <InputOTP
                      maxLength={6}
                      value={verifyToken}
                      onChange={setVerifyToken}
                      data-testid="input-2fa-verify"
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                </div>
                <Button
                  onClick={handleVerify2FA}
                  disabled={verifyToken.length !== 6 || verify2FAMutation.isPending}
                  className="w-full"
                  data-testid="button-verify-2fa"
                >
                  {verify2FAMutation.isPending ? "Verifying..." : "Verify and Enable"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Disable 2FA Dialog */}
          <Dialog open={showDisable2FA} onOpenChange={setShowDisable2FA}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Disable Two-Factor Authentication</DialogTitle>
                <DialogDescription>
                  Enter your password to confirm disabling 2FA
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="disable-password">Password</Label>
                  <Input
                    id="disable-password"
                    type="password"
                    value={disablePassword}
                    onChange={(e) => setDisablePassword(e.target.value)}
                    placeholder="Enter your password"
                    data-testid="input-disable-2fa-password"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowDisable2FA(false);
                      setDisablePassword("");
                    }}
                    className="flex-1"
                    data-testid="button-cancel-disable-2fa"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDisable2FA}
                    disabled={!disablePassword || disable2FAMutation.isPending}
                    className="flex-1"
                    data-testid="button-confirm-disable-2fa"
                  >
                    {disable2FAMutation.isPending ? "Disabling..." : "Disable 2FA"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}
