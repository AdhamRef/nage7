/**
 * Who may use the teacher dashboard. Matches on either the user's id or their
 * email, since with OAuth the email is the stable thing you actually know.
 * TEACHER_EMAILS accepts a comma-separated list.
 */
export const isTeacher = (user?: {
  id?: string | null;
  email?: string | null;
} | null) => {
  if (!user) return false;

  const allowedId = process.env.NEXT_PUBLIC_TEACHER_ID;
  if (allowedId && user.id === allowedId) return true;

  const allowedEmails = (process.env.NEXT_PUBLIC_TEACHER_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  return Boolean(
    user.email && allowedEmails.includes(user.email.toLowerCase())
  );
};
