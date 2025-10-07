import { useState } from "react";
import { motion } from "framer-motion";
import { Play, Loader2, Webhook, GitBranch, Wrench, Container, Cloud, Activity } from "lucide-react";
import { NodeCard } from "@/components/NodeCard";
import { ConnectionLine } from "@/components/ConnectionLine";
import { BuildHistory } from "@/components/BuildHistory";
import { PipelineProgress } from "@/components/PipelineProgress";
import { DeploymentStatus } from "@/components/DeploymentStatus";
import { CloudWatchMetrics } from "@/components/CloudWatchMetrics";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const nodes = [
  {
    id: "github_commit",
    title: "GitHub Commit",
    description: "Triggers the CI/CD pipeline",
    icon: GitBranch,
    tooltip: "Real webhook from GitHub triggers the pipeline",
  },
  {
    id: "jenkins_build",
    title: "Jenkins Build",
    description: "CI build & Terraform provision infra",
    icon: Wrench,
    tooltip: "Real Jenkins CI/CD build via API with Terraform",
  },
  {
    id: "docker_ecr",
    title: "Docker → ECR",
    description: "Image built and pushed to AWS ECR",
    icon: Container,
    tooltip: "Real Docker build and push to AWS ECR",
  },
  {
    id: "ecs_deploy",
    title: "ECS Deploy",
    description: "Terraform deploys container to ECS",
    icon: Cloud,
    tooltip: "Real AWS ECS deployment with Terraform",
  },
  {
    id: "monitoring",
    title: "Monitoring",
    description: "CloudWatch monitors app performance",
    icon: Activity,
    tooltip: "Real CloudWatch metrics and logs",
  },
];

