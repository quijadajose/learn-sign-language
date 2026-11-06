/**
 * FE-06: los tokens de reset y el código OAuth viajan en el fragmento de la URL.
 * Una vez leídos se borran del historial para que no queden en la barra ni en el historial del navegador.
 */
export function consumeUrlHash(): void {
  try {
    if (typeof window === "undefined" || !window.location.hash) return;
    window.history.replaceState(
      window.history.state,
      "",
      window.location.pathname + window.location.search,
    );
  } catch {
    /* navegadores sin History API: se deja el hash tal cual */
  }
}
