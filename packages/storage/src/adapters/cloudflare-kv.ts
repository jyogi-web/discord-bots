import Cloudflare from 'cloudflare';
import type { StorageAdapter } from '../types.js';

export class CloudflareKVAdapter implements StorageAdapter {
  private client: Cloudflare;
  private accountId: string;
  private namespaceId: string;

  constructor(apiToken: string, accountId: string, namespaceId: string) {
    this.client = new Cloudflare({ apiToken });
    this.accountId = accountId;
    this.namespaceId = namespaceId;
  }

  async get(key: string): Promise<string | null> {
    try {
      const response = await this.client.kv.namespaces.values.get(
        this.namespaceId,
        key,
        { account_id: this.accountId }
      );
      if (response === null || response === undefined) return null;
      // SDK returns a Response object for KV values
      if (response instanceof Response) {
        if (response.status === 404) return null;
        if (!response.ok) {
          throw new Error(`Cloudflare KV get failed: ${response.status} ${response.statusText}`);
        }
        return await response.text();
      }
      return String(response);
    } catch (err: unknown) {
      if (isNotFoundError(err)) return null;
      throw err;
    }
  }

  async put(key: string, value: string): Promise<void> {
    await this.client.kv.namespaces.values.update(
      this.namespaceId,
      key,
      { value, metadata: '{}', account_id: this.accountId }
    );
  }

  async delete(key: string): Promise<void> {
    await this.client.kv.namespaces.values.delete(
      this.namespaceId,
      key,
      { account_id: this.accountId }
    );
  }
}

function isNotFoundError(err: unknown): boolean {
  const status = (err as { status?: unknown })?.status;
  if (typeof status === 'number' && status === 404) return true;
  if (err instanceof Cloudflare.APIError) return err.status === 404;
  return false;
}
