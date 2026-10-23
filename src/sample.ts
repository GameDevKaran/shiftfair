import type { Plan } from './model.js';

/** Authored synthetic fixture, not records about real volunteers. */
export function createSample(): Plan {
  const volunteers = [
    { id: 'alex', name: 'Alex', maxHours: 8 },
    { id: 'blair', name: 'Blair', maxHours: 8 },
    { id: 'casey', name: 'Casey', maxHours: 8 },
    { id: 'devon', name: 'Devon', maxHours: 8 },
  ];
  const shifts = [
    { id: 'welcome', name: 'Welcome desk', start: 540, duration: 120, minimum: 1 },
    { id: 'workshop', name: 'Workshop support', start: 660, duration: 120, minimum: 1 },
    { id: 'lunch', name: 'Lunch service', start: 780, duration: 120, minimum: 1 },
    { id: 'close', name: 'Closing crew', start: 900, duration: 120, minimum: 1 },
  ];
  return {
    version: 1,
    title: 'Community day — synthetic example',
    volunteers,
    shifts,
    preferences: volunteers.flatMap(person => shifts.map(shift => ({
      volunteerId: person.id, shiftId: shift.id, available: true, weight: 0, locked: false,
    }))),
  };
}
