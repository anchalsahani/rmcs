import { io, type Socket } from "socket.io-client";

function getSocketUrl() {
  const envUrl = process.env.NEXT_PUBLIC_SOCKET_URL;
  if (envUrl) return envUrl;

  return "http://localhost:5000";
}

const STORAGE_KEY = "rmcs_session";

export interface StoredSession {
  roomId: string;
  playerName: string;
  socketId?: string;
  sessionId: string;
}

function generateSessionId() {
  return `rmcs_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`;
}

declare global {
  interface Window {
    __RMCS_SOCKET__?: Socket;
  }
}

function createSocket() {
  const url = getSocketUrl();
  const instance = io(url, {
    autoConnect: false,
    transports: ["websocket"],
  });

  instance.on("connect", () => {
    console.log("[socket] connected", instance.id);

    const session = getStoredSession();
    if (session) {
      persistSession({
        ...session,
        socketId: instance.id,
        sessionId: ensureSessionId(session.sessionId)
      });
      console.log("[socket] syncing stored session", session);
      instance.emit("sync_session", session);
    }
  });

  instance.on("disconnect", (reason) => {
    console.log("[socket] disconnected", reason);
  });

  instance.on("connect_error", (error) => {
    console.error("[socket] connect_error", error.message);
  });

  return instance;
}

function getSocket(): Socket | null {
  if (typeof window === "undefined") {
    return null;
  }

  if (!window.__RMCS_SOCKET__) {
    window.__RMCS_SOCKET__ = createSocket();
  }

  return window.__RMCS_SOCKET__;
}

export function connectSocket() {
  const socket = getSocket();
  if (socket && !socket.connected) {
    console.log("[socket] connecting to", getSocketUrl());
    socket.connect();
  }
  return socket;
}

export function persistSession(session: StoredSession) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function getStoredSession(): StoredSession | null {
  if (typeof window === "undefined") return null;

  const raw = window.sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as StoredSession;
  } catch (error) {
    console.error("[socket] failed to parse stored session", error);
    window.sessionStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function clearStoredSession() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(STORAGE_KEY);
}

export function ensureSessionId(existing?: string) {
  if (existing) return existing;

  const stored = getStoredSession();
  if (stored?.sessionId) {
    return stored.sessionId;
  }

  return generateSessionId();
}

const socket = getSocket();

export default socket;
