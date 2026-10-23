export interface Volunteer { id: string; name: string; maxHours: number }
export interface Shift { id: string; name: string; start: number; duration: number; minimum: number }
export interface Preference { volunteerId: string; shiftId: string; available: boolean; weight: number; locked: boolean }
export interface Plan { version: 1; title: string; volunteers: Volunteer[]; shifts: Shift[]; preferences: Preference[] }
export interface Assignment { volunteerId: string; shiftId: string }
export interface PersonScore { volunteerId: string; hours: number; burden: number }
export interface Schedule { assignments: Assignment[]; people: PersonScore[]; required: number; assigned: number; maxBurden: number; sumSquares: number; totalBurden: number }
export interface SolveResult { status: 'invalid' | 'infeasible' | 'incomplete' | 'feasible'; reasons: string[]; baseline?: Schedule; candidate?: Schedule; nodes: number; elapsedMs: number; exhausted: boolean; optimal: boolean }
export interface SolveOptions { maxNodes?: number; maxMs?: number }
export const LIMITS = { volunteers: 12, shifts: 8, label: 80, bytes: 150000 } as const;
