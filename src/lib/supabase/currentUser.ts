/**
 * Module-level user identity for client-side sync functions.
 * Set by DataProvider on mount, read by syncSession/syncBookmark.
 * NOT a React context — accessible from store actions and utility functions.
 */

let userId: string | null = null;
let authenticated = false;

export function setCurrentUser(
  id: string | null,
  isAuth: boolean,
): void {
  if (typeof window === "undefined") return;
  userId = id;
  authenticated = isAuth;
}

export function getCurrentUserId(): string | null {
  return userId;
}

export function getIsAuthenticated(): boolean {
  return authenticated;
}
