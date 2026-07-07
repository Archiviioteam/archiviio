export async function openDocumentWithSystem(
  _url: string,
  _fileName: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  return { ok: false, error: "not-desktop" };
}
