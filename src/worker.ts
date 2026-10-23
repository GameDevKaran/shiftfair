import { solve } from './solver.js';
const workerScope = globalThis as unknown as { onmessage: ((event: MessageEvent) => void) | null; postMessage: (data: unknown) => void };
workerScope.onmessage = event => {
  const { id, plan } = event.data ?? {};
  try { workerScope.postMessage({ id, result: solve(plan) }); }
  catch { workerScope.postMessage({ id, error: 'The schedule search failed. Your inputs are unchanged; no result has been accepted.' }); }
};
