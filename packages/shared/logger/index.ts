type LogLevel = 'debug' | 'info' | 'warn' | 'error';
const LOG_LEVELS: LogLevel[] = ['debug', 'info', 'warn', 'error'];

interface LoggerOptions {
  level?: LogLevel;
  timestamp?: boolean;
}

export class Logger {
  private name: string;
  private level: LogLevel;
  private timestamp: boolean;

  constructor(name: string, options: LoggerOptions = {}) {
    this.name = name;
    const candidate = options.level ?? process.env.LOG_LEVEL;
    this.level = LOG_LEVELS.includes(candidate as LogLevel) ? (candidate as LogLevel) : 'info';
    this.timestamp = options.timestamp !== false;
  }

  private _formatMessage(emoji: string, ...args: unknown[]): unknown[] {
    const time = this.timestamp ? `[${new Date().toISOString()}]` : '';
    const prefix = `${time} ${emoji} [${this.name}]`;
    return [prefix, ...args];
  }

  private _shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS.indexOf(level) >= LOG_LEVELS.indexOf(this.level);
  }

  debug(...args: unknown[]): void {
    if (this._shouldLog('debug')) {
      console.debug(...this._formatMessage('🐛', ...args));
    }
  }

  info(...args: unknown[]): void {
    if (this._shouldLog('info')) {
      console.info(...this._formatMessage('ℹ️', ...args));
    }
  }

  warn(...args: unknown[]): void {
    if (this._shouldLog('warn')) {
      console.warn(...this._formatMessage('⚠️', ...args));
    }
  }

  error(...args: unknown[]): void {
    if (this._shouldLog('error')) {
      console.error(...this._formatMessage('❌', ...args));
    }
  }

  success(...args: unknown[]): void {
    if (this._shouldLog('info')) {
      console.log(...this._formatMessage('✅', ...args));
    }
  }
}

export function createLogger(name: string, options?: LoggerOptions): Logger {
  return new Logger(name, options);
}
