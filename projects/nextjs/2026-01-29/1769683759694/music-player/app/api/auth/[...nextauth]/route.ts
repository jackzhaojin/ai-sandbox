/**
 * NextAuth.js API Route Handler
 * Handles all authentication requests (/api/auth/*)
 */

import { handlers } from '@/lib/auth';

export const { GET, POST } = handlers;
