import { NextRequest, NextResponse } from 'next/server';

// Issues a short-lived Direct Line token for the TMC Pre-Task Planning Safety
// agent (Copilot Studio). Secrets stay on the server; the browser only ever
// sees a conversation-scoped token.
//
// Configure ONE of these in .env.local (see .env.example):
//   COPILOT_TOKEN_ENDPOINT  - Copilot Studio "Token Endpoint" (Channels > Mobile app),
//                             for agents with "No authentication".
//   DIRECTLINE_SECRET       - Copilot Studio web channel security secret
//                             (Settings > Security > Web channel security).
// Optional:
//   DIRECTLINE_DOMAIN       - Override the Direct Line base URL,
//                             e.g. https://europe.directline.botframework.com/v3/directline

export const dynamic = 'force-dynamic';

const DEFAULT_DOMAIN = 'https://directline.botframework.com/v3/directline';

function trimSlash(s: string) {
  return s.replace(/\/+$/, '');
}

// Copilot Studio agents can live in a regional Direct Line deployment. The
// token endpoint's environment exposes the right URL via regionalchannelsettings.
async function resolveRegionalDomain(tokenEndpoint: string): Promise<string | null> {
  try {
    // Classic agents use /powervirtualagents/botsbyschema/..., agents built in
    // the new Copilot Studio use /copilotstudio/agenticruntime/botsbyschema/...
    // Both share the environment-level regionalchannelsettings endpoint.
    const idx = tokenEndpoint.search(/\/(powervirtualagents|copilotstudio)\//);
    if (idx < 0) return null;
    const environmentEndpoint = tokenEndpoint.slice(0, idx);
    const apiVersion =
      new URL(tokenEndpoint).searchParams.get('api-version') ?? '2022-03-01-preview';
    const res = await fetch(
      `${environmentEndpoint}/powervirtualagents/regionalchannelsettings?api-version=${apiVersion}`,
      { cache: 'no-store' }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const dl: string | undefined = data?.channelUrlsById?.directline;
    return dl ? `${trimSlash(dl)}/v3/directline` : null;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const tokenEndpoint = process.env.COPILOT_TOKEN_ENDPOINT;
  const secret = process.env.DIRECTLINE_SECRET;
  const domainOverride = process.env.DIRECTLINE_DOMAIN;

  let body: { userId?: string; userName?: string } = {};
  try {
    body = await req.json();
  } catch {
    // no body is fine
  }
  // Direct Line requires user ids to start with "dl_" when the token is bound to a user.
  const userId =
    body.userId && /^dl_[\w-]{1,64}$/.test(body.userId)
      ? body.userId
      : `dl_${crypto.randomUUID()}`;
  const userName = (body.userName ?? '').toString().slice(0, 80) || undefined;

  try {
    if (secret) {
      const domain = trimSlash(domainOverride || DEFAULT_DOMAIN);
      const res = await fetch(`${domain}/tokens/generate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${secret}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user: { id: userId, name: userName } }),
        cache: 'no-store',
      });
      if (!res.ok) {
        return NextResponse.json(
          { error: `Direct Line token request failed (${res.status})` },
          { status: 502 }
        );
      }
      const data = await res.json();
      return NextResponse.json({
        token: data.token,
        expiresIn: data.expires_in,
        conversationId: data.conversationId,
        domain,
        userId,
      });
    }

    if (tokenEndpoint) {
      const [res, regional] = await Promise.all([
        fetch(tokenEndpoint, { cache: 'no-store' }),
        domainOverride ? Promise.resolve(null) : resolveRegionalDomain(tokenEndpoint),
      ]);
      if (!res.ok) {
        return NextResponse.json(
          { error: `Copilot Studio token endpoint failed (${res.status})` },
          { status: 502 }
        );
      }
      const data = await res.json();
      return NextResponse.json({
        token: data.token,
        expiresIn: data.expires_in,
        conversationId: data.conversationId,
        domain: trimSlash(domainOverride || regional || DEFAULT_DOMAIN),
        userId,
      });
    }

    return NextResponse.json(
      {
        error:
          'Agent connection is not configured. Set COPILOT_TOKEN_ENDPOINT or DIRECTLINE_SECRET on the server.',
      },
      { status: 500 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: `Could not reach the agent service: ${(err as Error).message}` },
      { status: 502 }
    );
  }
}
