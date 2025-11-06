"use client";

import type { User } from "firebase/auth";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut as fbSignOut,
  type UserCredential,
} from "firebase/auth";
import { auth } from "./firebase";
import { toast } from "sonner";
import { createAuthNotification } from "./notificationHelpers";

// Export auth for use in other components
export { auth };

const ALLOWED_EMAIL = "gauravpatil9262@gmail.com";

// Google Sign-In
export async function signInWithGoogle(): Promise<UserCredential> {
  try {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: "select_account",
      login_hint: ALLOWED_EMAIL,
    });

    const cred = await signInWithPopup(auth, provider);
    const user = cred.user;

    // Check if user is authorized
    if (user.email?.toLowerCase() !== ALLOWED_EMAIL) {
      await fbSignOut(auth);
      toast.error(
        "Access restricted to authorized users only. Please contact the owner."
      );
      throw new Error("Unauthorized email address.");
    }

    // Create login notification
    await createAuthNotification("login", user);

    return cred;
  } catch (err: unknown) {
    const message = (err as Error).message || "Google Sign-In failed.";
    if (!message.includes("popup-closed-by-user")) {
      toast.error(message);
    }
    throw err;
  }
}

export async function signIn(
  email: string,
  password: string
): Promise<UserCredential> {
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const user = cred.user;
    if (user.email?.toLowerCase() !== ALLOWED_EMAIL) {
      await fbSignOut(auth);
      toast.error("Access restricted to Gaurav. Please contact the owner.");
      throw new Error("Access restricted to Gaurav.");
    }
    return cred;
  } catch (err: unknown) {
    // normalize firebase errors
    const message = (err as Error).message || "Authentication failed.";
    toast.error(message);
    throw err;
  }
}

export async function signOut(): Promise<void> {
  const user = auth.currentUser;
  if (user) {
    await createAuthNotification("logout", user);
  }
  await fbSignOut(auth);
}

export function initAuthListener(cb: (user: User | null) => void) {
  const unsub = onAuthStateChanged(auth, (user) => {
    if (!user) {
      cb(null);
      return;
    }
    // enforce email gate
    if (user.email?.toLowerCase() !== ALLOWED_EMAIL) {
      // sign out and notify
      void fbSignOut(auth).then(() => {
        toast.error("Access restricted to Gaurav. Please contact the owner.");
        cb(null);
      });
      return;
    }
    cb(user);
  });
  return unsub;
}

export function getUserClient(): Promise<User | null> {
  return new Promise((resolve) => {
    const unsub = onAuthStateChanged(auth, (user) => {
      unsub();
      if (user && user.email?.toLowerCase() === ALLOWED_EMAIL) {
        resolve(user);
      } else {
        resolve(null);
      }
    });
  });
}

export async function requireAdminClient(): Promise<User> {
  const user = await getUserClient();
  if (!user) throw new Error("Unauthorized");
  return user;
}
