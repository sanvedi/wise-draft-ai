import { motion } from "framer-motion";
import { Sparkles, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const LoginPage = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    } else {
      navigate("/", { replace: true });
    }
    setLoading(false);
  };

  if (authLoading) return null;
  if (user) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen bg-background bg-grid flex items-center justify-center">
      <div className="bg-radial-glow fixed inset-0 pointer-events-none" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-10 max-w-sm w-full space-y-8 text-center relative"
      >
        <div className="space-y-3">
          <div className="p-3 rounded-xl bg-primary/10 glow-primary inline-flex">
            <Sparkles className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-2xl font-display font-bold text-foreground">
            Sutra <span className="text-gradient">Pravartak</span>
          </h1>
          <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
            GenAI Content Engine
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4 text-left">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="bg-background/50 border-border"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="bg-background/50 border-border"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-foreground text-background hover:bg-foreground/90 font-medium py-5"
          >
            <LogIn className="w-4 h-4 mr-2" />
            {loading ? "Signing in..." : "Sign In"}
          </Button>

          {error && (
            <p className="text-xs text-destructive font-mono text-center">{error}</p>
          )}
        </form>

        <p className="text-xs font-mono text-muted-foreground">
          Your data is encrypted and stored securely.
        </p>
      </motion.div>
    </div>
  );
};

export default LoginPage;
