// Simple local queue for pending offering creations when Supabase rejects writes (RLS/401).
const STORAGE_KEY = 'ums_offering_queue_v1';

function loadQueue() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Failed to load offering queue', e);
    return [];
  }
}

function saveQueue(queue) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  } catch (e) {
    console.error('Failed to save offering queue', e);
  }
}

export function enqueueOffering(offering) {
  const q = loadQueue();
  q.push({ id: Date.now(), offering, createdAt: new Date().toISOString() });
  saveQueue(q);
  return q.length;
}

export function peekQueue() {
  return loadQueue();
}

export function removeFromQueue(id) {
  const q = loadQueue().filter((i) => i.id !== id);
  saveQueue(q);
  return q.length;
}

export default { enqueueOffering, peekQueue, removeFromQueue };
