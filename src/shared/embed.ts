/**
 * The React voice workspace normally runs inside the ORBIT website's
 * "Crew voice AI assistant" tab (ui/voice.js embeds /voice/assistant?embed=1).
 * The website then provides the sidebar, top bar and page title, so this app
 * renders only its content, and links that leave the assistant open the
 * website's own tabs instead of this app's placeholder routes.
 */
export const EMBEDDED: boolean = (() => {
  try {
    return new URLSearchParams(window.location.search).has("embed") || window.self !== window.top;
  } catch {
    return true; // cross-origin parent: still embedded
  }
})();

/** The website's right-hand panel, not the full Crew voice tab. */
export const DOCKED: boolean = (() => {
  try {
    return new URLSearchParams(window.location.search).has("dock");
  } catch {
    return false;
  }
})();

/** This app's route → the website tab that shows it. */
const WEBSITE_TAB: Record<string, string> = {
  crew: "crew",
  anatomy: "anatomy",
  evidence: "research",
  assistant: "voice",
};

/** Website URL for an in-app path such as `/anatomy?region=knee_left`. */
export function websiteHref(path: string): string {
  const [pathname, query = ""] = path.split("?");
  const first = pathname.replace(/^\/+/, "").split("/")[0];
  const tab = WEBSITE_TAB[first] ?? "status";
  return `/#${tab}${query ? `?${query}` : ""}`;
}

/** Open a website tab from inside the embedded workspace. */
export function openInWebsite(path: string): void {
  const target = websiteHref(path);
  try {
    (window.top ?? window).location.href = target;
  } catch {
    window.location.href = target;
  }
}
