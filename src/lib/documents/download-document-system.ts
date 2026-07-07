export async function downloadDocumentToSystem(
  _url: string,
  _fileName: string
): Promise<{ ok: true; path: string } | { ok: false; error: string }> {
  return { ok: false, error: "not-desktop" };
}
