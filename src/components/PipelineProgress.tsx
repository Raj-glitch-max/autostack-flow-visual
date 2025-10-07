import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle2, XCircle, Loader2, Circle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface BuildStage {
  id: string;
  stage_name: string;
  status: string;
  logs: string[] | null;
  started_at: string | null;
  completed_at: string | null;
}

interface PipelineProgressProps {
  pipelineRunId: string | null;
}

const stageDisplayNames: Record<string, string> = {
  github_commit: "GitHub Commit",
  jenkins_build: "Jenkins Build",
  docker_ecr: "Docker → ECR",
  ecs_deploy: "ECS Deploy",
  monitoring: "Monitoring"
};

export const PipelineProgress = ({ pipelineRunId }: PipelineProgressProps) => {
  const [stages, setStages] = useState<BuildStage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!pipelineRunId) {
      setStages([]);
      setLoading(false);
      return;
    }

    fetchStages();
    
    const channel = supabase
      .channel(`pipeline_stages_${pipelineRunId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'build_stages',
          filter: `pipeline_run_id=eq.${pipelineRunId}`
        },
        () => {
          fetchStages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [pipelineRunId]);

  const fetchStages = async () => {
    if (!pipelineRunId) return;
    
    const { data, error } = await supabase
      .from('build_stages')
      .select('*')
      .eq('pipeline_run_id', pipelineRunId)
      .order('created_at', { ascending: true });

    if (!error && data) {
      setStages(data);
    }
    setLoading(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-node-active" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-destructive" />;
      case 'running':
        return <Loader2 className="w-5 h-5 text-accent animate-spin" />;
      default:
        return <Circle className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const calculateProgress = () => {
    if (stages.length === 0) return 0;
    const completed = stages.filter(s => s.status === 'success').length;
    return (completed / stages.length) * 100;
  };

  if (!pipelineRunId) {
    return (
      <Card className="p-6 bg-card border-border">
        <div className="text-center text-muted-foreground py-12">
          Select a build from history to view details
        </div>
      </Card>
    );
  }

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
      <div className="mb-6">
        <h3 className="font-semibold text-lg mb-2">Pipeline Progress</h3>
        <Progress value={calculateProgress()} className="h-2" />
        <p className="text-sm text-muted-foreground mt-2">
          {stages.filter(s => s.status === 'success').length} of {stages.length} stages completed
        </p>
      </div>

      <ScrollArea className="h-[500px]">
        <div className="space-y-4">
          <AnimatePresence>
            {stages.map((stage, index) => (
              <motion.div
                key={stage.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`p-4 rounded-lg border ${
                  stage.status === 'running'
                    ? 'border-accent bg-accent/5 node-glow'
                    : stage.status === 'success'
                    ? 'border-node-active/30 bg-node-active/5'
                    : stage.status === 'failed'
                    ? 'border-destructive/30 bg-destructive/5'
                    : 'border-border bg-card/50'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(stage.status)}
                    <span className="font-semibold">
                      {stageDisplayNames[stage.stage_name] || stage.stage_name}
                    </span>
                  </div>
                  <Badge
                    variant={stage.status === 'success' ? 'default' : 'outline'}
                    className={
                      stage.status === 'running'
                        ? 'bg-accent/20 text-accent border-accent/30'
                        : stage.status === 'failed'
                        ? 'bg-destructive/20 text-destructive border-destructive/30'
                        : ''
                    }
                  >
                    {stage.status}
                  </Badge>
                </div>

                {stage.logs && stage.logs.length > 0 && (
                  <div className="space-y-1 font-mono text-xs">
                    {stage.logs.map((log, logIndex) => (
                      <motion.div
                        key={logIndex}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: logIndex * 0.05 }}
                        className={`p-2 rounded ${
                          log.includes('✓') || log.includes('success')
                            ? 'text-node-active bg-node-active/10'
                            : log.includes('❌') || log.includes('failed')
                            ? 'text-destructive bg-destructive/10'
                            : 'text-muted-foreground'
                        }`}
                      >
                        {log}
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </ScrollArea>
    </Card>
  );
};
