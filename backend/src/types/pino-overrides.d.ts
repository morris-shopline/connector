import 'pino'

declare module 'pino' {
  interface LogFn {
    (obj: unknown, msg?: string, ...args: unknown[]): void
    (msg: string, ...args: unknown[]): void
  }
}

