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
    console.log('Starting simulated Jenkins build...');
    
    const { repoUrl } = await req.json();
    
    // Simulate Jenkins build process with realistic logs
    const logs = [
      '🔗 Connecting to Jenkins CI server...',
      `📦 Repository: ${repoUrl}`,
      '🏗️  Running Terraform init...',
      '✅ Terraform providers initialized',
      '📋 Executing Terraform plan...',
      '✅ Infrastructure validation passed',
      '🔧 Compiling application code...',
      '✅ Build completed successfully',
      '🧪 Running unit tests...',
      '✅ All tests passed (23/23)',
      '📊 Code coverage: 87%',
      '✅ Jenkins build completed successfully ✓',
    ];
    
    console.log('Simulated Jenkins build completed successfully');
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        logs,
        message: 'Jenkins build completed successfully' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Error in Jenkins simulation:', error);
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
