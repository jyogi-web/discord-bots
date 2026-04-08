import type { Logger } from '../logger/index.js';

type ShutdownHandler = () => Promise<void> | void;

export class ShutdownManager {
  private logger: Logger;
  private handlers: ShutdownHandler[];
  private signals: NodeJS.Signals[];
  private isRegistered: boolean;
  private isShuttingDown: boolean;

  constructor(logger: Logger) {
    this.logger = logger;
    this.handlers = [];
    this.signals = ['SIGINT', 'SIGTERM'];
    this.isRegistered = false;
    this.isShuttingDown = false;
  }

  onShutdown(handler: ShutdownHandler): void {
    if (!this.handlers.includes(handler)) {
      this.handlers.push(handler);
    }
  }

  register(): void {
    if (this.isRegistered) return;
    this.isRegistered = true;

    const shutdown = async (signal: NodeJS.Signals) => {
      if (this.isShuttingDown) return;
      this.isShuttingDown = true;
      this.logger.info(`\nシャットダウンシグナルを受信: ${signal}`);
      try {
        for (const handler of this.handlers) {
          await handler();
        }
        this.logger.success('シャットダウン完了');
        process.exit(0);
      } catch (error) {
        this.logger.error('シャットダウン中にエラー:', error);
        process.exit(1);
      }
    };

    for (const signal of this.signals) {
      process.once(signal, () => void shutdown(signal));
    }
  }
}

export function createShutdownManager(logger: Logger): ShutdownManager {
  return new ShutdownManager(logger);
}
