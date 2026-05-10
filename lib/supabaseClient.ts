// import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// // Browser client for Supabase (public anon key)
// const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
// const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

// if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
//   throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in environment.');
// }

// // Create Supabase client with rate limiting protection
// export const supabase = createClientComponentClient({
//   supabaseUrl: SUPABASE_URL,
//   supabaseKey: SUPABASE_ANON_KEY
// });

// // Rate limiting utility
// class RateLimiter {
//   private requests: Map<string, number[]> = new Map();
//   private readonly maxRequests: number;
//   private readonly windowMs: number;

//   constructor(maxRequests: number = 10, windowMs: number = 60000) {
//     this.maxRequests = maxRequests;
//     this.windowMs = windowMs;
//   }

//   isAllowed(key: string): boolean {
//     const now = Date.now();
//     const requests = this.requests.get(key) || [];
    
//     // Remove old requests outside the window
//     const validRequests = requests.filter(time => now - time < this.windowMs);
    
//     if (validRequests.length >= this.maxRequests) {
//       return false;
//     }
    
//     validRequests.push(now);
//     this.requests.set(key, validRequests);
//     return true;
//   }
// }

// const rateLimiter = new RateLimiter(8, 60000); // 8 requests per minute to be more conservative

// // Utility function to handle rate limit errors
// export const handleRateLimit = (error: any): string => {
//   if (error?.message?.includes('rate limit') || error?.message?.includes('Rate limit')) {
//     return 'Too many requests. Please wait a moment and try again.';
//   }
//   return error?.message || 'An unexpected error occurred';
// };

// // Enhanced Supabase client with rate limiting
// export const safeSupabase = {
//   auth: {
//     getSession: async () => {
//       const key = 'auth-getSession';
//       if (!rateLimiter.isAllowed(key)) {
//         console.warn('Rate limit exceeded for getSession');
//         return { data: { session: null }, error: { message: 'Rate limit exceeded' } };
//       }
//       try {
//         return await supabase.auth.getSession();
//       } catch (error: any) {
//         if (error.message?.includes('rate limit')) {
//           console.warn('Supabase rate limit hit');
//           return { data: { session: null }, error: { message: 'Rate limit exceeded' } };
//         }
//         throw error;
//       }
//     },
//     getUser: async () => {
//       const key = 'auth-getUser';
//       if (!rateLimiter.isAllowed(key)) {
//         console.warn('Rate limit exceeded for getUser');
//         return { data: { user: null }, error: { message: 'Rate limit exceeded' } };
//       }
//       try {
//         return await supabase.auth.getUser();
//       } catch (error: any) {
//         if (error.message?.includes('rate limit')) {
//           console.warn('Supabase rate limit hit');
//           return { data: { user: null }, error: { message: 'Rate limit exceeded' } };
//         }
//         throw error;
//       }
//     },
//     signUp: async (credentials: any) => {
//       const key = 'auth-signUp';
//       if (!rateLimiter.isAllowed(key)) {
//         console.warn('Rate limit exceeded for signUp');
//         return { data: { user: null, session: null }, error: { message: 'Rate limit exceeded' } };
//       }
//       try {
//         return await supabase.auth.signUp(credentials);
//       } catch (error: any) {
//         if (error.message?.includes('rate limit')) {
//           console.warn('Supabase rate limit hit');
//           return { data: { user: null, session: null }, error: { message: 'Rate limit exceeded' } };
//         }
//         throw error;
//       }
//     },
//     signInWithPassword: async (credentials: any) => {
//       const key = 'auth-signInWithPassword';
//       if (!rateLimiter.isAllowed(key)) {
//         console.warn('Rate limit exceeded for signInWithPassword');
//         return { data: { user: null, session: null }, error: { message: 'Rate limit exceeded' } };
//       }
//       try {
//         return await supabase.auth.signInWithPassword(credentials);
//       } catch (error: any) {
//         if (error.message?.includes('rate limit')) {
//           console.warn('Supabase rate limit hit');
//           return { data: { user: null, session: null }, error: { message: 'Rate limit exceeded' } };
//         }
//         throw error;
//       }
//     },
//     signInWithOAuth: async (options: any) => {
//       const key = 'auth-signInWithOAuth';
//       if (!rateLimiter.isAllowed(key)) {
//         console.warn('Rate limit exceeded for signInWithOAuth');
//         return { error: { message: 'Rate limit exceeded' } };
//       }
//       try {
//         return await supabase.auth.signInWithOAuth(options);
//       } catch (error: any) {
//         if (error.message?.includes('rate limit')) {
//           console.warn('Supabase rate limit hit');
//           return { error: { message: 'Rate limit exceeded' } };
//         }
//         throw error;
//       }
//     },
//     onAuthStateChange: (callback: any) => {
//       return supabase.auth.onAuthStateChange(callback);
//     },
//     signOut: async () => {
//       const key = 'auth-signOut';
//       if (!rateLimiter.isAllowed(key)) {
//         console.warn('Rate limit exceeded for signOut');
//         return { error: { message: 'Rate limit exceeded' } };
//       }
//       try {
//         return await supabase.auth.signOut();
//       } catch (error: any) {
//         if (error.message?.includes('rate limit')) {
//           console.warn('Supabase rate limit hit');
//           return { error: { message: 'Rate limit exceeded' } };
//         }
//         throw error;
//       }
//     }
//   },
//   from: (table: string) => {
//     return {
//       select: (columns: string) => ({
//         eq: (column: string, value: any) => ({
//           single: async () => {
//             const key = `db-${table}-select`;
//             if (!rateLimiter.isAllowed(key)) {
//               console.warn(`Rate limit exceeded for ${table} select`);
//               return { data: null, error: { message: 'Rate limit exceeded' } };
//             }
//             return supabase.from(table).select(columns).eq(column, value).single();
//           }
//         })
//       }),
//       update: (data: any) => ({
//         eq: (column: string, value: any) => ({
//           select: async () => {
//             const key = `db-${table}-update`;
//             if (!rateLimiter.isAllowed(key)) {
//               console.warn(`Rate limit exceeded for ${table} update`);
//               return { data: null, error: { message: 'Rate limit exceeded' } };
//             }
//             return supabase.from(table).update(data).eq(column, value).select();
//           }
//         })
//       })
//     };
//   }
// };




