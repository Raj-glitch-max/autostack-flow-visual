-- Create pipeline templates table
CREATE TABLE public.pipeline_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create pipeline stages configuration table
CREATE TABLE public.pipeline_stages_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid REFERENCES public.pipeline_templates(id) ON DELETE CASCADE NOT NULL,
  stage_name text NOT NULL,
  display_name text NOT NULL,
  description text,
  icon text,
  function_name text,
  order_index integer NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.pipeline_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipeline_stages_config ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Allow public read access to pipeline_templates"
ON public.pipeline_templates FOR SELECT USING (true);

CREATE POLICY "Allow public read access to pipeline_stages_config"
ON public.pipeline_stages_config FOR SELECT USING (true);

-- Insert default pipeline template
INSERT INTO public.pipeline_templates (id, name, description)
VALUES ('00000000-0000-0000-0000-000000000001', 'Default CI/CD Pipeline', 'Standard Jenkins → Docker → ECS → CloudWatch pipeline');

-- Insert default pipeline stages
INSERT INTO public.pipeline_stages_config (template_id, stage_name, display_name, description, icon, function_name, order_index)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'github_commit', 'GitHub Commit', 'Triggers the CI/CD pipeline', 'GitBranch', null, 1),
  ('00000000-0000-0000-0000-000000000001', 'jenkins_build', 'Jenkins Build', 'CI build & Terraform provision infra', 'Boxes', 'trigger-jenkins', 2),
  ('00000000-0000-0000-0000-000000000001', 'docker_ecr', 'Docker → ECR', 'Image built and pushed to AWS ECR', 'Container', 'docker-ecr-push', 3),
  ('00000000-0000-0000-0000-000000000001', 'ecs_deploy', 'ECS Deploy', 'Terraform deploys container to ECS', 'Cloud', 'ecs-deploy', 4),
  ('00000000-0000-0000-0000-000000000001', 'monitoring', 'Monitoring', 'CloudWatch monitors app performance', 'Activity', 'cloudwatch-logs', 5);