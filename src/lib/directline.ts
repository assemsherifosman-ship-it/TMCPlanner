// Minimal Direct Line 3.0 client used to talk to the Copilot Studio agent.
// Receives activities over WebSocket and falls back to HTTP polling if the
// socket can't be opened (some corporate networks block it).

export type Attachment = {
  contentType: string;
  content?: any;
  contentUrl?: string;
  name?: string;
};

export type CardAction = {
  type: string;
  title?: string;
  value?: any;
  text?: string;
  displayText?: string;
};

export type Activity = {
  type: string;
  id?: string;
  timestamp?: string;
  from: { id: string; name?: string; role?: string };
  text?: string;
  textFormat?: string;
  name?: string;
  value?: any;
  locale?: string;
  attachments?: Attachment[];
  attachmentLayout?: string;
  suggestedActions?: { actions: CardAction[] };
  channelData?: any;
};

type TokenResponse = {
  token: string;
  expiresIn?: number;
  domain: string;
  userId: string;
  error?: string;
};

type Handlers = {
  onActivity: (a: Activity) => void;
  onStatus?: (s: 'connecting' | 'online' | 'reconnecting' | 'offline') => void;
  onError?: (msg: string) => void;
};

export class DirectLineClient {
  private token = '';
  private domain = '';
  private conversationId = '';
  private watermark: string | undefined;
  private ws: WebSocket | null = null;
  private pollTimer: ReturnType<typeof setTimeout> | null = null;
  private refreshTimer: ReturnType<typeof setInterval> | null = null;
  private closed = false;
  private seen = new Set<string>();
  readonly userId: string;

  constructor(
    private handlers: Handlers,
    userId: string,
    private userName?: string
  ) {
    this.userId = userId;
  }

  get user() {
    return { id: this.userId, name: this.userName, role: 'user' };
  }

  async start(locale: string) {
    this.handlers.onStatus?.('connecting');
    const tr = await fetch('/api/directline/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: this.userId, userName: this.userName }),
    });
    const tok: TokenResponse = await tr.json().catch(() => ({}) as TokenResponse);
    if (!tr.ok || !tok.token) {
      throw new Error(tok.error || `Token request failed (${tr.status})`);
    }
    this.token = tok.token;
    this.domain = tok.domain;

    const conv = await this.api('POST', '/conversations');
    this.conversationId = conv.conversationId;
    if (conv.token) this.token = conv.token;

    // Direct Line tokens last ~60 minutes; refresh well before that.
    this.refreshTimer = setInterval(() => this.refresh(), 15 * 60 * 1000);

    if (conv.streamUrl) this.openSocket(conv.streamUrl);
    else this.poll();

    // Copilot Studio greets the user when it receives this event.
    await this.postActivity({
      type: 'event',
      name: 'startConversation',
      locale,
      from: this.user,
    });
  }

  async sendText(text: string, locale: string, value?: any) {
    return this.postActivity({
      type: 'message',
      text,
      locale,
      textFormat: 'plain',
      from: this.user,
      ...(value !== undefined ? { value } : {}),
    });
  }

  async postActivity(activity: Activity): Promise<string | undefined> {
    const res = await this.api(
      'POST',
      `/conversations/${encodeURIComponent(this.conversationId)}/activities`,
      activity
    );
    return res?.id;
  }

  end() {
    this.closed = true;
    this.ws?.close();
    if (this.pollTimer) clearTimeout(this.pollTimer);
    if (this.refreshTimer) clearInterval(this.refreshTimer);
    this.handlers.onStatus?.('offline');
  }

  // ── internals ──────────────────────────────────────────────────────────────

  private async api(method: string, path: string, body?: unknown) {
    const res = await fetch(`${this.domain}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${this.token}`,
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      throw new Error(`Agent request failed (${res.status}) ${detail.slice(0, 200)}`);
    }
    const txt = await res.text();
    return txt ? JSON.parse(txt) : {};
  }

  private deliver(activities: Activity[] = [], watermark?: string) {
    if (watermark) this.watermark = watermark;
    for (const a of activities) {
      if (a.id) {
        if (this.seen.has(a.id)) continue;
        this.seen.add(a.id);
      }
      this.handlers.onActivity(a);
    }
  }

  private openSocket(url: string) {
    if (this.closed) return;
    let opened = false;
    const ws = new WebSocket(url);
    this.ws = ws;
    ws.onopen = () => {
      opened = true;
      this.handlers.onStatus?.('online');
    };
    ws.onmessage = (e) => {
      if (!e.data) return; // heartbeat
      try {
        const data = JSON.parse(e.data);
        this.deliver(data.activities, data.watermark);
      } catch {
        /* ignore malformed frames */
      }
    };
    ws.onclose = () => {
      if (this.closed || this.ws !== ws) return;
      if (!opened) {
        // WebSockets blocked: switch to polling.
        this.handlers.onStatus?.('online');
        this.poll();
        return;
      }
      this.reconnect();
    };
  }

  private async reconnect(attempt = 0) {
    if (this.closed) return;
    this.handlers.onStatus?.('reconnecting');
    try {
      const q = this.watermark ? `?watermark=${encodeURIComponent(this.watermark)}` : '';
      const conv = await this.api(
        'GET',
        `/conversations/${encodeURIComponent(this.conversationId)}${q}`
      );
      if (conv.streamUrl) this.openSocket(conv.streamUrl);
      else this.poll();
    } catch {
      const delay = Math.min(30000, 1000 * 2 ** attempt);
      setTimeout(() => this.reconnect(attempt + 1), delay);
    }
  }

  private async poll() {
    if (this.closed) return;
    try {
      const q = this.watermark ? `?watermark=${encodeURIComponent(this.watermark)}` : '';
      const data = await this.api(
        'GET',
        `/conversations/${encodeURIComponent(this.conversationId)}/activities${q}`
      );
      this.handlers.onStatus?.('online');
      this.deliver(data.activities, data.watermark);
    } catch (e) {
      this.handlers.onStatus?.('reconnecting');
    }
    this.pollTimer = setTimeout(() => this.poll(), 1000);
  }

  private async refresh() {
    try {
      const data = await this.api('POST', '/tokens/refresh');
      if (data.token) this.token = data.token;
    } catch (e) {
      this.handlers.onError?.('Session token could not be refreshed. Start a new session if replies stop.');
    }
  }
}