import { createBrowserClient } from '@supabase/ssr';

// Browser client for Supabase (public anon key)
const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL || '') as string;
const SUPABASE_ANON_KEY = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '') as string;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  if (typeof window !== 'undefined') {
    console.error(
      '[MindSync] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.',
      { hasUrl: Boolean(SUPABASE_URL), hasAnonKey: Boolean(SUPABASE_ANON_KEY) }
    );
  }
}

// Always create a client — if env vars are absent the client will reject calls
// at runtime (network 4xx), which is surfaced gracefully in each hook.
// This removes the `supabase | null` type and eliminates TS18047 errors site-wide.
export const supabase = createBrowserClient(
  SUPABASE_URL  || 'https://placeholder.supabase.co',
  SUPABASE_ANON_KEY || 'placeholder-anon-key'
);

// Rate limiting utility
class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests: number = 10, windowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  isAllowed(key: string): boolean {
    const now = Date.now();
    const requests = this.requests.get(key) || [];

    // Remove old requests outside the window
    const validRequests = requests.filter((time) => now - time < this.windowMs);

    if (validRequests.length >= this.maxRequests) {
      return false;
    }

    validRequests.push(now);
    this.requests.set(key, validRequests);
    return true;
  }
}

const rateLimiter = new RateLimiter(8, 60000); // 8 requests per minute to be more conservative

// Utility function to handle rate limit errors
export const handleRateLimit = (error: any): string => {
  if (error?.message?.includes('rate limit') || error?.message?.includes('Rate limit')) {
    return 'Too many requests. Please wait a moment and try again.';
  }
  return error?.message || 'An unexpected error occurred';
};

// Helper: consistent "not configured" error
const notConfiguredError = () => ({
  message: 'Supabase is not configured. Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY.'
});

