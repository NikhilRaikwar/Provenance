import { NextResponse } from "next/server";

export async function GET() {
  const checks = {
    memwal_key: Boolean(process.env.MEMWAL_KEY && !process.env.MEMWAL_KEY.includes("<")),
    memwal_account_id: Boolean(process.env.MEMWAL_ACCOUNT_ID && !process.env.MEMWAL_ACCOUNT_ID.includes("<")),
    memwal_server_url: Boolean(process.env.MEMWAL_SERVER_URL),
    openai_api_key: Boolean(process.env.OPENAI_API_KEY), // optional — agent feature only
  };

  const required = ["memwal_key", "memwal_account_id"] as const;
  const ok = required.every((k) => checks[k]);

  const missing = required.filter((k) => !checks[k]);

  return NextResponse.json(
    {
      ok,
      checks,
      ...(missing.length > 0 && {
        error: `Missing required env vars: ${missing.map((k) => k.toUpperCase()).join(", ")}. Copy .env.example → .env.local and fill in your credentials.`,
      }),
    },
    { status: ok ? 200 : 503 },
  );
}
