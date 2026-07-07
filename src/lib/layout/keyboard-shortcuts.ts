export function isMacPlatform(): boolean {
  if (typeof navigator === "undefined") {
    return false;
  }

  const platform = navigator.platform.toLowerCase();
  const userAgent = navigator.userAgent.toLowerCase();

  return platform.includes("mac") || userAgent.includes("mac");
}

export function getCommandPaletteShortcutLabel(): string {
  return isMacPlatform() ? "⌘K" : "Ctrl+K";
}

export function getCommandEnterShortcutLabel(): string {
  return isMacPlatform() ? "⌘↵" : "Ctrl+Enter";
}
