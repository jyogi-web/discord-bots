import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Client } from 'discord.js';
import type { Logger } from '@discord-bots/shared';

// shuffleChars を vi.fn() として登録しておき、テストごとに返り値を差し替える
vi.mock('./gacha-core.js', async (importOriginal) => {
  const original = await importOriginal<typeof import('./gacha-core.js')>();
  return {
    ...original,
    shuffleChars: vi.fn(() => original.shuffleChars()),
  };
});

// debug モジュールは書き換え可能な形でモック
vi.mock('./debug.js', () => ({
  GACHA_DEBUG: false,
  DEBUG_SCENARIO_ORDER: ['n0', 'n1', 'r2', 'r3', 'sr', 'ssr', 'legend', 'reversed'],
}));

import { setupGacha } from './gacha.js';
import * as gachaCore from './gacha-core.js';
import * as debugModule from './debug.js';

// --- ヘルパー ---

function makeChannel(sendable = true) {
  return {
    isSendable: () => sendable,
    send: vi.fn().mockResolvedValue(undefined),
  };
}

function makeInteraction(channelOverride?: ReturnType<typeof makeChannel>) {
  const channel = channelOverride ?? makeChannel();
  return {
    isChatInputCommand: vi.fn(() => true),
    commandName: 'gacha',
    deferReply: vi.fn().mockResolvedValue(undefined),
    editReply: vi.fn().mockResolvedValue(undefined),
    channel,
    user: { username: 'testUser' },
  };
}

function makeLogger(): Logger {
  return {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  } as unknown as Logger;
}

type InteractionHandler = (interaction: unknown) => void;

// ハンドラは void (async () => {...})() パターンなので Promise を返さない。
// 全ての非同期マイクロタスクが消化されるまで待つヘルパー。
function flushPromises() {
  return new Promise<void>((resolve) => setImmediate(resolve));
}

function makeClient() {
  let handler: InteractionHandler | null = null;
  return {
    on: vi.fn((event: string, fn: InteractionHandler) => {
      if (event === 'interactionCreate') handler = fn;
    }),
    emit: async (interaction: unknown) => {
      if (handler) handler(interaction);
      await flushPromises();
    },
  };
}

const shuffleCharsMock = vi.mocked(gachaCore.shuffleChars);

// --- テスト ---

