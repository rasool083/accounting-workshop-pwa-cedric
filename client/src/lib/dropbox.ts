import type { DriveBackupFile } from "./googleDrive";
import { isBackupFilename } from "./googleDrive";

/**
 * CEDRIC r6: Dropbox backup for the PWA.
 * OAuth 2 "code + PKCE" flow with token_access_type=offline, so the user
 * approves once and the app refreshes short-lived access tokens itself.
 * No client secret exists in this code (PKCE does not need one).
 * The Dropbox app must use "App folder" access; every backup lives in
 * /Apps/<app name>/ in the user's Dropbox.
 */
const PREFIX = "accounting-workshop-pwa-cedric";
const APP_KEY_KEY = `${PREFIX}:dropbox-app-key`;
const AUTH_KEY = `${PREFIX}:dropbox-auth`;
const VERIFIER_KEY = `${PREFIX}:dropbox-pkce-verifier`;

/** Public app key of the project's Dropbox app (not a secret). Empty until created. */
export const DEFAULT_DROPBOX_APP_KEY = "";

type StoredAuth = { refreshToken: string; accountId?: string };
let memoryToken: { value: string; expiresAt: number } | null = null;

export function getDropboxAppKey() {
  if (typeof localStorage === "undefined") return DEFAULT_DROPBOX_APP_KEY;
  return localStorage.getItem(APP_KEY_KEY) || DEFAULT_DROPBOX_APP_KEY;
}

export function setDropboxAppKey(appKey: string) {
  localStorage.setItem(APP_KEY_KEY, appKey.trim());
}

export function dropboxRedirectUri(origin: string, basePath: string) {
  const base = basePath.endsWith("/") ? basePath : `${basePath}/`;
  return `${origin}${base}`;
}

function currentRedirectUri() {
  const base = (import.meta as { env?: { BASE_URL?: string } }).env?.BASE_URL || "/";
  return dropboxRedirectUri(window.location.origin, base);
}

function base64Url(bytes: Uint8Array) {
  let binary = "";
  bytes.forEach(byte => (binary += String.fromCharCode(byte)));
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function createCodeVerifier(random: Uint8Array = crypto.getRandomValues(new Uint8Array(48))) {
  return base64Url(random);
}

export async function codeChallengeFor(verifier: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  return base64Url(new Uint8Array(digest));
}

function readAuth(): StoredAuth | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    const parsed = raw ? (JSON.parse(raw) as StoredAuth) : null;
    return parsed?.refreshToken ? parsed : null;
  } catch {
    return null;
  }
}

export function isDropboxConnected() {
  return typeof localStorage !== "undefined" && readAuth() !== null;
}

/** Sends the browser to Dropbox's consent page. Returns only on failure. */
export async function startDropboxAuth(appKey: string) {
  const key = appKey.trim();
  if (!key) throw new Error("ابتدا App key برنامهٔ Dropbox را وارد کنید");
  setDropboxAppKey(key);
  const verifier = createCodeVerifier();
  sessionStorage.setItem(VERIFIER_KEY, verifier);
  const params = new URLSearchParams({
    client_id: key,
    response_type: "code",
    code_challenge: await codeChallengeFor(verifier),
    code_challenge_method: "S256",
    token_access_type: "offline",
    redirect_uri: currentRedirectUri(),
  });
  window.location.assign(`https://www.dropbox.com/oauth2/authorize?${params}`);
}

export function hasPendingDropboxAuth() {
  if (typeof window === "undefined") return false;
  const params = new URLSearchParams(window.location.search);
  return Boolean(sessionStorage.getItem(VERIFIER_KEY)) && (params.has("code") || params.has("error"));
}

function clearAuthQuery() {
  const url = new URL(window.location.href);
  ["code", "state", "error", "error_description"].forEach(name => url.searchParams.delete(name));
  window.history.replaceState(null, "", url.toString());
}

