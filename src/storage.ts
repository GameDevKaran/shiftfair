import { LIMITS, type Plan } from './model.js';
import { validatePlan } from './solver.js';
export const STORAGE_KEY = 'shiftfair.plan.v1';
export interface StoragePort { getItem(key: string): string | null; setItem(key: string, value: string): void }
export function parsePlan(raw: string): { plan?: Plan; error?: string } {
  if (new TextEncoder().encode(raw).length > LIMITS.bytes) return { error: 'Saved plan exceeds the 150 KB limit. Existing data was preserved.' };
  try {
    const value: unknown = JSON.parse(raw);
    const errors = validatePlan(value);
    return errors.length ? { error: `Saved plan is invalid: ${errors.slice(0, 3).join(' ')} Existing data was preserved.` } : { plan: value as Plan };
  } catch { return { error: 'Saved plan is not valid JSON. Existing data was preserved.' }; }
}
export function loadPlan(storage?: StoragePort): { plan?: Plan; error?: string } {
  try { const raw = (storage ?? localStorage).getItem(STORAGE_KEY); return raw === null ? {} : parsePlan(raw); }
  catch { return { error: 'Browser storage is unavailable. Your current plan is unchanged.' }; }
}
export function savePlan(plan: Plan, storage?: StoragePort): string | undefined {
  const errors = validatePlan(plan);
  if (errors.length) return `Cannot save: ${errors.slice(0, 3).join(' ')}`;
  try {
    const raw = JSON.stringify(plan);
    if (new TextEncoder().encode(raw).length > LIMITS.bytes) return 'Plan exceeds the 150 KB storage limit.';
    (storage ?? localStorage).setItem(STORAGE_KEY, raw);
    return undefined;
  } catch { return 'Browser storage could not save this plan. Your current inputs are still available; existing saved data was not replaced.'; }
}
