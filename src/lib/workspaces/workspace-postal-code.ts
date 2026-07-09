import type { SupabaseClient } from "@supabase/supabase-js";

export async function workspaceSupportsPostalCode(
  supabase: SupabaseClient
): Promise<boolean> {
  const { error } = await supabase
    .from("workspaces")
    .select("postal_code")
    .limit(0);

  return !error;
}

export function buildWorkspaceAddressUpdate(
  address: string,
  postalCode: string,
  supportsPostalCode: boolean
): string | null {
  const street = address.trim();
  const postal = postalCode.trim();

  if (supportsPostalCode) {
    return street || null;
  }

  return [street, postal].filter(Boolean).join(", ") || null;
}
