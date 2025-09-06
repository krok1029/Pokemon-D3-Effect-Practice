type Provider<T> = () => T;

export class Container<Tokens extends Record<PropertyKey, unknown>> {
  private providers = new Map<keyof Tokens, Provider<unknown>>();
  private singletons = new Map<keyof Tokens, unknown>();

  register<K extends keyof Tokens>(token: K, provider: Provider<Tokens[K]>): void {
    this.providers.set(token, provider);
    this.singletons.delete(token);
  }

  registerInstance<K extends keyof Tokens>(token: K, instance: Tokens[K]): void {
    this.providers.set(token, () => instance);
    this.singletons.set(token, instance);
  }

  resolve<K extends keyof Tokens>(token: K): Tokens[K] {
    if (this.singletons.has(token)) {
      return this.singletons.get(token) as Tokens[K];
    }
    const provider = this.providers.get(token) as Provider<Tokens[K]> | undefined;
    if (!provider) throw new Error(`No provider for token: ${String(token)}`);
    const instance = provider();
    // Cache as singleton for simplicity
    this.singletons.set(token, instance as Tokens[K]);
    return instance as Tokens[K];
  }
}

// App-level default container singleton
import type { TokenMap } from './tokens';
export const container = new Container<TokenMap>();
