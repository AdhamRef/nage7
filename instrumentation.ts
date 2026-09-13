/**
 * Runs once when the Next server boots.
 *
 * This machine's network advertises AAAA records but has no working IPv6
 * route, so Node burns its connect budget on an address that can never answer
 * before falling back to IPv4. That is what made the Google token exchange
 * fail with AggregateError [ETIMEDOUT], and it also explains the intermittent
 * MongoDB Atlas TLS failures. Preferring IPv4 skips the dead leg entirely.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const dns = await import("node:dns");
    dns.setDefaultResultOrder("ipv4first");
  }
}
