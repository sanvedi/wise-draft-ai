import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Zap, TrendingUp, RefreshCw, Clock, Brain, Loader2, Lightbulb, Target, CalendarClock, Sparkles } from "lucide-react";
import { usePipelineStore } from "@/lib/store/pipelineStore";
import BufferAnalytics from "@/components/ecos/BufferAnalytics";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { analyzePostPerformance, getContentLearnings } from "@/lib/api/ecos";

const DashboardPage = () => {
  const { metrics, bufferOrgId, selectedChannelIds } = usePipelineStore();
  const { toast } = useToast();
  const [analyzing, setAnalyzing] = useState(false);
  const [insights, setInsights] = useState<any>(null);
  const [learnings, setLearnings] = useState<any[]>([]);
  const [loadingLearnings, setLoadingLearnings] = useState(false);

  // Load stored learnings on mount
  useEffect(() => {
    (async () => {
      setLoadingLearnings(true);
      const result = await getContentLearnings();
      if (result.success && result.learnings?.length) {
        setLearnings(result.learnings);
        setInsights(result.learnings[0].insights);
      }
      setLoadingLearnings(false);
    })();
  }, []);

  const handleAnalyze = async () => {
    if (!bufferOrgId) {
      toast({ title: "No Buffer Connected", description: "Load Buffer channels first on the Approval page.", variant: "destructive" });
      return;
    }
    setAnalyzing(true);
    const result = await analyzePostPerformance(bufferOrgId);
    if (result.success && result.insights) {
      setInsights(result.insights);
      toast({ title: "Analysis Complete", description: "AI insights generated from your post history." });
      // Refresh learnings
      const lr = await getContentLearnings();
      if (lr.success) setLearnings(lr.learnings || []);
    } else {
      toast({ title: "Analysis Issue", description: result.error || "No posts to analyze yet.", variant: "destructive" });
    }
    setAnalyzing(false);
  };

  const cards = [
    { icon: Zap, label: "Token Efficiency", value: `${metrics.tokenEfficiency}%`, color: "text-primary", glow: "glow-primary" },
    { icon: TrendingUp, label: "Alignment Score", value: `${metrics.alignmentDrift}%`, color: "text-agent-reviewer", glow: "glow-agent-reviewer" },
    { icon: RefreshCw, label: "Cycle Reduction", value: `${metrics.cycleReduction}%`, color: "text-agent-customizer", glow: "glow-agent-customizer" },
    { icon: Clock, label: "Process Time", value: metrics.processingTime ? `${metrics.processingTime}s` : "—", color: "text-agent-drafter", glow: "glow-agent-drafter" },
  ];

  return (
    <div className="px-4 sm:px-6 py-6 sm:py-8 max-w-6xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-sm text-muted-foreground mt-1">Pipeline metrics, analytics, and AI learning insights.</p>
      </motion.div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(({ icon: Icon, label, value, color, glow }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className={`glass rounded-xl p-5 flex items-center gap-4 hover:${glow} transition-all`}
          >
            <div className="p-2.5 rounded-lg bg-muted/50">
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <div>
              <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">{label}</p>
              <p className="text-2xl font-display font-bold text-foreground mt-0.5">{value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI Learning Agent with real insights */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-agent-learner" />
            <h2 className="text-sm font-display font-semibold text-foreground">Learning Agent</h2>
            <Button
              size="sm"
              variant="outline"
              onClick={handleAnalyze}
              disabled={analyzing}
              className="ml-auto text-xs gap-1.5"
            >
              {analyzing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              {analyzing ? "Analyzing…" : "Analyze Posts"}
            </Button>
          </div>

          {loadingLearnings && !insights && (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          )}

          {!insights && !loadingLearnings && (
            <p className="text-xs text-muted-foreground leading-relaxed">
              Click "Analyze Posts" to let the AI review your Buffer post history and generate strategic insights for improving future content.
            </p>
          )}

          {insights && (
            <div className="space-y-3">
              {/* Key Takeaway */}
              {insights.keyTakeaway && (
                <div className="rounded-lg bg-agent-learner/10 border border-agent-learner/20 p-3">
                  <div className="flex items-start gap-2">
                    <Lightbulb className="w-4 h-4 text-agent-learner flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-foreground leading-relaxed">{insights.keyTakeaway}</p>
                  </div>
                </div>
              )}

              {/* Score */}
              {insights.overallScore && (
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-mono text-muted-foreground uppercase">Strategy Score</span>
                  <div className="flex-1 h-2 bg-muted/30 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${insights.overallScore * 10}%` }}
                      className="h-full rounded-full bg-agent-learner"
                    />
                  </div>
                  <span className="text-xs font-mono font-bold text-foreground">{insights.overallScore}/10</span>
                </div>
              )}

              {/* Content Patterns */}
              {insights.contentPatterns?.length > 0 && (
                <div className="glass rounded-lg p-3 space-y-1.5">
                  <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    <Target className="w-3 h-3" /> Content Patterns
                  </span>
                  <ul className="space-y-1">
                    {insights.contentPatterns.slice(0, 4).map((pattern: string, i: number) => (
                      <li key={i} className="text-xs text-foreground flex items-start gap-2">
                        <span className="text-agent-learner mt-0.5">→</span>{pattern}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Optimal Schedule */}
              {insights.optimalSchedule?.length > 0 && (
                <div className="glass rounded-lg p-3 space-y-1.5">
                  <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    <CalendarClock className="w-3 h-3" /> Best Posting Times
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {insights.optimalSchedule.slice(0, 6).map((time: string, i: number) => (
                      <span key={i} className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-muted/50 border border-border text-foreground">{time}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Improvements */}
              {insights.improvements?.length > 0 && (
                <div className="glass rounded-lg p-3 space-y-1.5">
                  <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider">Areas to Improve</span>
                  <ul className="space-y-1">
                    {insights.improvements.slice(0, 3).map((item: string, i: number) => (
                      <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                        <span className="text-destructive mt-0.5">!</span>{item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Next Post Ideas */}
              {insights.nextPostIdeas?.length > 0 && (
                <div className="glass rounded-lg p-3 space-y-1.5">
                  <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Next Post Ideas
                  </span>
                  <ul className="space-y-1">
                    {insights.nextPostIdeas.slice(0, 5).map((idea: string, i: number) => (
                      <li key={i} className="text-xs text-foreground flex items-start gap-2">
                        <span className="text-primary mt-0.5">{i + 1}.</span>{idea}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* History count */}
              {learnings.length > 1 && (
                <p className="text-[9px] text-muted-foreground font-mono text-right">{learnings.length} analysis sessions stored</p>
              )}
            </div>
          )}
        </motion.div>

        {/* Buffer Analytics */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <BufferAnalytics organizationId={bufferOrgId} channelIds={selectedChannelIds} />
        </motion.div>
      </div>
    </div>
  );
};

export default DashboardPage;
