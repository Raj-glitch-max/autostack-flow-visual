-- Create pipeline_runs table to track all pipeline executions
CREATE TABLE public.pipeline_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  github_repo TEXT NOT NULL,
  commit_sha TEXT,
  commit_message TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, running, success, failed
  triggered_by TEXT DEFAULT 'manual',
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create build_stages table to track individual stage progress
CREATE TABLE public.build_stages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pipeline_run_id UUID NOT NULL REFERENCES public.pipeline_runs(id) ON DELETE CASCADE,
  stage_name TEXT NOT NULL, -- github_commit, jenkins_build, docker_ecr, ecs_deploy, monitoring
  status TEXT NOT NULL DEFAULT 'pending', -- pending, running, success, failed
  logs TEXT[],
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create deployments table to track ECS deployments
CREATE TABLE public.deployments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pipeline_run_id UUID NOT NULL REFERENCES public.pipeline_runs(id) ON DELETE CASCADE,
  image_tag TEXT NOT NULL,
  image_uri TEXT,
  ecs_service TEXT,
  status TEXT NOT NULL DEFAULT 'deploying', -- deploying, deployed, failed
  deployed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pipeline_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.build_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deployments ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (since this is a demo simulator)
CREATE POLICY "Allow public read access to pipeline_runs" 
ON public.pipeline_runs FOR SELECT USING (true);

CREATE POLICY "Allow public insert to pipeline_runs" 
ON public.pipeline_runs FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update to pipeline_runs" 
ON public.pipeline_runs FOR UPDATE USING (true);

CREATE POLICY "Allow public read access to build_stages" 
ON public.build_stages FOR SELECT USING (true);

CREATE POLICY "Allow public insert to build_stages" 
ON public.build_stages FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update to build_stages" 
ON public.build_stages FOR UPDATE USING (true);

CREATE POLICY "Allow public read access to deployments" 
ON public.deployments FOR SELECT USING (true);

CREATE POLICY "Allow public insert to deployments" 
ON public.deployments FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update to deployments" 
ON public.deployments FOR UPDATE USING (true);

-- Create indexes for better query performance
CREATE INDEX idx_pipeline_runs_created_at ON public.pipeline_runs(created_at DESC);
CREATE INDEX idx_pipeline_runs_status ON public.pipeline_runs(status);
CREATE INDEX idx_build_stages_pipeline_run_id ON public.build_stages(pipeline_run_id);
CREATE INDEX idx_deployments_pipeline_run_id ON public.deployments(pipeline_run_id);

-- Enable realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.pipeline_runs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.build_stages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.deployments;