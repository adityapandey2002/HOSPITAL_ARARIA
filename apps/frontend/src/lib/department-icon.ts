import {
  Activity,
  Ambulance,
  Baby,
  Bone,
  Brain,
  Droplet,
  Ear,
  Eye,
  Heart,
  Microscope,
  Scan,
  Scissors,
  SmilePlus,
  Sparkles,
  Stethoscope,
  type LucideIcon,
} from 'lucide-react';

export type DepartmentColor = 'primary' | 'secondary' | 'danger' | 'warning' | 'success';

/** Rotating tile colours keep a long department grid from looking monotonous. */
export const DEPARTMENT_PALETTE: DepartmentColor[] = [
  'primary',
  'secondary',
  'danger',
  'warning',
  'success',
];

export const DEPARTMENT_TILE_STYLES: Record<DepartmentColor, string> = {
  primary: 'bg-primary-100 text-primary-700',
  secondary: 'bg-secondary-100 text-secondary-700',
  danger: 'bg-danger-100 text-danger-700',
  warning: 'bg-warning-100 text-warning-700',
  success: 'bg-success-100 text-success-700',
};

/** Seeded rows may not carry an icon, so fall back to the department name. */
export function departmentIcon(value: string): LucideIcon {
  const key = value.toLowerCase();
  if (key.includes('pediat')) return Baby;
  if (key.includes('gyne') || key.includes('obstet')) return Heart;
  if (key.includes('ortho')) return Bone;
  if (key.includes('surg')) return Scissors;
  if (key.includes('ophthal') || key.includes('eye')) return Eye;
  // Check dental before ENT: "dentistry" contains the substring "ent".
  if (key.includes('dent')) return SmilePlus;
  if (key.includes('ent') || key.includes('ear')) return Ear;
  if (key.includes('derma')) return Sparkles;
  if (key.includes('psych')) return Brain;
  if (key.includes('radio')) return Scan;
  if (key.includes('path') || key.includes('lab')) return Microscope;
  if (key.includes('blood')) return Droplet;
  if (key.includes('emerg')) return Ambulance;
  if (key.includes('physio') || key.includes('rehab')) return Activity;
  return Stethoscope;
}
