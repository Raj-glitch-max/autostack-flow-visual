import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Cloud, CheckCircle2, Loader2, XCircle, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";

interface Deployment {
  id: string;
  image_tag: string;
  image_uri: string | null;
  ecs_service: string | null;
  status: string;
  deployed_at: string;
}

interface DeploymentStatusProps {
  pipelineRunId: string | null;
}

export const DeploymentStatus = ({ pipelineRunId }: DeploymentStatusProps) => {
  const [deployment, setDeployment] = useState<Deployment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!pipelineRunId) {
      setDeployment(null);
      setLoading(false);
      return;
    }

    fetchDeployment();
    
    const channel = supabase
      .channel(`deployment_${pipelineRunId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'deployments',
          filter: `pipeline_run_id=eq.${pipelineRunId}`
        },
        () => {
          fetchDeployment();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [pipelineRunId]);

  const fetchDeployment = async () => {
    if (!pipelineRunId) return;
    
    const { data, error } = await supabase
      .from('deployments')
      .select('*')
      .eq('pipeline_run_id', pipelineRunId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      setDeployment(data);
    }
    setLoading(false);
  };

  const getStatusIcon = () => {
    if (!deployment) return <Cloud className="w-5 h-5 text-muted-foreground" />;
    
    switch (deployment.status) {
      case 'deployed':
        return <CheckCircle2 className="w-5 h-5 text-node-active" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-destructive" />;
      default:
        return <Loader2 className="w-5 h-5 text-accent animate-spin" />;
    }
  };

  if (!pipelineRunId) {
    return (
      <Card className="p-6 bg-card border-border">
        <div className="flex items-center gap-2 mb-2">
          <Cloud className="w-5 h-5 text-accent" />
          <h3 className="font-semibold text-lg">Deployment Status</h3>
        </div>
        <p className="text-muted-foreground text-sm">
          No deployment selected
        </p>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="p-6 bg-card border-border">
        <div className="flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-accent" />
        </div>
      </Card>
    );
  }

  if (!deployment) {
    return (
      <Card className="p-6 bg-card border-border">
        <div className="flex items-center gap-2 mb-2">
          <Cloud className="w-5 h-5 text-accent" />
          <h3 className="font-semibold text-lg">Deployment Status</h3>
        </div>
        <p className="text-muted-foreground text-sm">
          No deployment for this build
        </p>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      <Card className={`p-6 border ${
        deployment.status === 'deployed'
          ? 'border-node-active/30 bg-node-active/5'
          : deployment.status === 'failed'
          ? 'border-destructive/30 bg-destructive/5'
          : 'border-accent/30 bg-accent/5'
      }`}>
        <div className="flex items-center gap-2 mb-4">
          {getStatusIcon()}
          <h3 className="font-semibold text-lg">Deployment Status</h3>
          <Badge
            variant="outline"
            className={`ml-auto ${
              deployment.status === 'deployed'
                ? 'bg-node-active/20 text-node-active border-node-active/30'
                : deployment.status === 'failed'
                ? 'bg-destructive/20 text-destructive border-destructive/30'
                : 'bg-accent/20 text-accent border-accent/30'
            }`}
          >
            {deployment.status}
          </Badge>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <Package className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">Image Tag:</span>
            <code className="font-mono bg-muted px-2 py-1 rounded text-foreground">
              {deployment.image_tag}
            </code>
          </div>

          {deployment.image_uri && (
            <div className="flex items-start gap-2 text-sm">
              <Cloud className="w-4 h-4 text-muted-foreground mt-0.5" />
              <div>
                <span className="text-muted-foreground">Image URI:</span>
                <code className="block font-mono text-xs bg-muted px-2 py-1 rounded mt-1 break-all">
                  {deployment.image_uri}
                </code>
              </div>
            </div>
          )}

          {deployment.ecs_service && (
            <div className="flex items-center gap-2 text-sm">
              <Cloud className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">ECS Service:</span>
              <span className="font-medium">{deployment.ecs_service}</span>
            </div>
          )}

          <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2 border-t border-border">
            <span>Deployed {formatDistanceToNow(new Date(deployment.deployed_at), { addSuffix: true })}</span>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};
