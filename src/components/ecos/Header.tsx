import { motion } from "framer-motion";
import logo from "@/assets/logo.png";

const Header = () => (
  <motion.header
    initial={{ opacity: 0, y: -10 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex items-center justify-between py-3"
  >
    <div className="flex items-center gap-3">
      <div className="p-1.5 rounded-lg overflow-hidden">
        <img src={logo} alt="Content Flow" className="w-6 h-6 object-contain" />
      </div>
      <div>
        <h1 className="text-lg font-bold text-foreground tracking-tight">
          Content <span className="text-primary">Flow</span>
        </h1>
        <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
          From creation to distribution—on autopilot.
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
