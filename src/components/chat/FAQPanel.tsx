import { motion } from "framer-motion";
import { X, HelpCircle, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

const faqs = [
  { q: "How does content generation work?", a: "Enter a prompt describing your content needs, select target platforms, and the system will create tailored content for each platform. You can approve, reject, or retry the generated content." },
  { q: "What platforms are supported?", a: "Instagram, LinkedIn, X (Twitter), Facebook, YouTube, and Google Business. Select the platforms you want when submitting your prompt." },
  { q: "How does the brand kit work?", a: "Click the globe icon in the input bar and enter your website URL. The system will extract your brand identity — colors, tone, guidelines — and apply it to all generated content." },
  { q: "Can I export content?", a: "Yes! After approving content, you can export it as a 2-slide presentation, a branded PDF, a blog post, or an article." },
  { q: "Is my data secure?", a: "All data is encrypted and stored securely. Your API keys and brand information are never shared." },
];

interface FAQPanelProps {
  onClose: () => void;
}

export function FAQPanel({ onClose }: FAQPanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="fixed inset-y-0 left-0 w-80 bg-background border-r border-border z-50 flex flex-col shadow-xl"
    >
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-primary" />
          <h2 className="font-display font-semibold text-sm">Help & FAQ</h2>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {faqs.map((faq, i) => (
          <div key={i} className="space-y-1.5">
            <h3 className="text-sm font-semibold text-foreground">{faq.q}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-border">
        <Button variant="outline" className="w-full gap-2 text-sm">
          <Mail className="w-4 h-4" /> Contact Support
        </Button>
      </div>
    </motion.div>
  );
}
