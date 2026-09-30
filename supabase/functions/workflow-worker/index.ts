import {createClient} from "npm:@supabase/supabase-js@2";

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {"Content-Type": "application/json", "Cache-Control": "no-store"},
  });
}

function secretsMatch(expected: string, provided: string) {
  if (expected.length !== provided.length) return false;
  let mismatch = 0;
  for (let index = 0; index < expected.length; index += 1) {
    mismatch |= expected.charCodeAt(index) ^ provided.charCodeAt(index);
  }
  return mismatch === 0;
}

Deno.serve(async (request) => {
  if (request.method !== "POST") return json({error: "Method not allowed"}, 405);

  const expectedSecret = Deno.env.get("WORKFLOW_CRON_SECRET") ?? "";
  const providedSecret = request.headers.get("x-workflow-cron-secret") ?? "";
  if (expectedSecret.length < 32 || !secretsMatch(expectedSecret, providedSecret)) {
    return json({error: "Unauthorized"}, 401);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) return json({error: "Worker is not configured"}, 503);

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {persistSession: false, autoRefreshToken: false, detectSessionInUrl: false},
  });
  const {data, error} = await supabase.rpc("process_workflow_tasks");
  if (error) return json({error: "Workflow processing failed"}, 500);

  return json({ok: true, ...data});
});