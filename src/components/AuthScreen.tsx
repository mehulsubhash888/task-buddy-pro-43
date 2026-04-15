import { useState } from "react";
import { signup, login, resetPassword, type UserRole } from "@/lib/local-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ClipboardList, LogIn, UserPlus, KeyRound, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

type Mode = "login" | "signup" | "reset";

interface Props {
  onAuth: () => void;
  role?: UserRole;
  onBack?: () => void;
}

export default function AuthScreen({ onAuth, role, onBack }: Props) {
  const [mode, setMode] = useState<Mode>("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [recoveryPhrase, setRecoveryPhrase] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setUsername("");
    setPassword("");
    setConfirmPassword("");
    setRecoveryPhrase("");
    setNewPassword("");
  };

  const handleLogin = async () => {
    if (!username.trim() || !password) return;
    setLoading(true);
    const result = await login(username, password);
    setLoading(false);
    if (result.success) {
      toast.success(`Welcome back, ${username}!`);
      onAuth();
    } else {
      toast.error(result.error);
    }
  };

  const handleSignup = async () => {
    if (!username.trim() || !password || !recoveryPhrase.trim()) return;
    if (password !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }
    setLoading(true);
    const result = await signup(username, password, recoveryPhrase);
    setLoading(false);
    if (result.success) {
      toast.success(`Account created! Welcome, ${username}!`);
      onAuth();
    } else {
      toast.error(result.error);
    }
  };

  const handleReset = async () => {
    if (!username.trim() || !recoveryPhrase.trim() || !newPassword) return;
    setLoading(true);
    const result = await resetPassword(username, recoveryPhrase, newPassword);
    setLoading(false);
    if (result.success) {
      toast.success("Password reset! You can now log in.");
      setMode("login");
      reset();
    } else {
      toast.error(result.error);
    }
  };

  const roleLabel = role === "manager" ? "Manager" : role === "employee" ? "Employee" : "";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6 slide-up">
        {/* Back button */}
        {onBack && (
          <button onClick={onBack} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" /> Change role
          </button>
        )}

        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="rounded-2xl bg-primary p-3">
            <ClipboardList className="h-8 w-8 text-primary-foreground" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold">TaskFlow</h1>
            {roleLabel && <p className="text-xs text-primary font-medium">{roleLabel} Account</p>}
            <p className="text-sm text-muted-foreground mt-1">
              {mode === "login" && "Sign in to your account"}
              {mode === "signup" && "Create a new account"}
              {mode === "reset" && "Reset your password"}
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && mode === "login" && handleLogin()}
            />
          </div>

          {mode === "login" && (
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              />
            </div>
          )}

          {mode === "signup" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm">Confirm Password</Label>
                <Input
                  id="confirm"
                  type="password"
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="recovery">Recovery Phrase</Label>
                <p className="text-xs text-muted-foreground">
                  A secret phrase to recover your account if you forget your password
                </p>
                <Input
                  id="recovery"
                  placeholder="e.g. my favorite color is blue"
                  value={recoveryPhrase}
                  onChange={(e) => setRecoveryPhrase(e.target.value)}
                />
              </div>
            </>
          )}

          {mode === "reset" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="recovery">Recovery Phrase</Label>
                <Input
                  id="recovery"
                  placeholder="Enter your recovery phrase"
                  value={recoveryPhrase}
                  onChange={(e) => setRecoveryPhrase(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newpass">New Password</Label>
                <Input
                  id="newpass"
                  type="password"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
            </>
          )}

          {mode === "login" && (
            <Button className="w-full gap-2" onClick={handleLogin} disabled={loading}>
              <LogIn className="h-4 w-4" /> Sign In
            </Button>
          )}
          {mode === "signup" && (
            <Button className="w-full gap-2" onClick={handleSignup} disabled={loading}>
              <UserPlus className="h-4 w-4" /> Create Account
            </Button>
          )}
          {mode === "reset" && (
            <Button className="w-full gap-2" onClick={handleReset} disabled={loading}>
              <KeyRound className="h-4 w-4" /> Reset Password
            </Button>
          )}
        </div>

        {/* Mode switchers */}
        <div className="text-center text-sm space-y-1">
          {mode === "login" && (
            <>
              <p>
                Don't have an account?{" "}
                <button onClick={() => { setMode("signup"); reset(); }} className="text-primary font-medium hover:underline">
                  Sign up
                </button>
              </p>
              <p>
                Forgot password?{" "}
                <button onClick={() => { setMode("reset"); reset(); }} className="text-primary font-medium hover:underline">
                  Reset it
                </button>
              </p>
            </>
          )}
          {mode === "signup" && (
            <p>
              Already have an account?{" "}
              <button onClick={() => { setMode("login"); reset(); }} className="text-primary font-medium hover:underline">
                Sign in
              </button>
            </p>
          )}
          {mode === "reset" && (
            <p>
              Remember your password?{" "}
              <button onClick={() => { setMode("login"); reset(); }} className="text-primary font-medium hover:underline">
                Sign in
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
