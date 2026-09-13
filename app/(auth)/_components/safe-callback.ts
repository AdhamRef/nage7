/**
 * Where to send someone after they finish signing up or onboarding.
 *
 * Only ever an in-app path: an attacker who can put `?callbackUrl=https://…`
 * in front of a student would otherwise bounce them off-site straight after a
 * successful login, which is a convincing place to ask for a password again.
 */
export const safeCallback = (value?: string | null) => {
  if (!value) return "/courses";
  if (!value.startsWith("/") || value.startsWith("//")) return "/courses";
  return value;
};
