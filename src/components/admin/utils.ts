export type Path = (string | number)[];
type AnyObj = Record<string, unknown> | unknown[];

export function getAt(obj: unknown, path: Path): unknown {
  return path.reduce<unknown>((acc, key) => (acc == null ? undefined : (acc as Record<string | number, unknown>)[key]), obj);
}

/** Salinan immutable dengan nilai baru di path. Objek "en" dibuat otomatis bila belum ada. */
export function setAt<T>(obj: T, path: Path, value: unknown): T {
  if (!path.length) return value as T;
  const [head, ...rest] = path;
  const current = (obj ?? (typeof head === "number" ? [] : {})) as AnyObj;
  const copy = (Array.isArray(current) ? [...current] : { ...current }) as Record<string | number, unknown>;
  copy[head] = setAt(copy[head], rest, value);
  return copy as T;
}

export function moveItem<T>(arr: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= arr.length || to >= arr.length) return arr;
  const next = [...arr];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export const pathKey = (path: Path) => path.join(".");

export function newId(prefix: string) {
  const rand = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID().slice(0, 8) : Math.random().toString(36).slice(2, 10);
  return `${prefix}-${rand}`;
}

export function slugify(text: string) {
  return text.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
}
