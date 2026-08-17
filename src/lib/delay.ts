/** Sleep helper — kept small so callers don't reinvent it. */
export const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
