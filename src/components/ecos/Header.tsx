import { motion } from "framer-motion";
import { Cpu } from "lucide-react";

const Header = () => (
  <motion.header
    initial={{ opacity: 0, y: -10 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex items-center justify-between py-4"
  >
    <div className="flex items-center gap-3">
      <div className="p-2 rounded-lg bg-primary/10 glow-primary">
        <Cpu className="w-5 h-5 text-primary" />
      </div>
      <div>
        <h1 className="text-lg font-bold text-foreground tracking-tight">
          ECOS <span className="text-primary">Content OS</span>
        </h1>
        <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
          Enterprise Agentic Content Pipeline
        </p>
      </div>
    </div>
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-1.5">
        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
        <span className="text-[10px] font-mono text-muted-foreground">System Online</span>
      </div>
      <span className="text-[10px] font-mono text-muted-foreground px-2 py-1 rounded bg-muted">v1.0.0</span>
    </div>
  </motion.header>
);

export default Header;
