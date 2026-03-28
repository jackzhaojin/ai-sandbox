import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { getDb, User } from './db';

const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);

const COOKIE_NAME = 'session';
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 60 * 60 * 24 * 7, // 7 days
  path: '/',
};

export interface SessionData {
  userId: number;
  email: string;
  username: string;
}

// Create a session token
export async function createSession(user: Pick<User, 'id' | 'email' | 'username'>): Promise<string> {
  const token = await new SignJWT({
    userId: user.id,
    email: user.email,
    username: user.username,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(SECRET_KEY);

  return token;
}

// Verify and decode session token
export async function verifySession(token: string): Promise<SessionData | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return payload as SessionData;
  } catch (error) {
    return null;
  }
}

// Get current session from cookies
export async function getSession(): Promise<SessionData | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  return verifySession(token);
}

// Set session cookie
export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, COOKIE_OPTIONS);
}

// Delete session cookie
export async function deleteSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

// Authenticate user with email and password
export async function authenticateUser(
  email: string,
  password: string
): Promise<Pick<User, 'id' | 'email' | 'username'> | null> {
  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as User | undefined;

  if (!user) {
    return null;
  }

  const passwordMatch = await bcrypt.compare(password, user.password_hash);

  if (!passwordMatch) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    username: user.username,
  };
}

// Create new user
export async function createUser(
  email: string,
  password: string,
  username: string
): Promise<Pick<User, 'id' | 'email' | 'username'> | null> {
  const db = getDb();

  // Check if user already exists
  const existingUser = db
    .prepare('SELECT id FROM users WHERE email = ? OR username = ?')
    .get(email, username);

  if (existingUser) {
    return null;
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 10);

  // Insert user
  const result = db
    .prepare('INSERT INTO users (email, password_hash, username) VALUES (?, ?, ?)')
    .run(email, passwordHash, username);

  return {
    id: result.lastInsertRowid as number,
    email,
    username,
  };
}

// Get user by ID
export function getUserById(userId: number): User | null {
  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as User | undefined;
  return user || null;
}
