import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

let _client: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      lock:
        typeof navigator !== "undefined" && navigator.locks
          ? async <R>(name: string, acquireTimeout: number, fn: () => Promise<R>): Promise<R> => {
              const timeout = Math.min(acquireTimeout, 3000);
              const abortController = new AbortController();
              const timer = setTimeout(() => abortController.abort(), timeout);
              try {
                return await navigator.locks.request(
                  name,
                  { signal: abortController.signal },
                  async () => fn()
                );
              } catch {
                // If lock acquisition times out, continue without waiting to avoid hanging auth.
                return await fn();
              } finally {
                clearTimeout(timer);
              }
            }
          : undefined,
    },
  });
}

export function getSupabaseClient() {
  if (!_client) {
    _client = createClient();
  }
  return _client;
}

export const supabase = getSupabaseClient();
