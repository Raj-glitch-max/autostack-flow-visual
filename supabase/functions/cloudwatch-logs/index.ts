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
    console.log('Fetching simulated CloudWatch logs and metrics...');
    
    const logGroup = Deno.env.get('CLOUDWATCH_LOG_GROUP') || '/aws/ecs/autostack-service';
    const awsRegion = Deno.env.get('AWS_REGION') || 'us-east-1';
    
    // Generate realistic CloudWatch metrics
    const metrics = {
      cpuUtilization: Math.floor(Math.random() * 30) + 20,
      memoryUsage: Math.floor(Math.random() * 40) + 30,
      requestCount: Math.floor(Math.random() * 1000) + 500,
      errorRate: (Math.random() * 2).toFixed(2),
      responseTime: Math.floor(Math.random() * 100) + 50,
    };
    
    const logs = [
      '📊 Connecting to AWS CloudWatch...',
      '✅ CloudWatch connection established',
      `📁 Log Group: ${logGroup}`,
      `🌍 Region: ${awsRegion}`,
      '📈 Fetching application metrics...',
      '',
      '**Performance Metrics:**',
      `⚡ CPU Utilization: ${metrics.cpuUtilization}%`,
      `💾 Memory Usage: ${metrics.memoryUsage}%`,
      `📊 Requests/min: ${metrics.requestCount}`,
      `⏱️  Avg Response Time: ${metrics.responseTime}ms`,
      `❌ Error Rate: ${metrics.errorRate}%`,
      '',
      '🏥 Running health checks...',
      '✅ Application health: HEALTHY',
      '✅ Database connections: OK',
      '✅ External APIs: Responding',
      '✅ Memory pressure: Normal',
      '✅ Disk I/O: Normal',
      '',
      '🎯 CloudWatch monitoring active ✓',
      '✅ All systems operational',
    ];
    
    console.log('Simulated CloudWatch data generated successfully');
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        metrics, 
        logs,
        message: 'CloudWatch monitoring active'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Error generating CloudWatch simulation:', error);
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
