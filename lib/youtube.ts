const ID = /^[A-Za-z0-9_-]{11}$/;

/**
 * Pulls the 11-character video id out of any of the URL shapes YouTube hands
 * people: watch?v=, youtu.be/, /embed/, /shorts/, /live/, the Studio editor
 * (studio.youtube.com/video/ID/edit), any youtube.com subdomain, or a bare
 * id. Returns null for anything else, so a typo never gets stored as a video.
 */
export const parseYoutubeId = (input: string): string | null => {
  const value = input.trim();
  if (!value) return null;

  if (ID.test(value)) return value;

  let url: URL;
  try {
    url = new URL(value.startsWith("http") ? value : `https://${value}`);
  } catch {
    return null;
  }

  // studio., music., m., www., gaming. — all the same video ids.
  const host = url.hostname.toLowerCase();
  const isYoutube =
    host === "youtu.be" ||
    host === "youtube.com" ||
    host.endsWith(".youtube.com") ||
    host === "youtube-nocookie.com" ||
    host.endsWith(".youtube-nocookie.com");
  if (!isYoutube) return null;

  const fromQuery = url.searchParams.get("v");
  if (fromQuery && ID.test(fromQuery)) return fromQuery;

  // /ID, /embed/ID, /shorts/ID, /live/ID, /v/ID, /video/ID/edit (Studio)
  const match = url.pathname.match(
    /^\/(?:embed\/|shorts\/|live\/|v\/|video\/)?([A-Za-z0-9_-]{11})(?:[/?]|$)/
  );
  return match ? match[1] : null;
};

export const youtubeThumbnail = (id: string) =>
  `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
