import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

const Header = () => (
  <motion.header
    initial={{ opacity: 0, y: -10 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex items-center justify-between py-3"
  >
    <div className="flex items-center gap-3">
      <div className="p-2 rounded-lg bg-primary/10 glow-primary">
        <Sparkles className="w-5 h-5 text-primary" />
      </div>
      <div>
        <h1 className="text-lg font-bold text-foreground tracking-tight">
          Sutra <span className="text-primary">Pravartak</span>
        </h1>
        <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
          AI-Powered Viral Content Engine
        </p>
      </div>
    </div>
    <div className="flex items-center gap-1.5">
      <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
      <span className="text-[10px] font-mono text-muted-foreground">Online</span>
    </div>
  </motion.header>
);

export default Header;