async function tokenRequest(body: Record<string, string>) {
  const response = await fetch("https://api.dropboxapi.com/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.access_token)
    throw new Error(data.error_description || data.error || "دریافت مجوز Dropbox ناموفق بود");
  memoryToken = { value: data.access_token, expiresAt: Date.now() + (Number(data.expires_in) || 14400) * 1000 - 60000 };
  return data as { access_token: string; refresh_token?: string; account_id?: string };
}

/** Finishes the redirect back from Dropbox. Returns true when a new connection was made. */
export async function completeDropboxAuth() {
  if (!hasPendingDropboxAuth()) return false;
  const params = new URLSearchParams(window.location.search);
  const verifier = sessionStorage.getItem(VERIFIER_KEY) || "";
  sessionStorage.removeItem(VERIFIER_KEY);
  clearAuthQuery();
  if (params.has("error"))
    throw new Error(params.get("error_description") || "اجازهٔ Dropbox داده نشد");
  const data = await tokenRequest({
    code: params.get("code") || "",
    grant_type: "authorization_code",
    code_verifier: verifier,
    client_id: getDropboxAppKey(),
    redirect_uri: currentRedirectUri(),
  });
  if (!data.refresh_token) throw new Error("Dropbox دسترسی دائمی نداد؛ دوباره اتصال را بزنید");
  localStorage.setItem(AUTH_KEY, JSON.stringify({ refreshToken: data.refresh_token, accountId: data.account_id }));
  return true;
}

async function accessToken() {
  if (memoryToken && memoryToken.expiresAt > Date.now()) return memoryToken.value;
  const auth = readAuth();
  if (!auth) throw new Error("Dropbox به این مرورگر متصل نیست");
  const data = await tokenRequest({
    grant_type: "refresh_token",
    refresh_token: auth.refreshToken,
    client_id: getDropboxAppKey(),
  });
  return data.access_token;
}

export async function disconnectDropbox() {
  try {
    const token = await accessToken();
    await fetch("https://api.dropboxapi.com/2/auth/token/revoke", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    /* local disconnect still happens */
  }
  memoryToken = null;
  localStorage.removeItem(AUTH_KEY);
}

type DropboxEntry = {
  ".tag": string;
  id: string;
  name: string;
  path_lower?: string;
  path_display?: string;
  server_modified?: string;
  size?: number;
};

export function dropboxEntriesToBackups(entries: DropboxEntry[]): DriveBackupFile[] {
  return entries
    .filter(entry => entry[".tag"] === "file" && isBackupFilename(entry.name))
    .map(entry => ({
      id: entry.path_lower || `/${entry.name.toLowerCase()}`,
      name: entry.name,
      mimeType: "application/json",
      modifiedTime: entry.server_modified,
      size: entry.size === undefined ? undefined : String(entry.size),
    }))
    .sort((a, b) => (b.modifiedTime || "").localeCompare(a.modifiedTime || ""));
}

async function apiError(response: Response, fallback: string) {
  const text = await response.text().catch(() => "");
  if (response.status === 409 && text.includes("not_found")) return new Error("فایل در Dropbox پیدا نشد");
  if (response.status === 401) return new Error("مجوز Dropbox منقضی یا لغو شده؛ دوباره اتصال را بزنید");
  return new Error(fallback);
}

export async function listDropboxBackups() {
  const token = await accessToken();
  const entries: DropboxEntry[] = [];
  let response = await fetch("https://api.dropboxapi.com/2/files/list_folder", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ path: "", limit: 2000 }),
  });
  for (;;) {
    if (!response.ok) throw await apiError(response, "خواندن فهرست Dropbox ناموفق بود");
    const page = await response.json();
    entries.push(...page.entries);
    if (!page.has_more) break;
    response = await fetch("https://api.dropboxapi.com/2/files/list_folder/continue", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ cursor: page.cursor }),
    });
  }
  return dropboxEntriesToBackups(entries);
}

export async function uploadDropboxBackup(filename: string, payload: string) {
  if (!/^[\x20-\x7e]+$/.test(filename)) throw new Error("نام فایل پشتیبان باید لاتین باشد");
  const token = await accessToken();
  const response = await fetch("https://content.dropboxapi.com/2/files/upload", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/octet-stream",
      "Dropbox-API-Arg": JSON.stringify({ path: `/${filename}`, mode: "add", autorename: false, mute: true }),
    },
    body: new Blob([payload], { type: "application/json" }),
  });
  if (!response.ok) throw await apiError(response, "ذخیره در Dropbox ناموفق بود");
  return dropboxEntriesToBackups([{ ".tag": "file", ...(await response.json()) }])[0];
}

export async function downloadDropboxBackup(path: string) {
  const token = await accessToken();
  const response = await fetch("https://content.dropboxapi.com/2/files/download", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Dropbox-API-Arg": JSON.stringify({ path }) },
  });
  if (!response.ok) throw await apiError(response, "دریافت فایل از Dropbox ناموفق بود");
  return response.text();
}
