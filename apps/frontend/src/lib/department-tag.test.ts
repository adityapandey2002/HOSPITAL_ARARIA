import { getDepartmentShortName, getDepartmentTagTone } from './department-tag';

describe('getDepartmentShortName', () => {
  it('uses conventional abbreviations for the reference departments', () => {
    expect(getDepartmentShortName('General Medicine')).toBe('GM');
    expect(getDepartmentShortName('Obstetrics & Gynecology')).toBe('OBG');
    expect(getDepartmentShortName('Emergency Medicine')).toBe('EM');
    expect(getDepartmentShortName('ENT')).toBe('ENT');
  });

  it('normalises case and surrounding whitespace', () => {
    expect(getDepartmentShortName('  general   medicine ')).toBe('GM');
  });

  it('derives initials for departments added later', () => {
    expect(getDepartmentShortName('Burns & Plastic Surgery')).toBe('BPS');
    expect(getDepartmentShortName('Cardiology')).toBe('CARD');
  });

  it('degrades to a readable placeholder when the department is missing', () => {
    expect(getDepartmentShortName(null)).toBe('DEPT');
    expect(getDepartmentShortName('  ')).toBe('DEPT');
  });
});

describe('getDepartmentTagTone', () => {
  it('is deterministic for the same department', () => {
    expect(getDepartmentTagTone('General Medicine')).toBe(
      getDepartmentTagTone('general medicine ')
    );
  });

  it('returns a Tailwind background tone', () => {
    expect(getDepartmentTagTone('Radiology')).toMatch(/^bg-/);
  });
});
