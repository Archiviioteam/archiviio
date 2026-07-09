export async function readJsonResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type") ?? "";
  const text = await response.text();

  if (!text) {
    return {} as T;
  }

  if (!contentType.includes("application/json")) {
    if (text.trimStart().startsWith("<!DOCTYPE") || text.trimStart().startsWith("<html")) {
      throw new Error(
        response.status === 404
          ? "Endpoint API non trovato. Verifica che il deploy sia aggiornato."
          : "Il server ha risposto con HTML invece di JSON. Riprova ad accedere o aggiorna la pagina."
      );
    }

    throw new Error(text.slice(0, 200));
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error("Risposta del server non valida.");
  }
}
