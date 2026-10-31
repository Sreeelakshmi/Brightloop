import fs from "fs";
import path from "path";
import { MockUser, PasswordResetToken, DevEmail, generateSeedUsers } from "./seed";
import { generateFreshMockStore, MockStore } from "../data/mock-generator";

export interface MockDatabaseState {
  users: MockUser[];
  tokens: PasswordResetToken[];
  emails: DevEmail[];
  store: MockStore;
}

const DATA_DIR = path.resolve(process.cwd(), ".demo-data");
const DATA_FILE = path.join(DATA_DIR, "mock-db.json");

// In-memory singleton cache
let memoryDb: MockDatabaseState | null = null;
const loginAttempts = new Map<string, { count: number; lockedUntil: number }>();

function loadFromDisk(): MockDatabaseState | null {
  try {
    if (typeof window === "undefined" && fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, "utf-8");
      const parsed = JSON.parse(raw) as MockDatabaseState;
      // Ensure schema freshness
      if (parsed?.store?.products && parsed?.store?.taxes && parsed?.store?.discounts) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn("[MockDB] Could not load persisted demo data, falling back to seed.", err);
  }
  return null;
}

function persistToDisk(state: MockDatabaseState) {
  try {
    if (typeof window === "undefined") {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2), "utf-8");
    }
  } catch (err) {
    console.warn("[MockDB] Failed to persist demo data to disk.", err);
  }
}

export function getMockDb(): MockDatabaseState {
  if (memoryDb) {
    return memoryDb;
  }

  // 1. Try reading from disk
  const onDisk = loadFromDisk();
  if (onDisk && onDisk.users && onDisk.store) {
    memoryDb = onDisk;
    return memoryDb;
  }

  // 2. Initialize from Seed
  memoryDb = {
    users: generateSeedUsers(),
    tokens: [],
    emails: [],
    store: generateFreshMockStore(),
  };

  persistToDisk(memoryDb);
  return memoryDb;
}

export function saveMockDb(state: MockDatabaseState) {
  memoryDb = state;
  persistToDisk(state);
}

export function resetMockDb(): MockDatabaseState {
  memoryDb = {
    users: generateSeedUsers(),
    tokens: [],
    emails: [],
    store: generateFreshMockStore(),
  };
  persistToDisk(memoryDb);
  loginAttempts.clear();
  return memoryDb;
}

// Rate Limiting Helpers
interface RateLimitEntry {
  attempts: number;
  lockedUntil: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

export function checkRateLimit(key: string): { allowed: boolean; retryAfterSeconds: number } {
  const entry = rateLimitStore.get(key);
  if (!entry) return { allowed: true, retryAfterSeconds: 0 };

  const now = Date.now();
  if (entry.lockedUntil > now) {
    const retryAfterSeconds = Math.ceil((entry.lockedUntil - now) / 1000);
    return { allowed: false, retryAfterSeconds };
  }

  return { allowed: true, retryAfterSeconds: 0 };
}

export function recordFailedLogin(key: string): void {
  const now = Date.now();
  const entry = rateLimitStore.get(key) || { attempts: 0, lockedUntil: 0 };
  entry.attempts += 1;

  if (entry.attempts >= 5) {
    entry.lockedUntil = now + 15 * 60 * 1000; // 15 min lock
  }

  rateLimitStore.set(key, entry);
}

export function recordSuccessfulLogin(key: string): void {
  rateLimitStore.delete(key);
}

export function getLoginAttempts(email: string) {
  const key = `login:${email.toLowerCase().trim()}`;
  const entry = rateLimitStore.get(key) || { attempts: 0, lockedUntil: 0 };
  return { count: entry.attempts, lockedUntil: entry.lockedUntil };
}

export function resetLoginAttempts(email: string) {
  const key = `login:${email.toLowerCase().trim()}`;
  rateLimitStore.delete(key);
}