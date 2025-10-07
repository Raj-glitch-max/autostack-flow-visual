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
    console.log('Starting simulated ECS deployment...');
    
    const { imageUri } = await req.json();
    
    const ecsCluster = Deno.env.get('ECS_CLUSTER_NAME') || 'autostack-cluster';
    const ecsService = Deno.env.get('ECS_SERVICE_NAME') || 'autostack-service';
    const awsRegion = Deno.env.get('AWS_REGION') || 'us-east-1';
    
    console.log(`Simulating ECS deployment: ${ecsService} in ${ecsCluster}`);
    
    // Simulate ECS deployment with Terraform
    const logs = [
      '🏗️  Running Terraform apply for ECS deployment...',
      '✅ Terraform lock acquired',
      `📋 Updating ECS service: ${ecsService}`,
      `🌍 Cluster: ${ecsCluster}`,
      `📍 Region: ${awsRegion}`,
      `🖼️  Image: ${imageUri}`,
      '📝 Creating new task definition revision...',
      '✅ Task definition registered: revision 47',
      '🔄 Updating service with new task definition...',
      '⏳ Waiting for deployment to stabilize...',
      '✅ Old tasks draining (2/2)...',
      '✅ New tasks starting (2/2)...',
      '🏥 Running health checks...',
      '✅ Health check passed: Task 1/2',
      '✅ Health check passed: Task 2/2',
      '✅ Service updated successfully',
      '✅ Deployment completed successfully ✓',
    ];
    
    console.log('Simulated ECS deployment completed');
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        logs,
        cluster: ecsCluster,
        service: ecsService,
        message: 'ECS deployment completed'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Error in ECS deployment simulation:', error);
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
