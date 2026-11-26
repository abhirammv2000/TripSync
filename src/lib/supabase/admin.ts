import { createClient } from "@supabase/supabase-js";

/**
 * Server-only client that bypasses row level security.
 *
 * It exists because members can only read their own preferences. The leader's
 * routes (synthesize, recommend, generate) need everyone's preferences to plan
 * one trip, so they verify the caller is the leader first and then read through
 * this client. Never import this from a client component.
 */
export function createAdminClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
        throw new Error(
            "SUPABASE_SERVICE_ROLE_KEY is not set. The leader routes need it to read every member's preferences."
        );
    }

    return createClient(url, key, {
        auth: { persistSession: false, autoRefreshToken: false },
    });
}
