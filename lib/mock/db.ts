import fs from "fs";
import path from "path";
import { MockUser, PasswordResetToken, DevEmail, generateSeedUsers } from "./seed";
import { getMockStore, MockStore } from "../data/mock-generator";

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
      return JSON.parse(raw) as MockDatabaseState;
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
    store: getMockStore(),
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
    store: getMockStore(),
  };
  persistToDisk(memoryDb);
  loginAttempts.clear();
  return memoryDb;
}

// ── Rate Limiter ─────────────────────────────────────────────────────────────
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes

export function checkRateLimit(key: string): { allowed: boolean; remainingAttempts: number; retryAfterSeconds: number } {
  const now = Date.now();
  const record = loginAttempts.get(key);

  if (!record) {
    return { allowed: true, remainingAttempts: MAX_FAILED_ATTEMPTS, retryAfterSeconds: 0 };
  }

  if (record.lockedUntil > now) {
    return {
      allowed: false,
      remainingAttempts: 0,
      retryAfterSeconds: Math.ceil((record.lockedUntil - now) / 1000),
    };
  }

  // Lock expired
  if (record.lockedUntil <= now && record.lockedUntil > 0) {
    loginAttempts.delete(key);
    return { allowed: true, remainingAttempts: MAX_FAILED_ATTEMPTS, retryAfterSeconds: 0 };
  }

  return {
    allowed: true,
    remainingAttempts: Math.max(0, MAX_FAILED_ATTEMPTS - record.count),
    retryAfterSeconds: 0,
  };
}

export function recordFailedLogin(key: string) {
  const now = Date.now();
  const record = loginAttempts.get(key) || { count: 0, lockedUntil: 0 };
  record.count += 1;

  if (record.count >= MAX_FAILED_ATTEMPTS) {
    record.lockedUntil = now + LOCKOUT_MS;
  }

  loginAttempts.set(key, record);
}

export function recordSuccessfulLogin(key: string) {
  loginAttempts.delete(key);
}
