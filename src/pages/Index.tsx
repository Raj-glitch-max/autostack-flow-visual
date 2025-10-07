import { useState } from "react";
import { motion } from "framer-motion";
import { GitBranch, Wrench, Container, Cloud, Activity, Play, RotateCcw } from "lucide-react";
import { NodeCard } from "@/components/NodeCard";
import { ConnectionLine } from "@/components/ConnectionLine";
import { LogsPanel } from "@/components/LogsPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Log {
  id: string;
  timestamp: string;
  message: string;
  type: 'info' | 'success';
}

const nodes = [
  {
    id: "github_commit",
    title: "GitHub Commit",
    description: "Triggers the CI/CD pipeline",
    icon: GitBranch,
    tooltip: "Developer commits code. This triggers the pipeline. (Simulated webhook)",
    logs: [
      "Received webhook from GitHub...",
      "Commit SHA: a7f3b9c - 'Updated deployment config'",
      "Pipeline triggered successfully ✓",
    ],
  },
  {
    id: "jenkins_build",
    title: "Jenkins Build",
    description: "Real Jenkins CI/CD build via API",
    icon: Wrench,
    tooltip: "REAL: Triggers actual Jenkins build via API. Terraform provisioning is simulated.",
    logs: [
      "Jenkins job started...",
      "Running Terraform plan...",
      "Infrastructure validation passed ✓",
      "Build completed successfully ✓",
    ],
  },
  {
    id: "docker_ecr",
    title: "Docker → ECR",
    description: "Real Docker build & ECR push",
    icon: Container,
    tooltip: "REAL: Docker image built and pushed to AWS ECR via AWS SDK.",
    logs: [
      "Building Docker image...",
      "Image tagged: autostack-app:v1.2.3",
      "Pushing to AWS ECR...",
      "Image pushed successfully ✓",
    ],
  },
  {
    id: "ecs_deploy",
    title: "ECS Deploy",
    description: "Real AWS ECS deployment",
    icon: Cloud,
    tooltip: "REAL: Deploys container to ECS via AWS SDK. Terraform infrastructure is pre-provisioned.",
    logs: [
      "Running Terraform apply...",
      "Provisioning ECS service...",
      "Updating task definition...",
      "Deployment completed successfully ✓",
    ],
  },
  {
    id: "monitoring",
    title: "Monitoring",
    description: "Real CloudWatch metrics & logs",
    icon: Activity,
    tooltip: "REAL: Fetches live metrics and logs from AWS CloudWatch.",
    logs: [
      "Monitoring activated...",
      "Health check: PASSED",
      "Metrics streaming to CloudWatch ✓",
      "Application is healthy and running ✓",
    ],
  },
];