// Enhanced Supabase client with rate limiting
export const safeSupabase = {
  auth: {
    getSession: async () => {
      const key = 'auth-getSession';

      if (!rateLimiter.isAllowed(key)) {
        console.warn('Rate limit exceeded for getSession');
        return { data: { session: null }, error: { message: 'Rate limit exceeded' } };
      }

      if (!supabase) {
        console.warn('Supabase client not configured for getSession');
        return { data: { session: null }, error: notConfiguredError() };
      }

      try {
        return await supabase.auth.getSession();
      } catch (error: any) {
        if (error?.message?.includes('rate limit')) {
          console.warn('Supabase rate limit hit');
          return { data: { session: null }, error: { message: 'Rate limit exceeded' } };
        }
        return { data: { session: null }, error: { message: error?.message || 'An unexpected error occurred' } };
      }
    },

    getUser: async () => {
      const key = 'auth-getUser';

      if (!rateLimiter.isAllowed(key)) {
        console.warn('Rate limit exceeded for getUser');
        return { data: { user: null }, error: { message: 'Rate limit exceeded' } };
      }

      if (!supabase) {
        console.warn('Supabase client not configured for getUser');
        return { data: { user: null }, error: notConfiguredError() };
      }

      try {
        return await supabase.auth.getUser();
      } catch (error: any) {
        if (error?.message?.includes('rate limit')) {
          console.warn('Supabase rate limit hit');
          return { data: { user: null }, error: { message: 'Rate limit exceeded' } };
        }
        return { data: { user: null }, error: { message: error?.message || 'An unexpected error occurred' } };
      }
    },

    signUp: async (credentials: any) => {
      const key = 'auth-signUp';

      if (!rateLimiter.isAllowed(key)) {
        console.warn('Rate limit exceeded for signUp');
        return { data: { user: null, session: null }, error: { message: 'Rate limit exceeded' } };
      }

      if (!supabase) {
        console.warn('Supabase client not configured for signUp');
        return { data: { user: null, session: null }, error: notConfiguredError() };
      }

      try {
        return await supabase.auth.signUp(credentials);
      } catch (error: any) {
        if (error?.message?.includes('rate limit')) {
          console.warn('Supabase rate limit hit');
          return { data: { user: null, session: null }, error: { message: 'Rate limit exceeded' } };
        }
        return {
          data: { user: null, session: null },
          error: { message: error?.message || 'An unexpected error occurred' }
        };
      }
    },

    signInWithPassword: async (credentials: any) => {
      const key = 'auth-signInWithPassword';

      if (!rateLimiter.isAllowed(key)) {
        console.warn('Rate limit exceeded for signInWithPassword');
        return { data: { user: null, session: null }, error: { message: 'Rate limit exceeded' } };
      }

      if (!supabase) {
        console.warn('Supabase client not configured for signInWithPassword');
        return { data: { user: null, session: null }, error: notConfiguredError() };
      }

      try {
        return await supabase.auth.signInWithPassword(credentials);
      } catch (error: any) {
        if (error?.message?.includes('rate limit')) {
          console.warn('Supabase rate limit hit');
          return { data: { user: null, session: null }, error: { message: 'Rate limit exceeded' } };
        }
        return {
          data: { user: null, session: null },
          error: { message: error?.message || 'An unexpected error occurred' }
        };
      }
    },

    signInWithOAuth: async (options: any) => {
      const key = 'auth-signInWithOAuth';

      if (!rateLimiter.isAllowed(key)) {
        console.warn('Rate limit exceeded for signInWithOAuth');
        return { error: { message: 'Rate limit exceeded' } };
      }

      if (!supabase) {
        console.warn('Supabase client not configured for signInWithOAuth');
        return { error: notConfiguredError() };
      }

      try {
        return await supabase.auth.signInWithOAuth(options);
      } catch (error: any) {
        if (error?.message?.includes('rate limit')) {
          console.warn('Supabase rate limit hit');
          return { error: { message: 'Rate limit exceeded' } };
        }
        return { error: { message: error?.message || 'An unexpected error occurred' } };
      }
    },

    onAuthStateChange: (callback: any) => {
      if (!supabase) {
        console.warn('Supabase client not configured for onAuthStateChange');
        // Return a compatible shape to avoid breaking your existing code.
        return { data: { subscription: { unsubscribe: () => {} } } };
      }
      return supabase.auth.onAuthStateChange(callback);
    },

    signOut: async () => {
      const key = 'auth-signOut';

      if (!rateLimiter.isAllowed(key)) {
        console.warn('Rate limit exceeded for signOut');
        return { error: { message: 'Rate limit exceeded' } };
      }

      if (!supabase) {
        console.warn('Supabase client not configured for signOut');
        return { error: notConfiguredError() };
      }

      try {
        return await supabase.auth.signOut();
      } catch (error: any) {
        if (error?.message?.includes('rate limit')) {
          console.warn('Supabase rate limit hit');
          return { error: { message: 'Rate limit exceeded' } };
        }
        return { error: { message: error?.message || 'An unexpected error occurred' } };
      }
    }
  },

  from: (table: string) => {
    return {
      select: (columns: string) => ({
        eq: (column: string, value: any) => ({
          single: async () => {
            const key = `db-${table}-select`;

            if (!rateLimiter.isAllowed(key)) {
              console.warn(`Rate limit exceeded for ${table} select`);
              return { data: null, error: { message: 'Rate limit exceeded' } };
            }

            if (!supabase) {
              console.warn(`Supabase client not configured for ${table} select`);
              return { data: null, error: notConfiguredError() };
            }

            try {
              return await supabase.from(table).select(columns).eq(column, value).single();
            } catch (error: any) {
              return { data: null, error: { message: error?.message || 'An unexpected error occurred' } };
            }
          }
        })
      }),

      update: (data: any) => ({
        eq: (column: string, value: any) => ({
          select: async () => {
            const key = `db-${table}-update`;

            if (!rateLimiter.isAllowed(key)) {
              console.warn(`Rate limit exceeded for ${table} update`);
              return { data: null, error: { message: 'Rate limit exceeded' } };
            }

            if (!supabase) {
              console.warn(`Supabase client not configured for ${table} update`);
              return { data: null, error: notConfiguredError() };
            }

            try {
              return await supabase.from(table).update(data).eq(column, value).select();
            } catch (error: any) {
              return { data: null, error: { message: error?.message || 'An unexpected error occurred' } };
            }
          }
        })
      })
    };
  }
};
