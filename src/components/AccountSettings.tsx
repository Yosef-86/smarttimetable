import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Mail, Lock, Shield } from "lucide-react";

interface AccountSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userEmail: string;
}

export const AccountSettings = ({ open, onOpenChange, userEmail }: AccountSettingsProps) => {
  const [loading, setLoading] = useState(false);
  
  // Change Email states
  const [newEmail, setNewEmail] = useState("");
  const [emailOtp, setEmailOtp] = useState("");
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  
  // Change Password states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSendEmailOtp = async () => {
    if (!newEmail || newEmail === userEmail) {
      toast.error("Please enter a different email address");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail });
      
      if (error) throw error;
      
      setEmailOtpSent(true);
      toast.success("Verification code sent to your new email");
    } catch (error: any) {
      toast.error(error.message || "Failed to send verification code");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmailChange = async () => {
    if (!emailOtp) {
      toast.error("Please enter the verification code");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: newEmail,
        token: emailOtp,
        type: 'email_change'
      });
      
      if (error) throw error;
      
      toast.success("Email updated successfully");
      setNewEmail("");
      setEmailOtp("");
      setEmailOtpSent(false);
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Invalid verification code");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword) {
      toast.error("Please enter your current password");
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      // First verify current password by attempting to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: currentPassword
      });
      
      if (signInError) {
        toast.error("Current password is incorrect");
        setLoading(false);
        return;
      }

      // Then update to new password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (updateError) throw updateError;
      
      toast.success("Password updated successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Account Settings</DialogTitle>
          <DialogDescription>
            Manage your account security and preferences
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="email" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="email">Change Email</TabsTrigger>
            <TabsTrigger value="password">Change Password</TabsTrigger>
          </TabsList>

          <TabsContent value="email" className="space-y-4">
            <div className="space-y-2">
              <Label>Current Email</Label>
              <Input value={userEmail} disabled />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-email">New Email</Label>
              <Input
                id="new-email"
                type="email"
                placeholder="new@example.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                disabled={emailOtpSent}
              />
            </div>

            {emailOtpSent && (
              <div className="space-y-2">
                <Label htmlFor="email-otp">Verification Code</Label>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email-otp"
                    type="text"
                    placeholder="Enter 6-digit code"
                    value={emailOtp}
                    onChange={(e) => setEmailOtp(e.target.value)}
                    maxLength={6}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Check your new email for the verification code
                </p>
              </div>
            )}

            {!emailOtpSent ? (
              <Button onClick={handleSendEmailOtp} disabled={loading} className="w-full">
                <Mail className="w-4 h-4 mr-2" />
                {loading ? "Sending..." : "Send Verification Code"}
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setEmailOtpSent(false);
                    setEmailOtp("");
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button onClick={handleVerifyEmailChange} disabled={loading} className="flex-1">
                  {loading ? "Verifying..." : "Verify & Update"}
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="password" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <Input
                id="current-password"
                type="password"
                placeholder="••••••••"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={6}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                minLength={6}
              />
            </div>

            <Button onClick={handleChangePassword} disabled={loading} className="w-full">
              <Lock className="w-4 h-4 mr-2" />
              {loading ? "Updating..." : "Update Password"}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
