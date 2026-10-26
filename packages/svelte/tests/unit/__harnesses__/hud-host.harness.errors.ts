export class HudHostHarnessError extends Error {
  constructor(harnessName: string, message: string, context: Record<string, unknown>) {
    super(`[${harnessName}] ${message}\nContext: ${JSON.stringify(context, null, 2)}`);
    this.name = "HudHostHarnessError";
  }
}
