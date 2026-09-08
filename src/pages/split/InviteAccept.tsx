import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useJoinGroup } from "@/hooks/useGroupInvite";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wallet, Users } from "lucide-react";
import { toast } from "sonner";

const PENDING_INVITE_KEY = "fintrack_pending_invite_code";

export default function InviteAccept() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { user, loading, signIn, signUp } = useAuth();
  const { joinGroup } = useJoinGroup();

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [joining, setJoining] = useState(false);

  // Once authenticated, join automatically.
  useEffect(() => {
    if (loading || !user || !code || joining) return;
    setJoining(true);
    joinGroup.mutate(code, {
      onSuccess: (groupId) => {
        sessionStorage.removeItem(PENDING_INVITE_KEY);
        toast.success("You've joined the group!");
        navigate(`/split/${groupId}`, { replace: true });
      },
      onError: (e: Error) => {
        toast.error(e.message);
        setJoining(false);
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user, code]);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) return;
    setSubmitting(true);
    sessionStorage.setItem(PENDING_INVITE_KEY, code);
    const { error } = isLogin ? await signIn(email, password) : await signUp(email, password, displayName);
    if (error) {
      toast.error(error.message);
      setSubmitting(false);
    } else if (!isLogin) {
      toast.success("Check your email to confirm your account, then open this invite link again.");
      setSubmitting(false);
    }
    // on success + login, the effect above will fire once `user` updates
  };

  if (loading || (user && joining)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground flex items-center gap-2">
          <Users className="h-5 w-5" /> Joining group…
        </div>
      </div>
    );
  }

  if (user) {
    // Effect will redirect shortly; show a neutral loading state.
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="glass-card p-8 w-full max-w-sm animate-fade-in">
        <div className="flex items-center gap-2 justify-center mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <Wallet className="h-6 w-6 text-primary" />
          </div>
          <span className="font-heading font-bold text-2xl gradient-text">FinTrack</span>
        </div>

        <h2 className="font-heading font-semibold text-lg text-center mb-2">You've been invited to a Split group</h2>
        <p className="text-sm text-muted-foreground text-center mb-6">
          Split is a shared feature — sign in or create a free account to join.
        </p>

        <form onSubmit={handleAuthSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <Label>Display Name</Label>
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="bg-secondary border-border"
                placeholder="Your name"
              />
            </div>
          )}
          <div>
            <Label>Email</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-secondary border-border"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <Label>Password</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="bg-secondary border-border"
              placeholder="••••••••"
            />
          </div>
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Please wait..." : isLogin ? "Sign In & Join" : "Sign Up & Join"}
          </Button>
        </form>

        <div className="mt-4 text-center text-sm text-muted-foreground">
          <button onClick={() => setIsLogin(!isLogin)} className="hover:text-primary transition-colors">
            {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
          </button>
        </div>
      </div>
    </div>
  );
}
