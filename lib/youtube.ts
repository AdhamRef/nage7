/**
 * Pulls the 11-character video id out of any of the URL shapes YouTube hands
 * people: watch?v=, youtu.be/, /embed/, /shorts/, /live/, or a bare id.
 * Returns null for anything else, so a typo never gets stored as a video.
 */
export const parseYoutubeId = (input: string): string | null => {
  const value = input.trim();
  if (!value) return null;

  if (/^[A-Za-z0-9_-]{11}$/.test(value)) return value;

  let url: URL;
  try {
    url = new URL(value.startsWith("http") ? value : `https://${value}`);
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^www\.|^m\./, "");
  if (!/^(youtube\.com|youtube-nocookie\.com|youtu\.be)$/.test(host)) {
    return null;
  }

  const fromQuery = url.searchParams.get("v");
  if (fromQuery && /^[A-Za-z0-9_-]{11}$/.test(fromQuery)) return fromQuery;

  const match = url.pathname.match(
    /^\/(?:embed\/|shorts\/|live\/|v\/)?([A-Za-z0-9_-]{11})(?:[/?]|$)/
  );
  return match ? match[1] : null;
};

export const youtubeThumbnail = (id: string) =>
  `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
