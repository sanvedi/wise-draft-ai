import { motion } from "framer-motion";
import { Sparkles, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { lovable } from "@/integrations/lovable/index";
import { useState } from "react";

const LoginPage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    const { error } = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (error) {
      setError(error.message || "Sign in failed");
      setLoading(false);
    }
  };

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

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Sign in to access your content pipeline and brand assets.
          </p>

          <Button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full bg-foreground text-background hover:bg-foreground/90 font-medium py-5"
          >
            <LogIn className="w-4 h-4 mr-2" />
            {loading ? "Redirecting..." : "Continue with Google"}
          </Button>

          {error && (
            <p className="text-xs text-destructive font-mono">{error}</p>
          )}
        </div>

        <p className="text-[9px] font-mono text-muted-foreground">
          Your data is encrypted and stored securely.
        </p>
      </motion.div>
    </div>
  );
};

export default LoginPage;
