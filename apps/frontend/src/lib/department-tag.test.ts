import { getDepartmentTagTone } from './department-tag';

describe('getDepartmentTagTone', () => {
  it('is deterministic for the same department', () => {
    expect(getDepartmentTagTone('General Medicine')).toBe(
      getDepartmentTagTone('general medicine ')
    );
  });

  it('returns a Tailwind background tone', () => {
    expect(getDepartmentTagTone('Radiology')).toMatch(/^bg-/);
  });

  it('has a fallback when the department is missing', () => {
    expect(getDepartmentTagTone(null)).toMatch(/^bg-/);
  });
});
