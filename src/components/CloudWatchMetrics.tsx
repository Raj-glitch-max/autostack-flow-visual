import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, TrendingUp, Zap, HardDrive, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface CloudWatchMetricsProps {
  pipelineRunId: string | null;
}

export const CloudWatchMetrics = ({ pipelineRunId }: CloudWatchMetricsProps) => {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!pipelineRunId) {
      setMetrics(null);
      return;
    }

    fetchMetrics();
  }, [pipelineRunId]);

  const fetchMetrics = async () => {
    if (!pipelineRunId) return;
    
    setLoading(true);
    
    // Check if monitoring stage is completed
    const { data: monitoringStage } = await supabase
      .from('build_stages')
      .select('status, logs')
      .eq('pipeline_run_id', pipelineRunId)
      .eq('stage_name', 'monitoring')
      .maybeSingle();

    if (monitoringStage?.status === 'success') {
      // Simulate CloudWatch metrics
      setMetrics({
        cpuUtilization: Math.floor(Math.random() * 30) + 20,
        memoryUsage: Math.floor(Math.random() * 40) + 30,
        requestCount: Math.floor(Math.random() * 1000) + 500,
        responseTime: Math.floor(Math.random() * 100) + 50,
        errorRate: (Math.random() * 2).toFixed(2),
        healthStatus: 'Healthy'
      });
    }
    
    setLoading(false);
  };

  if (!pipelineRunId) {
    return (
      <Card className="p-6 bg-card border-border">
        <div className="flex items-center gap-2 mb-2">
          <Activity className="w-5 h-5 text-accent" />
          <h3 className="font-semibold text-lg">CloudWatch Metrics</h3>
        </div>
        <p className="text-muted-foreground text-sm">
          Select a build to view metrics
        </p>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="p-6 bg-card border-border">
        <div className="flex items-center justify-center h-32">
          <Loader2 className="w-6 h-6 animate-spin text-accent" />
        </div>
      </Card>
    );
  }

  if (!metrics) {
    return (
      <Card className="p-6 bg-card border-border">
        <div className="flex items-center gap-2 mb-2">
          <Activity className="w-5 h-5 text-accent" />
          <h3 className="font-semibold text-lg">CloudWatch Metrics</h3>
        </div>
        <p className="text-muted-foreground text-sm">
          Waiting for monitoring stage to complete...
        </p>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      <Card className="p-6 bg-gradient-to-br from-card to-accent/5 border-accent/30">
        <div className="flex items-center gap-2 mb-6">
          <Activity className="w-5 h-5 text-accent" />
          <h3 className="font-semibold text-lg">CloudWatch Metrics</h3>
          <Badge 
            variant="outline" 
            className="ml-auto bg-node-active/20 text-node-active border-node-active/30"
          >
            {metrics.healthStatus}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card/50 p-4 rounded-lg border border-border"
          >
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-accent" />
              <span className="text-xs text-muted-foreground">CPU Usage</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">{metrics.cpuUtilization}%</span>
              <TrendingUp className="w-4 h-4 text-node-active" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card/50 p-4 rounded-lg border border-border"
          >
            <div className="flex items-center gap-2 mb-2">
              <HardDrive className="w-4 h-4 text-accent" />
              <span className="text-xs text-muted-foreground">Memory</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">{metrics.memoryUsage}%</span>
              <TrendingUp className="w-4 h-4 text-node-active" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-card/50 p-4 rounded-lg border border-border"
          >
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-accent" />
              <span className="text-xs text-muted-foreground">Requests/min</span>
            </div>
            <div className="text-2xl font-bold">{metrics.requestCount}</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-card/50 p-4 rounded-lg border border-border"
          >
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-accent" />
              <span className="text-xs text-muted-foreground">Avg Response</span>
            </div>
            <div className="text-2xl font-bold">{metrics.responseTime}ms</div>
          </motion.div>
        </div>

        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Error Rate</span>
            <span className={`font-semibold ${parseFloat(metrics.errorRate) < 1 ? 'text-node-active' : 'text-destructive'}`}>
              {metrics.errorRate}%
            </span>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};
