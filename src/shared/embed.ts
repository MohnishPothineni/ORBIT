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

/**
 * The website's own pages (PAGE_NAMES in ui/app.js), by tab id. The navigate tool can
 * open these only when this app runs inside the website.
 */
export const WEBSITE_PAGES: Record<string, string> = {
  status: "Crew status",
  crew: "Crew profiles",
  log: "Health log & trends",
  // Merged into other pages; the website still opens these paths (as a section or tab).
  trends: "Health log & trends",
  care: "Health assessment",
  wellbeing: "Health assessment / Sleep & wellbeing",
  exercise: "Health assessment / Exercise",
  skin: "Health assessment / Skin & wounds",
  routine: "Daily routine",
  risks: "Health risk readings",
  anatomy: "Anatomy lab",
  voice: "Crew voice AI assistant",
  research: "Offline evidence library",
};

/** The website tab a path opens: `/evidence` gives `research`, `/log` gives `log`. */
export function websiteTab(path: string): string {
  const first = path.split(/[?#]/)[0].replace(/^\/+/, "").split("/")[0];
  return WEBSITE_TAB[first] ?? (Object.hasOwn(WEBSITE_PAGES, first) ? first : "status");
}

/** Website URL for an in-app path such as `/anatomy?region=knee_left`. */
export function websiteHref(path: string): string {
  const [, rawQuery = ""] = path.split("?");
  const params = new URLSearchParams(rawQuery);
  // This app's crew (c01 to c04, callsigns VEGA, HALO, TALON, IRIS) are the website's crew-01 to
  // crew-04. Anything else, such as a name ("Gordon Cooper"), is matched by the website itself.
  const crew = params.get("crew")?.trim();
  const callsign = ["VEGA", "HALO", "TALON", "IRIS"].indexOf((crew ?? "").toUpperCase());
  if (crew && /^c\d{2}$/i.test(crew)) params.set("crew", `crew-${crew.slice(1)}`);
  else if (callsign >= 0) params.set("crew", `crew-0${callsign + 1}`);
  const query = params.toString();
  const tab = websiteTab(path);
  return `/#${tab}${query ? `?${query}` : ""}`;
}

/**
 * Tell the website about something this app did, such as a saved vital, so it can update
 * its own records. Same origin only; the website checks that the sender is its voice frame.
 */
export function notifyWebsite(message: Record<string, unknown>): void {
  if (!EMBEDDED || window.parent === window) return;
  try {
    window.parent.postMessage(message, window.location.origin);
  } catch {
    /* no parent to tell */
  }
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
