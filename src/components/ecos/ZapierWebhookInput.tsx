import { useState } from "react";
import { motion } from "framer-motion";
import { Zap, Check, Link } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ZapierWebhookInputProps {
  webhookUrl: string;
  onSave: (url: string) => void;
}

const ZapierWebhookInput = ({ webhookUrl, onSave }: ZapierWebhookInputProps) => {
  const [url, setUrl] = useState(webhookUrl);
  const [saved, setSaved] = useState(!!webhookUrl);

  const handleSave = () => {
    if (!url.startsWith("https://hooks.zapier.com/")) return;
    onSave(url);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg border border-border bg-card p-4 space-y-3"
    >
      <div className="flex items-center gap-2">
        <Zap className="w-4 h-4 text-agent-customizer" />
        <h3 className="text-xs font-semibold text-foreground">Zapier Webhook</h3>
        {webhookUrl && (
          <span className="ml-auto flex items-center gap-1 text-[9px] font-mono text-primary">
            <Link className="w-3 h-3" /> Connected
          </span>
        )}
      </div>
      <p className="text-[10px] text-muted-foreground font-mono leading-relaxed">
        Create a Zap with a "Catch Hook" trigger, then paste the webhook URL below. Published content will be sent to your Zap for distribution.
      </p>
      <div className="flex gap-2">
        <input
          type="url"
          placeholder="https://hooks.zapier.com/hooks/catch/..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="flex-1 bg-muted/30 border border-border rounded-md px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground font-mono"
        />
        <Button
          size="sm"
          onClick={handleSave}
          disabled={!url.startsWith("https://hooks.zapier.com/")}
          className="text-[9px] font-mono uppercase bg-primary text-primary-foreground"
        >
          {saved ? <Check className="w-3 h-3" /> : "Save"}
        </Button>
      </div>
    </motion.div>
  );
};

export default ZapierWebhookInput;
