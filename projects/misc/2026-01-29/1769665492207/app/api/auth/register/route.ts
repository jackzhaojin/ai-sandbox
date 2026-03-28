import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import {
  hashPassword,
  createToken,
  setAuthCookie,
  generateAvatarColor,
  generateId,
} from '@/lib/auth';
import type { User } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const { username, email, password } = await request.json();

    // Validation
    if (!username || !email || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (username.length < 3) {
      return NextResponse.json(
        { error: 'Username must be at least 3 characters' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = db
      .prepare('SELECT id FROM users WHERE email = ? OR username = ?')
      .get(email, username);

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 409 }
      );
    }

    // Create user
    const passwordHash = await hashPassword(password);
    const userId = generateId();
    const avatarColor = generateAvatarColor();

    db.prepare(
      'INSERT INTO users (id, username, email, password_hash, avatar_color, created_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(userId, username, email, passwordHash, avatarColor, Date.now());

    // Create token and set cookie
    const token = await createToken({ userId, username, email });
    await setAuthCookie(token);

    return NextResponse.json({
      user: { id: userId, username, email, avatarColor },
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