const Index = () => {
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [githubUrl, setGithubUrl] = useState("https://github.com/your-org/your-repo");
  const [isStarting, setIsStarting] = useState(false);
  const [activeStages, setActiveStages] = useState<Set<string>>(new Set());

  const startNewPipeline = async () => {
    if (!githubUrl.trim()) {
      toast({
        title: "GitHub URL Required",
        description: "Please enter a valid GitHub repository URL",
        variant: "destructive"
      });
      return;
    }

    setIsStarting(true);
    setActiveStages(new Set());

    try {
      // Extract repo info from URL
      const repoMatch = githubUrl.match(/github\.com\/([^\/]+\/[^\/]+)/);
      const repoName = repoMatch ? repoMatch[1] : githubUrl;

      // Create a new pipeline run
      const { data: pipelineRun, error: runError } = await supabase
        .from('pipeline_runs')
        .insert({
          github_repo: repoName,
          commit_sha: Math.random().toString(36).substr(2, 7),
          commit_message: 'Manual trigger from UI',
          status: 'running',
          triggered_by: 'manual'
        })
        .select()
        .single();

      if (runError) throw runError;

      // Create build stages
      const stages = ['github_commit', 'jenkins_build', 'docker_ecr', 'ecs_deploy', 'monitoring'];
      const stageInserts = stages.map(stage => ({
        pipeline_run_id: pipelineRun.id,
        stage_name: stage,
        status: 'pending',
        logs: []
      }));

      const { error: stagesError } = await supabase
        .from('build_stages')
        .insert(stageInserts);

      if (stagesError) throw stagesError;

      setSelectedRunId(pipelineRun.id);

      // Subscribe to stage updates for visual feedback
      const channel = supabase
        .channel(`pipeline_${pipelineRun.id}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'build_stages',
            filter: `pipeline_run_id=eq.${pipelineRun.id}`
          },
          (payload: any) => {
            if (payload.new.status === 'running' || payload.new.status === 'success') {
              setActiveStages(prev => new Set([...prev, payload.new.stage_name]));
            }
          }
        )
        .subscribe();

      // Trigger the pipeline execution
      const { error: pipelineError } = await supabase.functions.invoke('run-pipeline', {
        body: {
          pipelineRunId: pipelineRun.id,
          repoUrl: githubUrl
        }
      });

      if (pipelineError) throw pipelineError;

      toast({
        title: "Pipeline Started!",
        description: "Your CI/CD pipeline is now running"
      });

      // Cleanup subscription after 60 seconds
      setTimeout(() => {
        supabase.removeChannel(channel);
      }, 60000);

    } catch (error) {
      console.error('Error starting pipeline:', error);
      toast({
        title: "Error Starting Pipeline",
        description: error instanceof Error ? error.message : "Failed to start pipeline",
        variant: "destructive"
      });
    } finally {
      setIsStarting(false);
    }
  };

  const getWebhookUrl = () => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    return `${supabaseUrl}/functions/v1/github-webhook`;
  };

  return (
    <div className="min-h-screen p-4 sm:p-8">
      <div className="max-w-[1800px] mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            AutoStack CI/CD Platform
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto">
            Real-time CI/CD pipeline with GitHub integration, build tracking, and AWS deployments
          </p>
        </motion.div>

        {/* GitHub Webhook Setup Card */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <Card className="p-6 bg-gradient-to-r from-accent/10 to-primary/10 border-accent/30">
            <div className="flex items-start gap-4">
              <Webhook className="w-6 h-6 text-accent flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-2">GitHub Webhook Setup</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Configure your GitHub repository to automatically trigger builds on push:
                </p>
                <div className="bg-muted/50 p-3 rounded-lg font-mono text-xs break-all mb-3">
                  {getWebhookUrl()}
                </div>
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline">Content type: application/json</Badge>
                  <Badge variant="outline">Events: push</Badge>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Manual Trigger Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <Card className="p-6 bg-card border-border">
            <h3 className="font-semibold text-lg mb-4">Manual Pipeline Trigger</h3>
            <div className="flex flex-col sm:flex-row gap-4">
              <Input
                type="text"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                placeholder="https://github.com/your-org/your-repo"
                className="flex-1 bg-muted/50 border-border"
                disabled={isStarting}
              />
              <Button
                onClick={startNewPipeline}
                disabled={isStarting}
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground node-glow"
              >
                {isStarting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Starting...
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 mr-2" />
                    Start New Build
                  </>
                )}
              </Button>
            </div>
          </Card>
        </motion.div>

        {/* Pipeline Visual Flow */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <Card className="p-6 bg-card border-border">
            <h3 className="font-semibold text-lg mb-6 text-center">Pipeline Flow</h3>
            <div className="flex flex-col items-center space-y-4">
              {nodes.map((node, index) => (
                <div key={node.id} className="w-full max-w-md">
                  <NodeCard
                    id={node.id}
                    title={node.title}
                    description={node.description}
                    icon={node.icon}
                    isActive={activeStages.has(node.id)}
                    tooltipContent={node.tooltip}
                    disabled
                  />
                  {index < nodes.length - 1 && (
                    <ConnectionLine 
                      isActive={activeStages.has(node.id) && activeStages.has(nodes[index + 1].id)} 
                      isVertical 
                    />
                  )}
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Main Dashboard Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Build History - Left Column */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-1"
          >
            <BuildHistory
              onSelectRun={setSelectedRunId}
              selectedRunId={selectedRunId || undefined}
            />
          </motion.div>

          {/* Pipeline Details - Right Columns */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="lg:col-span-2 space-y-6"
          >
            <PipelineProgress pipelineRunId={selectedRunId} />
            <div className="grid md:grid-cols-2 gap-6">
              <DeploymentStatus pipelineRunId={selectedRunId} />
              <CloudWatchMetrics pipelineRunId={selectedRunId} />
            </div>
          </motion.div>
        </div>

        {/* Footer Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-sm text-muted-foreground mt-12 p-6 bg-card/50 rounded-lg border border-border"
        >
          <p className="mb-2 font-semibold">
            🚀 Production-Ready CI/CD Platform
          </p>
          <p>
            Real GitHub webhooks trigger automated builds • Jenkins integration for CI/CD • 
            Docker images pushed to AWS ECR • Live ECS deployments • CloudWatch monitoring & metrics
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Index;
