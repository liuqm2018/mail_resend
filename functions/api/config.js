// Cloudflare Pages Function: GET /api/config
// Tells the frontend whether a password is required, without leaking the
// password itself. Used to show/hide the password field.

const JSON_HEADERS = { "Content-Type": "application/json; charset=utf-8" };

export async function onRequestGet({ env }) {
  return new Response(
    JSON.stringify({ passwordRequired: Boolean(env.ACCESS_PASSWORD) }),
    { headers: JSON_HEADERS },
  );
}
