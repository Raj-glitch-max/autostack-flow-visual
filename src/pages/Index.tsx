import { useState } from "react";
import { motion } from "framer-motion";
import { GitBranch, Wrench, Container, Cloud, Activity, Play, RotateCcw } from "lucide-react";
import { NodeCard } from "@/components/NodeCard";
import { ConnectionLine } from "@/components/ConnectionLine";
import { LogsPanel } from "@/components/LogsPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";

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
    tooltip: "Developer commits code. This triggers the CI/CD pipeline.",
    logs: [
      "Received webhook from GitHub...",
      "Commit SHA: a7f3b9c - 'Updated deployment config'",
      "Pipeline triggered successfully ✓",
    ],
  },
  {
    id: "jenkins_build",
    title: "Jenkins Build",
    description: "CI build & Terraform provision infra",
    icon: Wrench,
    tooltip: "CI build triggered. Terraform scripts would run here to provision infra.",
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
    description: "Image built and pushed to AWS ECR",
    icon: Container,
    tooltip: "Docker image built and pushed to AWS ECR.",
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
    description: "Terraform deploys container to ECS",
    icon: Cloud,
    tooltip: "Terraform provisions ECS service and deploys container.",
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
    description: "CloudWatch monitors app performance",
    icon: Activity,
    tooltip: "CloudWatch / Prometheus monitors the application performance.",
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

  const startPipeline = async () => {
    if (isRunning) return;
    
    setIsRunning(true);
    setActiveNodes(new Set());
    setLogs([]);
    
    addLog("🚀 Starting AutoStack CI/CD Pipeline...", "info");
    
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setActiveNodes(prev => new Set([...prev, node.id]));
      
      for (const logMessage of node.logs) {
        await new Promise(resolve => setTimeout(resolve, 400));
        addLog(logMessage, logMessage.includes('✓') ? 'success' : 'info');
      }
    }
    
    await new Promise(resolve => setTimeout(resolve, 500));
    addLog("🎉 Pipeline completed successfully!", "success");
    toast({
      title: "Pipeline Complete!",
      description: "All stages executed successfully.",
    });
    
    setIsRunning(false);
  };

  const resetPipeline = () => {
    setActiveNodes(new Set());
    setLogs([]);
    setIsRunning(false);
  };

  const handleNodeClick = (nodeId: string) => {
    if (isRunning) return;
    
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;
    
    setActiveNodes(prev => new Set([...prev, nodeId]));
    
    addLog(`📍 Manual trigger: ${node.title}`, "info");
    
    const repoName = githubUrl.split('/').slice(-1)[0] || 'demo-app';
    
    node.logs.forEach((logMessage, index) => {
      setTimeout(() => {
        const customLog = logMessage
          .replace('autostack-app', repoName)
          .replace("Commit SHA: a7f3b9c - 'Updated deployment config'", `Commit SHA: ${Math.random().toString(36).substr(2, 7)} - 'Updated from ${repoName}'`);
        addLog(customLog, logMessage.includes('✓') ? 'success' : 'info');
      }, index * 400);
    });
    
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
            ⚡ This is a visual simulation of the AutoStack DevOps workflow
          </p>
          <p>
            Real implementation uses Terraform for infrastructure provisioning, Jenkins for CI/CD, AWS ECS for container orchestration, and CloudWatch for monitoring
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Index;
