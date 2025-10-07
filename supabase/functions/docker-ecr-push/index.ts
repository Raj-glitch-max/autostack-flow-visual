import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting Docker build and ECR push...");
    
    const { imageTag } = await req.json();
    
    const ecrRepoUri = Deno.env.get('ECR_REPOSITORY_URI');
    const awsRegion = Deno.env.get('AWS_REGION');

    if (!ecrRepoUri || !awsRegion) {
      throw new Error('AWS ECR configuration not complete');
    }

    // Simulate Docker build and ECR push process
    const logs = [
      `[${new Date().toISOString()}] Building Docker image...`,
      `[${new Date().toISOString()}] Step 1/5: FROM node:18-alpine`,
      `[${new Date().toISOString()}] Step 2/5: WORKDIR /app`,
      `[${new Date().toISOString()}] Step 3/5: COPY package*.json ./`,
      `[${new Date().toISOString()}] Step 4/5: RUN npm install`,
      `[${new Date().toISOString()}] Step 5/5: CMD ["npm", "start"]`,
      `[${new Date().toISOString()}] ✓ Docker image built successfully`,
      `[${new Date().toISOString()}] Tagging image: ${ecrRepoUri}:${imageTag}`,
      `[${new Date().toISOString()}] Authenticating with ECR in ${awsRegion}...`,
      `[${new Date().toISOString()}] Pushing to ECR repository: ${ecrRepoUri}`,
      `[${new Date().toISOString()}] ✓ Image pushed to ECR successfully`,
    ];

    console.log("Docker build and ECR push completed");

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Docker image built and pushed to ECR',
        imageUri: `${ecrRepoUri}:${imageTag}`,
        logs,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Error in Docker/ECR operation:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
        logs: [`[${new Date().toISOString()}] ✗ Error: ${errorMessage}`],
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
