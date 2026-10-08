/**
 * Testlerde gerçek case-kit sunucusunu kullanmak için yardımcılar.
 * Her Jest worker'ı kendi portunda ayrı bir server.js açar; /debug anahtarları dosyalar arasında karışmaz.
 */
import { spawn, type ChildProcess } from 'child_process';
import http from 'http';
import path from 'path';

const PORT = 4100 + Number(process.env.JEST_WORKER_ID ?? 1);
export const CASE_KIT_URL = `http://localhost:${PORT}`;

let server: ChildProcess | null = null;

/** Uygulamanın gönderdiği isteklerin URL'leri (en eskiden yeniye). */
export const requestLog: string[] = [];

type NodeResponse = { ok: boolean; status: number; json: () => Promise<unknown> };

function get(url: string, signal?: AbortSignal): Promise<NodeResponse> {
  return new Promise((resolve, reject) => {
    const abortError = () => Object.assign(new Error('Aborted'), { name: 'AbortError' });
    if (signal?.aborted) return reject(abortError());
    const request = http.get(url, response => {
      let body = '';
      response.setEncoding('utf8');
      response.on('data', chunk => (body += chunk));
      response.on('end', () => {
        const status = response.statusCode ?? 0;
        resolve({ ok: status >= 200 && status < 300, status, json: async () => JSON.parse(body) });
      });
    });
    request.on('error', () => reject(signal?.aborted ? abortError() : new TypeError('Network request failed')));
    signal?.addEventListener('abort', () => request.destroy());
  });
}

/** Jest ortamındaki sahte fetch yerine gerçek HTTP (Node http) kullanır ve istekleri kaydeder. */
export function useRealFetch() {
  globalThis.fetch = ((url: string, init?: { signal?: AbortSignal }) => {
    requestLog.push(url);
    return get(url, init?.signal);
  }) as unknown as typeof fetch;
}

export async function startCaseKit() {
  server = spawn(process.execPath, [path.join(__dirname, '../../case-kit/server.js')], {
    env: { ...process.env, PORT: String(PORT) },
    stdio: 'ignore',
  });
  for (let attempt = 0; attempt < 50; attempt++) {
    try {
      await get(`${CASE_KIT_URL}/health`);
      return;
    } catch {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  throw new Error('case-kit sunucusu açılmadı');
}

export function stopCaseKit() {
  server?.kill();
  server = null;
}

/** case-kit senaryo anahtarları: '/debug/fail-once', '/debug/empty?value=on', '/debug/reset' … */
export async function debug(pathAndQuery: string) {
  await get(`${CASE_KIT_URL}${pathAndQuery}`);
}

/** Uygulamayı bypass ederek sunucunun ham yanıtını alır (beklenen değerleri sunucudan okumak için). */
export async function serverGet<T>(pathAndQuery: string): Promise<T> {
  return (await get(`${CASE_KIT_URL}${pathAndQuery}`)).json() as Promise<T>;
}
