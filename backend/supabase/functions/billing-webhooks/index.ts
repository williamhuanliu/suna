// Stub for local Supabase: config references this function.
// Replace with real Stripe/webhook handler when needed.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (_req: Request) => {
  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
    status: 200,
  });
});