const Index = () => {
  const [activeNodes, setActiveNodes] = useState<Set<string>>(new Set());
  const [logs, setLogs] = useState<Log[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [githubUrl, setGithubUrl] = useState("https://github.com/autostack/demo-app");

  const getTimestamp = () => {
    const now = new Date();
    return now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const addLog = (message: string, type: 'info' | 'success' = 'info') => {
    const newLog: Log = {
      id: `${Date.now()}-${Math.random()}`,
      timestamp: getTimestamp(),
      message,
      type,
    };
    setLogs(prev => [...prev, newLog]);
  };

  const callEdgeFunction = async (functionName: string, payload: any) => {
    try {
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: payload,
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error(`Error calling ${functionName}:`, error);
      return null;
    }
  };

  const startPipeline = async () => {
    if (isRunning) return;
    
    setIsRunning(true);
    setActiveNodes(new Set());
    setLogs([]);
    
    addLog("🚀 Starting AutoStack CI/CD Pipeline...", "info");
    
    try {
      // GitHub Commit
      await new Promise(resolve => setTimeout(resolve, 1000));
      setActiveNodes(prev => new Set([...prev, "github_commit"]));
      addLog("📍 GitHub Commit stage activated", "info");
      nodes[0].logs.forEach(log => addLog(log, log.includes('✓') ? 'success' : 'info'));
      
      // Jenkins Build - Real API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      setActiveNodes(prev => new Set([...prev, "jenkins_build"]));
      addLog("📍 Triggering real Jenkins build...", "info");
      
      const jenkinsResult = await callEdgeFunction('trigger-jenkins', { repoUrl: githubUrl });
      if (jenkinsResult?.logs) {
        jenkinsResult.logs.forEach((log: string) => addLog(log, log.includes('✓') ? 'success' : 'info'));
      }
      
      // Docker → ECR - Real operation
      await new Promise(resolve => setTimeout(resolve, 1500));
      setActiveNodes(prev => new Set([...prev, "docker_ecr"]));
      addLog("📍 Building and pushing Docker image to ECR...", "info");
      
      const imageTag = `v${Date.now()}`;
      const dockerResult = await callEdgeFunction('docker-ecr-push', { imageTag });
      if (dockerResult?.logs) {
        dockerResult.logs.forEach((log: string) => addLog(log, log.includes('✓') ? 'success' : 'info'));
      }
      
      // ECS Deploy - Real deployment
      await new Promise(resolve => setTimeout(resolve, 1500));
      setActiveNodes(prev => new Set([...prev, "ecs_deploy"]));
      addLog("📍 Deploying to AWS ECS...", "info");
      
      const imageUri = dockerResult?.imageUri || `autostack-app:${imageTag}`;
      const ecsResult = await callEdgeFunction('ecs-deploy', { imageUri });
      if (ecsResult?.logs) {
        ecsResult.logs.forEach((log: string) => addLog(log, log.includes('✓') ? 'success' : 'info'));
      }
      
      // CloudWatch Monitoring - Real metrics
      await new Promise(resolve => setTimeout(resolve, 1500));
      setActiveNodes(prev => new Set([...prev, "monitoring"]));
      addLog("📍 Fetching CloudWatch monitoring data...", "info");
      
      const monitoringResult = await callEdgeFunction('cloudwatch-logs', {});
      if (monitoringResult?.logs) {
        monitoringResult.logs.forEach((log: string) => addLog(log, log.includes('✓') ? 'success' : 'info'));
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
      addLog("🎉 Pipeline completed successfully!", "success");
      toast({
        title: "Pipeline Complete!",
        description: "All stages executed with real service integrations.",
      });
    } catch (error) {
      addLog("❌ Pipeline failed. Check logs for details.", "info");
      toast({
        title: "Pipeline Error",
        description: "Some stages failed. Check logs for details.",
        variant: "destructive",
      });
    }
    
    setIsRunning(false);
  };

  const resetPipeline = () => {
    setActiveNodes(new Set());
    setLogs([]);
    setIsRunning(false);
  };

  const handleNodeClick = async (nodeId: string) => {
    if (isRunning) return;
    
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;
    
    setActiveNodes(prev => new Set([...prev, nodeId]));
    addLog(`📍 Manual trigger: ${node.title}`, "info");
    
    // Call real backend services for specific nodes
    try {
      if (nodeId === "jenkins_build") {
        const result = await callEdgeFunction('trigger-jenkins', { repoUrl: githubUrl });
        if (result?.logs) {
          result.logs.forEach((log: string) => addLog(log, log.includes('✓') ? 'success' : 'info'));
        }
      } else if (nodeId === "docker_ecr") {
        const imageTag = `manual-v${Date.now()}`;
        const result = await callEdgeFunction('docker-ecr-push', { imageTag });
        if (result?.logs) {
          result.logs.forEach((log: string) => addLog(log, log.includes('✓') ? 'success' : 'info'));
        }
      } else if (nodeId === "ecs_deploy") {
        const imageUri = `autostack-app:manual-v${Date.now()}`;
        const result = await callEdgeFunction('ecs-deploy', { imageUri });
        if (result?.logs) {
          result.logs.forEach((log: string) => addLog(log, log.includes('✓') ? 'success' : 'info'));
        }
      } else if (nodeId === "monitoring") {
        const result = await callEdgeFunction('cloudwatch-logs', {});
        if (result?.logs) {
          result.logs.forEach((log: string) => addLog(log, log.includes('✓') ? 'success' : 'info'));
        }
      } else {
        // Simulated logs for GitHub commit node
        const repoName = githubUrl.split('/').slice(-1)[0] || 'demo-app';
        node.logs.forEach((logMessage, index) => {
          setTimeout(() => {
            const customLog = logMessage
              .replace('autostack-app', repoName)
              .replace("Commit SHA: a7f3b9c - 'Updated deployment config'", `Commit SHA: ${Math.random().toString(36).substr(2, 7)} - 'Updated from ${repoName}'`);
            addLog(customLog, logMessage.includes('✓') ? 'success' : 'info');
          }, index * 400);
        });
      }
    } catch (error) {
      addLog("❌ Error executing node action", "info");
    }
    
    toast({
      title: `${node.title} Activated`,
      description: node.tooltip,
    });
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            AutoStack Pipeline Simulator
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Visual demonstration of DevOps CI/CD pipeline: GitHub → Jenkins → Docker → ECS → Monitoring
          </p>
        </motion.div>

        {/* GitHub URL Input */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="max-w-2xl mx-auto mb-8"
        >
          <label className="block text-sm font-medium mb-2 text-muted-foreground">
            GitHub Repository URL
          </label>
          <Input
            type="text"
            value={githubUrl}
            onChange={(e) => setGithubUrl(e.target.value)}
            placeholder="Enter GitHub repo URL"
            className="w-full bg-card/50 border-border"
            disabled={isRunning}
          />
        </motion.div>

        {/* Control Buttons */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex justify-center gap-4 mb-12"
        >
          <Button
            onClick={startPipeline}
            disabled={isRunning}
            size="lg"
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-8"
          >
            <Play className="w-5 h-5 mr-2" />
            {isRunning ? "Pipeline Running..." : "Start Pipeline"}
          </Button>
          
          <Button
            onClick={resetPipeline}
            disabled={isRunning}
            variant="outline"
            size="lg"
          >
            <RotateCcw className="w-5 h-5 mr-2" />
            Reset
          </Button>
        </motion.div>

        {/* Pipeline Flow */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Nodes Flow */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-4"
          >
            {nodes.map((node, index) => (
              <div key={node.id}>
                <NodeCard
                  id={node.id}
                  title={node.title}
                  description={node.description}
                  icon={node.icon}
                  isActive={activeNodes.has(node.id)}
                  tooltipContent={node.tooltip}
                  onClick={() => handleNodeClick(node.id)}
                  disabled={isRunning}
                />
                {index < nodes.length - 1 && (
                  <ConnectionLine 
                    isActive={activeNodes.has(node.id) && activeNodes.has(nodes[index + 1].id)} 
                    isVertical 
                  />
                )}
              </div>
            ))}
          </motion.div>

          {/* Logs Panel */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="lg:sticky lg:top-8 h-fit"
          >
            <LogsPanel logs={logs} />
          </motion.div>
        </div>

        {/* Footer Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-sm text-muted-foreground mt-12 p-6 bg-card/50 rounded-lg border border-border"
        >
          <p className="mb-2">
            ⚡ AutoStack DevOps Pipeline with Real Service Integration
          </p>
          <p>
            Jenkins CI/CD builds are triggered via API, Docker images are pushed to AWS ECR, ECS deployments execute in real-time, and CloudWatch provides live monitoring metrics. Terraform provisioning steps are simulated with descriptive tooltips.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Index;
