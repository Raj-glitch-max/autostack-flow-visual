import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { pipelineRunId, repoUrl } = await req.json();
    console.log(`Starting pipeline execution for run: ${pipelineRunId}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Update pipeline status to running
    await supabase
      .from('pipeline_runs')
      .update({ status: 'running' })
      .eq('id', pipelineRunId);

    // Fetch pipeline stages from database
    const { data: stagesConfig, error: stagesError } = await supabase
      .from('pipeline_stages_config')
      .select('stage_name, function_name')
      .eq('template_id', '00000000-0000-0000-0000-000000000001')
      .order('order_index', { ascending: true });

    if (stagesError) {
      throw new Error(`Failed to fetch pipeline configuration: ${stagesError.message}`);
    }

    const stages = stagesConfig.map(stage => ({
      name: stage.stage_name,
      function: stage.function_name
    }));

    let imageUri = '';
    let allSuccess = true;

    for (const stage of stages) {
      console.log(`Processing stage: ${stage.name}`);
      
      // Update stage to running
      const { data: stageData } = await supabase
        .from('build_stages')
        .select('id')
        .eq('pipeline_run_id', pipelineRunId)
        .eq('stage_name', stage.name)
        .single();

      if (!stageData) continue;

      await supabase
        .from('build_stages')
        .update({
          status: 'running',
          started_at: new Date().toISOString()
        })
        .eq('id', stageData.id);

      let logs: string[] = [];
      let success = true;

      try {
        if (stage.function) {
          // Call the actual edge function
          let payload: any = {};
          
          if (stage.name === 'jenkins_build') {
            payload = { repoUrl };
          } else if (stage.name === 'docker_ecr') {
            payload = { imageTag: `v${Date.now()}` };
          } else if (stage.name === 'ecs_deploy') {
            payload = { imageUri };
          }

          const response = await fetch(`${supabaseUrl}/functions/v1/${stage.function}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseKey}`
            },
            body: JSON.stringify(payload)
          });

          const result = await response.json();
          
          if (result.success && result.logs) {
            logs = result.logs;
            if (stage.name === 'docker_ecr' && result.imageUri) {
              imageUri = result.imageUri;
            }
          } else {
            success = false;
            logs = [`Error: ${result.error || 'Stage failed'}`];
          }
        } else {
          // Simulated stage (GitHub commit)
          logs = [
            'Received webhook from GitHub...',
            `Repository: ${repoUrl}`,
            'Pipeline triggered successfully ✓'
          ];
        }

        // Update stage with results
        await supabase
          .from('build_stages')
          .update({
            status: success ? 'success' : 'failed',
            logs,
            completed_at: new Date().toISOString()
          })
          .eq('id', stageData.id);

        if (!success) {
          allSuccess = false;
          break;
        }

      } catch (error) {
        console.error(`Error in stage ${stage.name}:`, error);
        await supabase
          .from('build_stages')
          .update({
            status: 'failed',
            logs: [`Error: ${error instanceof Error ? error.message : 'Unknown error'}`],
            completed_at: new Date().toISOString()
          })
          .eq('id', stageData.id);
        
        allSuccess = false;
        break;
      }

      // Small delay between stages
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Create deployment record if we got an image URI
    if (imageUri && allSuccess) {
      await supabase
        .from('deployments')
        .insert({
          pipeline_run_id: pipelineRunId,
          image_tag: imageUri.split(':').pop() || 'latest',
          image_uri: imageUri,
          ecs_service: Deno.env.get('ECS_SERVICE_NAME'),
          status: 'deployed'
        });
    }

    // Update final pipeline status
    await supabase
      .from('pipeline_runs')
      .update({
        status: allSuccess ? 'success' : 'failed',
        completed_at: new Date().toISOString()
      })
      .eq('id', pipelineRunId);

    console.log(`Pipeline execution completed: ${allSuccess ? 'success' : 'failed'}`);

    return new Response(
      JSON.stringify({
        success: allSuccess,
        pipelineRunId,
        message: `Pipeline ${allSuccess ? 'completed successfully' : 'failed'}`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Error running pipeline:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
