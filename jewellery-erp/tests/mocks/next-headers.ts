// Mock for next/headers in Vitest environment

class MockRequestCookies {
  private store = new Map<string, { name: string; value: string }>();

  get(name: string) {
    return this.store.get(name);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- options param kept for API compatibility
  set(name: string, value: string, ...args: unknown[]) {
    this.store.set(name, { name, value });
    return this;
  }

  delete(name: string) {
    this.store.delete(name);
    return this;
  }

  getAll() {
    return Array.from(this.store.values());
  }

  has(name: string) {
    return this.store.has(name);
  }
}

export async function cookies() {
  return new MockRequestCookies();
}

export async function headers() {
  return new Headers();
}

export async function draftMode() {
  return {
    isEnabled: false,
    enable: () => {},
    disable: () => {},
  };
}
