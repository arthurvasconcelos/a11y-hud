const STORAGE_KEY = "a11y-hud:ignores";

export interface IgnoreEntry {
  ruleId: string;
  selector?: string;
}

function load(): IgnoreEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return [];
    return JSON.parse(raw) as IgnoreEntry[];
  } catch {
    return [];
  }
}

function save(entries: IgnoreEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // storage unavailable — no-op
  }
}

function matches(a: IgnoreEntry, b: IgnoreEntry): boolean {
  return a.ruleId === b.ruleId && a.selector === b.selector;
}

export function addIgnore(ruleId: string, selector?: string): void {
  const entries = load();
  const entry: IgnoreEntry = selector !== undefined ? { ruleId, selector } : { ruleId };
  if (entries.some((e) => matches(e, entry))) return;
  entries.push(entry);
  save(entries);
}

export function removeIgnore(ruleId: string, selector?: string): void {
  const entry: IgnoreEntry = selector !== undefined ? { ruleId, selector } : { ruleId };
  save(load().filter((e) => !matches(e, entry)));
}

export function clearIgnores(): void {
  save([]);
}

export function listIgnores(): IgnoreEntry[] {
  return load();
}

export function exportIgnores(): string {
  return JSON.stringify(listIgnores(), null, 2);
}

export function importIgnores(json: string): void {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return;
  }
  if (!Array.isArray(parsed)) return;
  const entries: IgnoreEntry[] = [];
  for (const item of parsed) {
    if (typeof item !== "object" || item === null) continue;
    const { ruleId, selector } = item as Record<string, unknown>;
    if (typeof ruleId !== "string") continue;
    if (selector !== undefined && typeof selector !== "string") continue;
    entries.push(selector !== undefined ? { ruleId, selector: selector as string } : { ruleId });
  }
  save(entries);
}
