let nextId = 1000;

const courses = [
  { id: 1, title: 'Introduction to Programming' },
  { id: 2, title: 'Data Structures' },
  { id: 3, title: 'Algorithms' },
];

const offerings = [
  { id: 201, course_id: 1, term: '2026 Spring', seat_limit: 30, published: true },
  { id: 202, course_id: 2, term: '2026 Spring', seat_limit: 25, published: false },
];

const prerequisites = [
  // { offering_id: 201, prerequisite_course_id: 2 }
];

export const mockApi = {
  fetchCourses: async () => {
    // simulate network latency
    await new Promise((r) => setTimeout(r, 120));
    return courses.slice();
  },
  fetchOfferings: async () => {
    await new Promise((r) => setTimeout(r, 120));
    // join course title
    return offerings.map((o) => ({ ...o, course: courses.find((c) => c.id === o.course_id) }));
  },
  createOffering: async (payload) => {
    const id = nextId++;
    const record = { id, ...payload };
    offerings.push(record);
    await new Promise((r) => setTimeout(r, 80));
    return record;
  },
  addPrerequisites: async (inserts) => {
    inserts.forEach((i) => prerequisites.push(i));
    await new Promise((r) => setTimeout(r, 80));
    return inserts;
  },
  updateOffering: async (id, patch) => {
    const idx = offerings.findIndex((o) => o.id === id);
    if (idx === -1) return null;
    offerings[idx] = { ...offerings[idx], ...patch };
    await new Promise((r) => setTimeout(r, 80));
    return offerings[idx];
  },
};

export default mockApi;
