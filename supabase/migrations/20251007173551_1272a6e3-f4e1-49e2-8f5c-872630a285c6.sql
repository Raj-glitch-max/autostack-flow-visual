-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'developer', 'viewer');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

-- Only admins can insert/update roles
CREATE POLICY "Admins can manage roles"
ON public.user_roles
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Update RLS policies for pipeline_runs
DROP POLICY IF EXISTS "Allow public insert to pipeline_runs" ON public.pipeline_runs;
DROP POLICY IF EXISTS "Allow public read access to pipeline_runs" ON public.pipeline_runs;
DROP POLICY IF EXISTS "Allow public update to pipeline_runs" ON public.pipeline_runs;

CREATE POLICY "Authenticated users can view pipeline runs"
ON public.pipeline_runs
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins and developers can create pipeline runs"
ON public.pipeline_runs
FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'developer')
);

CREATE POLICY "Admins can update pipeline runs"
ON public.pipeline_runs
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Update RLS policies for build_stages
DROP POLICY IF EXISTS "Allow public insert to build_stages" ON public.build_stages;
DROP POLICY IF EXISTS "Allow public read access to build_stages" ON public.build_stages;
DROP POLICY IF EXISTS "Allow public update to build_stages" ON public.build_stages;

CREATE POLICY "Authenticated users can view build stages"
ON public.build_stages
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage build stages"
ON public.build_stages
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Update RLS policies for deployments
DROP POLICY IF EXISTS "Allow public insert to deployments" ON public.deployments;
DROP POLICY IF EXISTS "Allow public read access to deployments" ON public.deployments;
DROP POLICY IF EXISTS "Allow public update to deployments" ON public.deployments;

CREATE POLICY "Authenticated users can view deployments"
ON public.deployments
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage deployments"
ON public.deployments
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Create service_accounts table for edge function authentication
CREATE TABLE public.service_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  api_key TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_used_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.service_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can manage service accounts"
ON public.service_accounts
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Function to validate service account
CREATE OR REPLACE FUNCTION public.validate_service_account(_api_key TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.service_accounts
    WHERE api_key = _api_key
  )
$$;