describe('setupGacha', () => {
  let client: ReturnType<typeof makeClient>;
  let logger: Logger;

  beforeEach(() => {
    client = makeClient();
    logger = makeLogger();
    vi.clearAllMocks();
  });

  it('interactionCreate イベントを登録し、初期化ログを出す', () => {
    setupGacha(client as unknown as Client, logger);
    expect(client.on).toHaveBeenCalledWith('interactionCreate', expect.any(Function));
    expect(logger.info).toHaveBeenCalledWith('gacha機能を初期化しました');
  });

  it('chatInputCommand 以外は無視する', async () => {
    setupGacha(client as unknown as Client, logger);
    const interaction = makeInteraction();
    interaction.isChatInputCommand.mockReturnValue(false);
    await client.emit(interaction);
    expect(interaction.deferReply).not.toHaveBeenCalled();
  });

  it('/gacha 以外のコマンドは無視する', async () => {
    setupGacha(client as unknown as Client, logger);
    const interaction = { ...makeInteraction(), commandName: 'other' };
    await client.emit(interaction);
    expect(interaction.deferReply).not.toHaveBeenCalled();
  });

  describe('通常モード（GACHA_DEBUG=false）', () => {
    it('通常結果（マッチ数 2）: formatResult で返信する', async () => {
      shuffleCharsMock.mockReturnValue(gachaCore.buildShuffledForMatches(2));
      setupGacha(client as unknown as Client, logger);
      const interaction = makeInteraction();
      await client.emit(interaction);
      expect(interaction.editReply).toHaveBeenCalledWith(
        expect.stringContaining('```ansi'),
      );
    });

    it('5一致（SSR）: formatResult で返信しスタンプを送信する', async () => {
      shuffleCharsMock.mockReturnValue(gachaCore.buildShuffledForMatches(5));
      setupGacha(client as unknown as Client, logger);
      const channel = makeChannel();
      const interaction = makeInteraction(channel);
      await client.emit(interaction);
      expect(interaction.editReply).toHaveBeenCalledWith(
        expect.stringContaining('```ansi'),
      );
      expect(channel.send).toHaveBeenCalledWith({
        stickers: ['1491081864323141793'],
      });
      expect(logger.info).toHaveBeenLastCalledWith('gacha: 5文字一致', expect.any(Object));
    });

    it('5一致でチャンネルが sendable でない場合はスタンプを送信しない', async () => {
      shuffleCharsMock.mockReturnValue(gachaCore.buildShuffledForMatches(5));
      setupGacha(client as unknown as Client, logger);
      const channel = makeChannel(false);
      const interaction = makeInteraction(channel);
      await client.emit(interaction);
      expect(channel.send).not.toHaveBeenCalled();
    });

    it('全一致（legend）: 全一致演出で返信しスタンプを送信する', async () => {
      shuffleCharsMock.mockReturnValue([...gachaCore.TARGET_CHARS]);
      setupGacha(client as unknown as Client, logger);
      const channel = makeChannel();
      const interaction = makeInteraction(channel);
      await client.emit(interaction);
      expect(interaction.editReply).toHaveBeenCalledWith(
        expect.stringContaining('名誉じょぎ部員'),
      );
      expect(channel.send).toHaveBeenCalledWith({
        stickers: ['1411357962567548969'],
      });
      expect(logger.info).toHaveBeenLastCalledWith('gacha: 全て揃えた', expect.any(Object));
    });

    it('全一致でチャンネルが sendable でない場合はスタンプを送信しない', async () => {
      shuffleCharsMock.mockReturnValue([...gachaCore.TARGET_CHARS]);
      setupGacha(client as unknown as Client, logger);
      const channel = makeChannel(false);
      const interaction = makeInteraction(channel);
      await client.emit(interaction);
      expect(channel.send).not.toHaveBeenCalled();
    });

    it('逆順（reversed）: 逆順演出で返信する', async () => {
      shuffleCharsMock.mockReturnValue([...gachaCore.REVERSED_CHARS]);
      setupGacha(client as unknown as Client, logger);
      const interaction = makeInteraction();
      await client.emit(interaction);
      expect(interaction.editReply).toHaveBeenCalledWith(
        expect.stringContaining('逆順で揃えてしまった'),
      );
      expect(logger.info).toHaveBeenLastCalledWith('gacha: 逆順で揃えた', expect.any(Object));
    });
  });

  describe('デバッグモード（GACHA_DEBUG=true）', () => {
    beforeEach(() => {
      vi.spyOn(debugModule, 'GACHA_DEBUG', 'get').mockReturnValue(true as never);
    });

    it('legend シナリオ: [DEBUG] プレフィックス付きで全一致演出を返す', async () => {
      vi.spyOn(debugModule, 'DEBUG_SCENARIO_ORDER', 'get').mockReturnValue(['legend']);
      setupGacha(client as unknown as Client, logger);
      const channel = makeChannel();
      const interaction = makeInteraction(channel);
      await client.emit(interaction);
      expect(interaction.editReply).toHaveBeenCalledWith(
        expect.stringContaining('[DEBUG]'),
      );
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('[gacha debug]'),
      );
    });

    it('ssr シナリオ: スタンプが送信される', async () => {
      vi.spyOn(debugModule, 'DEBUG_SCENARIO_ORDER', 'get').mockReturnValue(['ssr']);
      setupGacha(client as unknown as Client, logger);
      const channel = makeChannel();
      const interaction = makeInteraction(channel);
      await client.emit(interaction);
      expect(channel.send).toHaveBeenCalledWith({
        stickers: ['1491081864323141793'],
      });
    });

    it('reversed シナリオ: 逆順演出を返す', async () => {
      vi.spyOn(debugModule, 'DEBUG_SCENARIO_ORDER', 'get').mockReturnValue(['reversed']);
      setupGacha(client as unknown as Client, logger);
      const interaction = makeInteraction();
      await client.emit(interaction);
      expect(interaction.editReply).toHaveBeenCalledWith(
        expect.stringContaining('逆順で揃えてしまった'),
      );
    });

    it.each(['n0', 'n1', 'r2', 'r3', 'sr'] as const)(
      '%s シナリオ: 通常結果を返す',
      async (scenario) => {
        vi.spyOn(debugModule, 'DEBUG_SCENARIO_ORDER', 'get').mockReturnValue([scenario]);
        setupGacha(client as unknown as Client, logger);
        const interaction = makeInteraction();
        await client.emit(interaction);
        expect(interaction.editReply).toHaveBeenCalledWith(
          expect.stringContaining('```ansi'),
        );
      },
    );

    it('debugIndex が DEBUG_SCENARIO_ORDER の長さでループする', async () => {
      vi.spyOn(debugModule, 'DEBUG_SCENARIO_ORDER', 'get').mockReturnValue(['n0', 'legend']);
      setupGacha(client as unknown as Client, logger);

      // 1回目: n0 → 通常結果
      const i1 = makeInteraction();
      await client.emit(i1);
      expect(i1.editReply).toHaveBeenCalledWith(expect.stringContaining('```ansi'));

      // 2回目: legend → 全一致演出
      const i2 = makeInteraction();
      await client.emit(i2);
      expect(i2.editReply).toHaveBeenCalledWith(expect.stringContaining('名誉じょぎ部員'));

      // 3回目: ループして n0 → 通常結果
      const i3 = makeInteraction();
      await client.emit(i3);
      expect(i3.editReply).toHaveBeenCalledWith(expect.stringContaining('```ansi'));
    });
  });
});
