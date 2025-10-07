import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-github-event, x-hub-signature-256',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('GitHub webhook received');
    
    // Verify webhook signature
    const signature = req.headers.get('x-hub-signature-256');
    const secret = Deno.env.get('GITHUB_WEBHOOK_SECRET');
    
    if (!secret) {
      console.error('GITHUB_WEBHOOK_SECRET not configured');
      return new Response(
        JSON.stringify({ error: 'Webhook secret not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!signature) {
      console.error('No signature provided in webhook');
      return new Response(
        JSON.stringify({ error: 'No signature provided' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.text();
    
    // Validate signature using Web Crypto API
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const msgData = encoder.encode(body);
    const hashBuffer = await crypto.subtle.sign('HMAC', key, msgData);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    const expectedSignature = 'sha256=' + hashHex;
    
    if (signature !== expectedSignature) {
      console.error('Invalid webhook signature');
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Webhook signature verified successfully');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const githubEvent = req.headers.get('x-github-event');
    console.log(`GitHub event type: ${githubEvent}`);

    // Only handle push events
    if (githubEvent !== 'push') {
      return new Response(
        JSON.stringify({ message: 'Event ignored', event: githubEvent }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    const payload = JSON.parse(body);
    console.log('Webhook payload received:', JSON.stringify(payload).substring(0, 200));

    const { repository, commits, pusher } = payload;
    const latestCommit = commits[commits.length - 1];

    // Validate GitHub URL
    const repoUrl = repository.clone_url;
    const githubUrlRegex = /^https:\/\/github\.com\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_.-]+(\.git)?$/;
    if (!githubUrlRegex.test(repoUrl)) {
      console.error('Invalid repository URL format:', repoUrl);
      return new Response(
        JSON.stringify({ error: 'Invalid repository URL' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create a new pipeline run
    const { data: pipelineRun, error: runError } = await supabase
      .from('pipeline_runs')
      .insert({
        github_repo: repository.full_name,
        commit_sha: latestCommit.id,
        commit_message: latestCommit.message,
        status: 'pending',
        triggered_by: 'webhook'
      })
      .select()
      .single();

    if (runError) {
      console.error('Error creating pipeline run:', runError);
      throw runError;
    }

    console.log('Pipeline run created:', pipelineRun.id);

    // Create initial build stages
    const stages = ['github_commit', 'jenkins_build', 'docker_ecr', 'ecs_deploy', 'monitoring'];
    const stageInserts = stages.map(stage => ({
      pipeline_run_id: pipelineRun.id,
      stage_name: stage,
      status: 'pending',
      logs: []
    }));

    const { error: stagesError } = await supabase
      .from('build_stages')
      .insert(stageInserts);

    if (stagesError) {
      console.error('Error creating build stages:', stagesError);
      throw stagesError;
    }

    console.log('Build stages created successfully');

    // Trigger the pipeline execution asynchronously
    fetch(`${supabaseUrl}/functions/v1/run-pipeline`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`
      },
      body: JSON.stringify({
        pipelineRunId: pipelineRun.id,
        repoUrl: repository.clone_url
      })
    }).catch(err => console.error('Error triggering pipeline:', err));

    return new Response(
      JSON.stringify({
        success: true,
        pipelineRunId: pipelineRun.id,
        message: 'Webhook processed successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Error processing webhook:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
