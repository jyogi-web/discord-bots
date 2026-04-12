import { describe, it, expect, vi, afterEach } from 'vitest';
import winston from 'winston';

// 環境変数を汚染しないように各テストでリセット
const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
  vi.resetModules();
});

async function importCreateLogger() {
  const mod = await import('./index.js');
  return mod.createLogger;
}

describe('createLogger', () => {
  it('Winston Logger インスタンスを返す', async () => {
    const createLogger = await importCreateLogger();
    const logger = createLogger('test-bot');
    expect(logger).toBeInstanceOf(winston.Logger);
  });

  it('Console Transport が含まれる', async () => {
    const createLogger = await importCreateLogger();
    const logger = createLogger('test-bot');
    const transports = logger.transports;
    const hasConsole = transports.some((t) => t instanceof winston.transports.Console);
    expect(hasConsole).toBe(true);
  });

  it('AXIOM_TOKEN と AXIOM_DATASET が未設定のとき Axiom Transport が含まれない', async () => {
    delete process.env.AXIOM_TOKEN;
    delete process.env.AXIOM_DATASET;
    const createLogger = await importCreateLogger();
    const logger = createLogger('test-bot');
    const transportNames = logger.transports.map((t) => t.constructor.name);
    expect(transportNames).not.toContain('WinstonTransport');
  });

  it('AXIOM_TOKEN と AXIOM_DATASET が設定されているとき Axiom Transport が含まれる', async () => {
    process.env.AXIOM_TOKEN = 'test-token';
    process.env.AXIOM_DATASET = 'test-dataset';
    const createLogger = await importCreateLogger();
    const logger = createLogger('test-bot');
    const transportNames = logger.transports.map((t) => t.constructor.name);
    expect(transportNames).toContain('WinstonTransport');
  });

  it('DISCORD_ERROR_WEBHOOK_URL が未設定のとき Discord Transport が含まれない', async () => {
    delete process.env.DISCORD_ERROR_WEBHOOK_URL;
    const createLogger = await importCreateLogger();
    const logger = createLogger('test-bot');
    const transportNames = logger.transports.map((t) => t.constructor.name);
    expect(transportNames).not.toContain('DiscordTransport');
  });

  it('LOG_LEVEL 環境変数でログレベルが制御される', async () => {
    process.env.LOG_LEVEL = 'warn';
    const createLogger = await importCreateLogger();
    const logger = createLogger('test-bot');
    expect(logger.level).toBe('warn');
  });

  it('LOG_LEVEL 未設定のとき info がデフォルト', async () => {
    delete process.env.LOG_LEVEL;
    const createLogger = await importCreateLogger();
    const logger = createLogger('test-bot');
    expect(logger.level).toBe('info');
  });

  it('logger.info にメタデータオブジェクトを渡せる', async () => {
    const createLogger = await importCreateLogger();
    const logger = createLogger('test-bot');
    // メタデータ付き呼び出しがエラーなく通ること
    expect(() =>
      logger.info('gacha: 全て揃えた', { feature: 'gacha', action: 'all_correct', user: 'alice' })
    ).not.toThrow();
  });

  it('logger.error にメタデータオブジェクトを渡せる', async () => {
    const createLogger = await importCreateLogger();
    const logger = createLogger('test-bot');
    expect(() =>
      logger.error('エラーが発生しました', { error: 'something went wrong' })
    ).not.toThrow();
  });
});
