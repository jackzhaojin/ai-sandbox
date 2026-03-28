"use server";

import { signIn, signOut } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";

export interface SignUpFormData {
  name: string;
  email: string;
  password: string;
}

export interface SignInFormData {
  email: string;
  password: string;
}

export interface AuthResult {
  success: boolean;
  error?: string;
}

/**
 * Sign up a new user
 */
export async function signUpAction(data: SignUpFormData): Promise<AuthResult> {
  try {
    const { name, email, password } = data;

    // Validate input
    if (!name || !email || !password) {
      return {
        success: false,
        error: "All fields are required",
      };
    }

    if (password.length < 8) {
      return {
        success: false,
        error: "Password must be at least 8 characters",
      };
    }

    // Check if user already exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser) {
      return {
        success: false,
        error: "User with this email already exists",
      };
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const [newUser] = await db
      .insert(users)
      .values({
        name,
        email,
        passwordHash,
      })
      .returning();

    if (!newUser) {
      return {
        success: false,
        error: "Failed to create user",
      };
    }

    // Sign in the user after successful registration
    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    return {
      success: true,
    };
  } catch (error) {
    console.error("Sign up error:", error);
    return {
      success: false,
      error: "An error occurred during sign up",
    };
  }
}

/**
 * Sign in an existing user
 */
export async function signInAction(data: SignInFormData): Promise<AuthResult> {
  try {
    const { email, password } = data;

    // Validate input
    if (!email || !password) {
      return {
        success: false,
        error: "Email and password are required",
      };
    }

    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    return {
      success: true,
    };
  } catch (error) {
    console.error("Sign in error:", error);

    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return {
            success: false,
            error: "Invalid email or password",
          };
        default:
          return {
            success: false,
            error: "An error occurred during sign in",
          };
      }
    }

    return {
      success: false,
      error: "An error occurred during sign in",
    };
  }
}

/**
 * Sign out the current user
 */
export async function signOutAction() {
  await signOut({ redirect: false });
  redirect("/login");
}
