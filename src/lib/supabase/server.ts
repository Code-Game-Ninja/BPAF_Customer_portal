import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export function createServiceClient() {
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

let _serviceClient: ReturnType<typeof createServiceClient> | null = null;

export function getServiceClient() {
  if (!_serviceClient) {
    _serviceClient = createServiceClient();
  }
  return _serviceClient;
}

export const supabaseAdmin = getServiceClient();
