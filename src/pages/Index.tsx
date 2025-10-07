import { useState } from "react";
import { motion } from "framer-motion";
import { Play, Loader2, Webhook } from "lucide-react";
import { BuildHistory } from "@/components/BuildHistory";
import { PipelineProgress } from "@/components/PipelineProgress";
import { DeploymentStatus } from "@/components/DeploymentStatus";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [githubUrl, setGithubUrl] = useState("https://github.com/your-org/your-repo");
  const [isStarting, setIsStarting] = useState(false);

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
          status: 'pending',
          triggered_by: 'manual'
        })
        .select()
        .single();

      if (runError) throw runError;

      setSelectedRunId(pipelineRun.id);

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

        {/* Main Dashboard Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Build History - Left Column */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-1"
          >
            <BuildHistory
              onSelectRun={setSelectedRunId}
              selectedRunId={selectedRunId || undefined}
            />
          </motion.div>

          {/* Pipeline Progress & Deployment - Right Columns */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-2 space-y-6"
          >
            <PipelineProgress pipelineRunId={selectedRunId} />
            <DeploymentStatus pipelineRunId={selectedRunId} />
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
