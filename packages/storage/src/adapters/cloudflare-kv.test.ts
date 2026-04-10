import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CloudflareKVAdapter } from './cloudflare-kv.js';

const mockGet = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();

vi.mock('cloudflare', () => {
  class APIError extends Error {
    status: number;
    constructor(message: string, status: number) {
      super(message);
      this.status = status;
    }
  }

  function MockCloudflare() {
    return {
      kv: {
        namespaces: {
          values: {
            get: mockGet,
            update: mockUpdate,
            delete: mockDelete,
          },
        },
      },
    };
  }
  MockCloudflare.APIError = APIError;
  return { default: MockCloudflare };
});

// vi.mock ホイスト後にインポートされる APIError を取得するためのヘルパー
async function makeAPIError(message: string, status: number): Promise<Error> {
  const { default: Cloudflare } = await import('cloudflare');
  const Err = (Cloudflare as unknown as { APIError: new (msg: string, status: number) => Error }).APIError;
  return new Err(message, status);
}

const ACCOUNT_ID = 'test-account';
const NAMESPACE_ID = 'test-namespace';
const API_TOKEN = 'test-token';

function createAdapter() {
  return new CloudflareKVAdapter(API_TOKEN, ACCOUNT_ID, NAMESPACE_ID);
}

describe('CloudflareKVAdapter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('get', () => {
    it('値が存在する場合、テキストを返す', async () => {
      mockGet.mockResolvedValue(new Response('hello', { status: 200 }));

      const adapter = createAdapter();
      expect(await adapter.get('key1')).toBe('hello');
    });

    it('正しい account_id と namespace_id で SDK を呼ぶ', async () => {
      mockGet.mockResolvedValue(new Response('v', { status: 200 }));

      const adapter = createAdapter();
      await adapter.get('my-key');

      expect(mockGet).toHaveBeenCalledWith(
        NAMESPACE_ID,
        'my-key',
        { account_id: ACCOUNT_ID }
      );
    });

    it('404 APIError の場合 null を返す', async () => {
      mockGet.mockRejectedValue(await makeAPIError('Not Found', 404));

      const adapter = createAdapter();
      expect(await adapter.get('missing')).toBeNull();
    });

    it('404 以外の APIError はそのまま throw する', async () => {
      mockGet.mockRejectedValue(await makeAPIError('Server Error', 500));

      const adapter = createAdapter();
      await expect(adapter.get('key')).rejects.toThrow('Server Error');
    });
  });

  describe('put', () => {
    it('正しいパラメーターで SDK の update を呼ぶ', async () => {
      mockUpdate.mockResolvedValue(undefined);

      const adapter = createAdapter();
      await adapter.put('key1', 'value1');

      expect(mockUpdate).toHaveBeenCalledWith(
        NAMESPACE_ID,
        'key1',
        { value: 'value1', metadata: '{}', account_id: ACCOUNT_ID }
      );
    });
  });

  describe('delete', () => {
    it('正しいパラメーターで SDK の delete を呼ぶ', async () => {
      mockDelete.mockResolvedValue(undefined);

      const adapter = createAdapter();
      await adapter.delete('key1');

      expect(mockDelete).toHaveBeenCalledWith(
        NAMESPACE_ID,
        'key1',
        { account_id: ACCOUNT_ID }
      );
    });
  });
});
