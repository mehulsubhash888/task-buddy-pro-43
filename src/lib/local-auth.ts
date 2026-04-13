// Local authentication system using localStorage
// Passwords are hashed using a simple but effective approach

const AUTH_USERS_KEY = "taskflow_users";
const AUTH_SESSION_KEY = "taskflow_session";

export interface LocalUser {
  username: string;
  passwordHash: string;
  recoveryPhrase: string; // stored hashed
  createdAt: string;
}

// Simple hash function for localStorage auth (not for production with real security needs)
async function hashString(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function getUsers(): LocalUser[] {
  try {
    return JSON.parse(localStorage.getItem(AUTH_USERS_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveUsers(users: LocalUser[]) {
  localStorage.setItem(AUTH_USERS_KEY, JSON.stringify(users));
}

export function getSession(): string | null {
  return localStorage.getItem(AUTH_SESSION_KEY);
}

export function logout() {
  localStorage.removeItem(AUTH_SESSION_KEY);
}

export async function signup(
  username: string,
  password: string,
  recoveryPhrase: string
): Promise<{ success: boolean; error?: string }> {
  const users = getUsers();
  const normalizedUsername = username.toLowerCase().trim();

  if (users.find((u) => u.username === normalizedUsername)) {
    return { success: false, error: "Username already exists" };
  }

  if (password.length < 4) {
    return { success: false, error: "Password must be at least 4 characters" };
  }

  if (recoveryPhrase.trim().length < 3) {
    return { success: false, error: "Recovery phrase must be at least 3 characters" };
  }

  const passwordHash = await hashString(password);
  const recoveryHash = await hashString(recoveryPhrase.toLowerCase().trim());

  users.push({
    username: normalizedUsername,
    passwordHash,
    recoveryPhrase: recoveryHash,
    createdAt: new Date().toISOString(),
  });

  saveUsers(users);
  localStorage.setItem(AUTH_SESSION_KEY, normalizedUsername);
  return { success: true };
}

export async function login(
  username: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  const users = getUsers();
  const normalizedUsername = username.toLowerCase().trim();
  const user = users.find((u) => u.username === normalizedUsername);

  if (!user) {
    return { success: false, error: "User not found" };
  }

  const passwordHash = await hashString(password);
  if (user.passwordHash !== passwordHash) {
    return { success: false, error: "Incorrect password" };
  }

  localStorage.setItem(AUTH_SESSION_KEY, normalizedUsername);
  return { success: true };
}

export async function resetPassword(
  username: string,
  recoveryPhrase: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  const users = getUsers();
  const normalizedUsername = username.toLowerCase().trim();
  const userIndex = users.findIndex((u) => u.username === normalizedUsername);

  if (userIndex === -1) {
    return { success: false, error: "User not found" };
  }

  const recoveryHash = await hashString(recoveryPhrase.toLowerCase().trim());
  if (users[userIndex].recoveryPhrase !== recoveryHash) {
    return { success: false, error: "Incorrect recovery phrase" };
  }

  if (newPassword.length < 4) {
    return { success: false, error: "Password must be at least 4 characters" };
  }

  users[userIndex].passwordHash = await hashString(newPassword);
  saveUsers(users);
  return { success: true };
}
