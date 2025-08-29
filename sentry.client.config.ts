import { init } from '@sentry/nextjs';

const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

init({
  dsn: SENTRY_DSN,
  debug: process.env.NODE_ENV === 'development',
  
  // Performance monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Session replay for debugging
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  // Environment configuration
  environment: process.env.NODE_ENV || 'development',
  
  // Release tracking
  release: process.env.VERCEL_GIT_COMMIT_SHA || 'dev',

  // Custom configuration for the trading app
  beforeSend(event) {
    // Filter out sensitive information
    if (event.exception) {
      event.exception.values?.forEach((exception) => {
        if (exception.stacktrace?.frames) {
          exception.stacktrace.frames.forEach((frame) => {
            // Remove sensitive data from stack traces
            if (frame.vars) {
              Object.keys(frame.vars).forEach((key) => {
                if (key.toLowerCase().includes('password') || 
                    key.toLowerCase().includes('secret') ||
                    key.toLowerCase().includes('key') ||
                    key.toLowerCase().includes('token')) {
                  frame.vars![key] = '[Filtered]';
                }
              });
            }
          });
        }
      });
    }

    // Filter out API keys from event data
    if (event.extra) {
      Object.keys(event.extra).forEach((key) => {
        if (key.toLowerCase().includes('api') && 
            key.toLowerCase().includes('key')) {
          event.extra![key] = '[Filtered]';
        }
      });
    }

    return event;
  },

  // Tag important events
  initialScope: {
    tags: {
      component: 'ai-trader',
      service: 'nextjs',
    },
  },

  // Error filtering
  ignoreErrors: [
    // Browser extensions
    'top.GLOBALS',
    'originalCreateNotification',
    'canvas.contentDocument',
    'MyApp_RemoveAllHighlights',
    'http://tt.epicplay.com',
    "Can't find variable: ZiteReader",
    'jigsaw is not defined',
    'ComboSearch is not defined',
    'http://loading.retry.widdit.com/',
    'atomicFindClose',
    // Network errors
    'NetworkError',
    'fetch',
    // Random plugins/extensions
    'window.document.documentElement.querySelectorAll',
    'window.document.body.querySelectorAll',
  ],

  // Ignore transactions for static assets
  denyUrls: [
    /extensions\//i,
    /^chrome:\/\//i,
    /^chrome-extension:\/\//i,
    /^moz-extension:\/\//i,
  ],
});