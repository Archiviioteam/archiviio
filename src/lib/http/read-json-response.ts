function isHtmlResponse(text: string): boolean {
  const trimmed = text.trimStart();
  return trimmed.startsWith("<!DOCTYPE") || trimmed.startsWith("<html");
}

function htmlResponseMessage(status: number): string {
  if (status === 404) {
    return "Endpoint API non trovato. Verifica che il deploy sia aggiornato.";
  }
  if (status === 401 || status === 403) {
    return "Sessione scaduta. Ricarica la pagina e accedi di nuovo.";
  }
  if (status === 504 || status === 524) {
    return "Operazione troppo lunga. Riprova tra qualche minuto.";
  }
  if (status >= 500) {
    return "Errore del server. Riprova tra qualche minuto.";
  }
  return "Risposta inattesa dal server. Ricarica la pagina (Cmd+Shift+R) e riprova.";
}

export async function readJsonResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type") ?? "";
  const text = await response.text();

  if (!text) {
    return {} as T;
  }

  const looksLikeJson =
    text.trimStart().startsWith("{") || text.trimStart().startsWith("[");

  if (contentType.includes("application/json") || looksLikeJson) {
    try {
      return JSON.parse(text) as T;
    } catch {
      throw new Error("Risposta del server non valida.");
    }
  }

  if (isHtmlResponse(text)) {
    throw new Error(htmlResponseMessage(response.status));
  }

  throw new Error(text.slice(0, 200));
}
