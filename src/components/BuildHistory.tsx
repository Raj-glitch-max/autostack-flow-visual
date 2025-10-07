import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Clock, GitBranch, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";

interface PipelineRun {
  id: string;
  github_repo: string;
  commit_sha: string | null;
  commit_message: string | null;
  status: string;
  triggered_by: string;
  started_at: string;
  completed_at: string | null;
}

interface BuildHistoryProps {
  onSelectRun: (runId: string) => void;
  selectedRunId?: string;
}

export const BuildHistory = ({ onSelectRun, selectedRunId }: BuildHistoryProps) => {
  const [runs, setRuns] = useState<PipelineRun[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRuns();
    
    // Subscribe to realtime updates
    const channel = supabase
      .channel('pipeline_runs_channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pipeline_runs'
        },
        () => {
          fetchRuns();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchRuns = async () => {
    const { data, error } = await supabase
      .from('pipeline_runs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (!error && data) {
      setRuns(data);
    }
    setLoading(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-node-active" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-destructive" />;
      case 'running':
        return <Loader2 className="w-4 h-4 text-accent animate-spin" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      success: "bg-node-active/20 text-node-active border-node-active/30",
      failed: "bg-destructive/20 text-destructive border-destructive/30",
      running: "bg-accent/20 text-accent border-accent/30",
      pending: "bg-muted text-muted-foreground border-border"
    };
    
    return (
      <Badge variant="outline" className={`${variants[status]} capitalize`}>
        {status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card className="p-6 bg-card border-border">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-card border-border">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-5 h-5 text-accent" />
        <h3 className="font-semibold text-lg">Build History</h3>
        <Badge variant="secondary" className="ml-auto">{runs.length}</Badge>
      </div>
      
      <ScrollArea className="h-[600px]">
        <div className="space-y-2">
          <AnimatePresence>
            {runs.length === 0 ? (
              <div className="text-muted-foreground text-center py-12">
                No pipeline runs yet. Start your first build!
              </div>
            ) : (
              runs.map((run) => (
                <motion.div
                  key={run.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className={`p-4 rounded-lg border cursor-pointer transition-all hover:border-accent/50 ${
                    selectedRunId === run.id
                      ? 'bg-accent/10 border-accent'
                      : 'bg-card/50 border-border'
                  }`}
                  onClick={() => onSelectRun(run.id)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(run.status)}
                      <span className="font-mono text-sm">
                        {run.commit_sha?.substring(0, 7) || 'manual'}
                      </span>
                    </div>
                    {getStatusBadge(run.status)}
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <GitBranch className="w-3 h-3" />
                    <span className="truncate">
                      {run.github_repo.split('/').slice(-1)[0]}
                    </span>
                  </div>
                  
                  {run.commit_message && (
                    <p className="text-sm text-foreground/80 mb-2 line-clamp-1">
                      {run.commit_message}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>
                      {formatDistanceToNow(new Date(run.started_at), { addSuffix: true })}
                    </span>
                    {run.triggered_by && (
                      <Badge variant="outline" className="ml-auto text-xs">
                        {run.triggered_by}
                      </Badge>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </ScrollArea>
    </Card>
  );
};
