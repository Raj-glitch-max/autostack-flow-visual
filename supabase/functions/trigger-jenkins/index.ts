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
    console.log("Triggering Jenkins build...");
    
    const { repoUrl } = await req.json();
    
    const jenkinsUrl = Deno.env.get('JENKINS_URL');
    const jenkinsUsername = Deno.env.get('JENKINS_USERNAME');
    const jenkinsToken = Deno.env.get('JENKINS_API_TOKEN');
    const jobName = Deno.env.get('JENKINS_JOB_NAME');

    if (!jenkinsUrl || !jenkinsUsername || !jenkinsToken || !jobName) {
      throw new Error('Jenkins credentials not configured');
    }

    const auth = btoa(`${jenkinsUsername}:${jenkinsToken}`);
    const buildUrl = `${jenkinsUrl}/job/${jobName}/buildWithParameters?REPO_URL=${encodeURIComponent(repoUrl)}`;

    console.log(`Triggering Jenkins job at: ${buildUrl}`);

    const response = await fetch(buildUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Jenkins API error: ${response.status} - ${errorText}`);
      throw new Error(`Jenkins build trigger failed: ${response.statusText}`);
    }

    console.log("Jenkins build triggered successfully");

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Jenkins build triggered successfully',
        logs: [
          `[${new Date().toISOString()}] Connecting to Jenkins at ${jenkinsUrl}`,
          `[${new Date().toISOString()}] Authenticating as ${jenkinsUsername}`,
          `[${new Date().toISOString()}] Triggering job: ${jobName}`,
          `[${new Date().toISOString()}] Repository: ${repoUrl}`,
          `[${new Date().toISOString()}] ✓ Build queued successfully`,
        ],
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Error triggering Jenkins:', error);
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
