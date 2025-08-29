// Set test environment variables
process.env.NODE_ENV = 'test'
process.env.ALPACA_API_KEY = 'test-key'
process.env.ALPACA_SECRET_KEY = 'test-secret'
process.env.SUPABASE_URL = 'https://test.supabase.co'
process.env.SUPABASE_ANON_KEY = 'test-anon-key'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'
process.env.GEMINI_API_KEY = 'test-gemini-key'
process.env.GEMINI_SECRET_KEY = 'test-gemini-secret'
process.env.BETTER_AUTH_SECRET = 'test-auth-secret'
process.env.BETTER_AUTH_URL = 'http://localhost:3000'
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

// Mock crypto functions that cause issues
jest.mock('uncrypto', () => ({
  randomUUID: () => 'test-uuid-1234',
  getRandomValues: (arr) => {
    for (let i = 0; i < arr.length; i++) {
      arr[i] = Math.floor(Math.random() * 256);
    }
    return arr;
  },
  subtle: {
    digest: jest.fn(),
    sign: jest.fn(),
    verify: jest.fn(),
  },
}));

// Mock better-auth dependencies that cause issues
jest.mock('better-call', () => ({
  cookie: jest.fn(),
}));

// Mock better-auth module completely
jest.mock('better-auth', () => ({
  betterAuth: jest.fn(() => ({
    api: {
      getSession: jest.fn(),
      signIn: jest.fn(),
      signOut: jest.fn(),
      signUp: jest.fn(),
    },
    handler: jest.fn(),
    init: jest.fn(),
  })),
}));

// Mock better-call dependencies that cause issues
jest.mock('better-call', () => ({
  cookie: jest.fn(),
  createMiddleware: jest.fn(),
}));

// Mock zod completely for better-auth
jest.mock('zod', () => ({
  z: {
    object: jest.fn(() => ({
      parse: jest.fn(),
      safeParse: jest.fn(() => ({ success: true, data: {} })),
    })),
    string: jest.fn(() => ({
      min: jest.fn(() => ({ max: jest.fn() })),
      max: jest.fn(),
      email: jest.fn(),
      optional: jest.fn(),
    })),
    number: jest.fn(() => ({
      min: jest.fn(),
      max: jest.fn(),
      optional: jest.fn(),
    })),
    boolean: jest.fn(() => ({ optional: jest.fn() })),
    array: jest.fn(() => ({ optional: jest.fn() })),
    enum: jest.fn(),
    literal: jest.fn(),
    union: jest.fn(),
    createMiddleware: jest.fn(),
  },
  createMiddleware: jest.fn(),
}));

// Mock fetch globally
global.fetch = jest.fn()

// Mock WebSocket
global.WebSocket = jest.fn()

// Mock next/server
jest.mock('next/server', () => ({
  NextRequest: jest.fn().mockImplementation((url, options = {}) => ({
    url,
    method: options.method || 'GET',
    headers: new Map(Object.entries(options.headers || {})),
    json: jest.fn().mockImplementation(() => {
      if (options.body && typeof options.body === 'string') {
        try {
          return Promise.resolve(JSON.parse(options.body));
        } catch {
          return Promise.reject(new Error('Invalid JSON'));
        }
      }
      return Promise.resolve({});
    }),
    text: jest.fn().mockResolvedValue(options.body || ''),
    formData: jest.fn().mockResolvedValue(new FormData()),
    nextUrl: {
      pathname: new URL(url).pathname,
      searchParams: new URLSearchParams(new URL(url).search),
    },
  })),
  NextResponse: {
    json: jest.fn().mockImplementation((body = {}, options = {}) => ({
      status: options.status || 200,
      statusText: options.statusText || 'OK',
      headers: new Map(Object.entries(options.headers || {})),
      json: jest.fn().mockResolvedValue(body),
      text: jest.fn().mockResolvedValue(JSON.stringify(body)),
      ok: (options.status || 200) >= 200 && (options.status || 200) < 300,
      body,
    })),
    redirect: jest.fn().mockImplementation((url, status = 302) => ({
      status,
      headers: new Map([['location', url]]),
    })),
    rewrite: jest.fn(),
    next: jest.fn(),
  },
}));

// Mock next/headers
jest.mock('next/headers', () => ({
  headers: jest.fn(() => new Map([
    ['authorization', 'Bearer test-token'],
    ['content-type', 'application/json'],
  ])),
  cookies: jest.fn(() => ({
    get: jest.fn(() => ({ value: 'test-session' })),
    set: jest.fn(),
    delete: jest.fn(),
  })),
}));

// Mock Next.js Request and Response objects
global.Request = jest.fn().mockImplementation((url, options) => ({
  url,
  method: options?.method || 'GET',
  headers: new Map(Object.entries(options?.headers || {})),
  json: jest.fn().mockImplementation(() => {
    if (options?.body && typeof options?.body === 'string') {
      try {
        return Promise.resolve(JSON.parse(options.body));
      } catch {
        return Promise.reject(new Error('Invalid JSON'));
      }
    }
    return Promise.resolve({});
  }),
  text: jest.fn().mockResolvedValue(options?.body || ''),
  formData: jest.fn().mockResolvedValue(new FormData()),
}))

global.Response = jest.fn().mockImplementation((body, options) => ({
  status: options?.status || 200,
  statusText: options?.statusText || 'OK',
  headers: new Map(Object.entries(options?.headers || {})),
  json: jest.fn().mockResolvedValue(body),
  text: jest.fn().mockResolvedValue(String(body)),
  ok: (options?.status || 200) >= 200 && (options?.status || 200) < 300,
}))



// Mock Headers
global.Headers = jest.fn().mockImplementation((init) => {
  const headers = new Map()
  if (init) {
    if (Array.isArray(init)) {
      init.forEach(([key, value]) => headers.set(key, value))
    } else if (typeof init === 'object') {
      Object.entries(init).forEach(([key, value]) => headers.set(key, value))
    }
  }
  return {
    get: (key) => headers.get(key),
    set: (key, value) => headers.set(key, value),
    has: (key) => headers.has(key),
    delete: (key) => headers.delete(key),
    entries: () => headers.entries(),
    keys: () => headers.keys(),
    values: () => headers.values(),
    forEach: (cb) => headers.forEach(cb),
  }
})

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost:3000',
    hostname: 'localhost',
    pathname: '/',
    search: '',
    hash: '',
    reload: jest.fn(),
  },
  writable: true,
})

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
})

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))