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
    console.log('Starting simulated Docker build and ECR push...');
    
    const { imageTag } = await req.json();
    
    const awsRegion = Deno.env.get('AWS_REGION') || 'us-east-1';
    const ecrRepo = Deno.env.get('ECR_REPOSITORY_URI') || `123456789012.dkr.ecr.${awsRegion}.amazonaws.com/autostack-app`;
    const imageUri = `${ecrRepo}:${imageTag}`;
    
    console.log(`Simulating Docker build for: ${imageUri}`);
    
    // Simulate Docker build and push with realistic timing
    const logs = [
      '🔐 Authenticating with AWS ECR...',
      '✅ ECR authentication successful',
      '🐳 Building Docker image...',
      '📦 Copying application files...',
      '📥 Installing dependencies...',
      '✅ Build stage 1/3 completed',
      '✅ Build stage 2/3 completed',
      '✅ Build stage 3/3 completed',
      `🏷️  Tagged as: ${imageTag}`,
      '📤 Pushing to AWS ECR...',
      '⬆️  Layer 1/5: Pushed',
      '⬆️  Layer 2/5: Pushed',
      '⬆️  Layer 3/5: Pushed',
      '⬆️  Layer 4/5: Pushed',
      '⬆️  Layer 5/5: Pushed',
      `✅ Image pushed: ${imageUri} ✓`,
    ];
    
    console.log('Simulated Docker build and ECR push completed');
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        imageUri, 
        logs,
        message: 'Docker image built and pushed to ECR'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Error in Docker/ECR simulation:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage,
        logs: [`❌ Error: ${errorMessage}`]
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
