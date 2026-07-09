export interface FetchApiInit extends RequestInit {
  /** @default false */
  allowRedirect?: boolean;
}

export async function fetchApi(
  input: RequestInfo | URL,
  init: FetchApiInit = {}
): Promise<Response> {
  const { allowRedirect = false, credentials = "same-origin", ...rest } = init;

  const response = await fetch(input, {
    ...rest,
    credentials,
    redirect: allowRedirect ? "follow" : "manual",
  });

  if (response.status === 401 || response.status === 403) {
    throw new Error("Sessione scaduta. Ricarica la pagina e accedi di nuovo.");
  }

  if (response.status >= 300 && response.status < 400) {
    throw new Error("Sessione scaduta. Ricarica la pagina e accedi di nuovo.");
  }

  return response;
}
