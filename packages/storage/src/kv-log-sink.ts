import type { StorageAdapter } from './types.js';

export interface ActionLogEntry {
  ts: string;
  feature: 'kawaii' | 'eyes-lips' | 'gacha';
  action: string;
  user?: string;
  extra?: Record<string, string>;
}

function todayKey(botName: string): string {
  const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  return `logs:${botName}:${date}`;
}

export class KVLogSink {
  private storage: StorageAdapter;
  private botName: string;
  private buffer: ActionLogEntry[] = [];
  private timer: ReturnType<typeof setInterval> | null = null;
  private flushing: Promise<void> | null = null;

  constructor(storage: StorageAdapter, botName: string, flushIntervalMs = 60_000) {
    this.storage = storage;
    this.botName = botName;
    this.timer = setInterval(() => void this.flush(), flushIntervalMs);
    // Node.js がタイマーだけのためにプロセスを維持しないようにする
    if (this.timer.unref) this.timer.unref();
  }

  record(entry: Omit<ActionLogEntry, 'ts'>): void {
    this.buffer.push({ ts: new Date().toISOString(), ...entry });
  }

  flush(): Promise<void> {
    // 同時実行を防ぐ: 進行中のフラッシュが終わってから次を実行する
    this.flushing = (this.flushing ?? Promise.resolve()).then(() => this._doFlush());
    return this.flushing;
  }

  private async _doFlush(): Promise<void> {
    if (this.buffer.length === 0) return;

    const toWrite = this.buffer.splice(0);
    const key = todayKey(this.botName);

    try {
      const existing = await this.storage.get(key);
      const prev: ActionLogEntry[] = existing ? (JSON.parse(existing) as ActionLogEntry[]) : [];
      await this.storage.put(key, JSON.stringify([...prev, ...toWrite]));
    } catch {
      // フラッシュ失敗時はバッファに戻して次回リトライ
      this.buffer.unshift(...toWrite);
    }
  }

  async destroy(): Promise<void> {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    await this.flush();
  }
}
