/**
 * The reference department list for DH Araria.
 *
 * This is structural data, not demo data: every hospital has departments, and
 * the public directory, the doctor form and the feedback form all key off this
 * table. Keeping the list in one place means `db:seed` (development) and
 * `bootstrap:departments` (production) cannot drift apart.
 *
 * The list is intentionally the standard Bihar district-hospital set. Correct
 * the names against the hospital's own signage before launch — the insert is
 * keyed on `name`, so renaming a row afterwards is a normal UPDATE, and adding a
 * department later is a single new entry here.
 */
export interface DepartmentSeed {
  readonly name: string;
  readonly description: string;
  readonly icon: string;
}

export const DEPARTMENTS: readonly DepartmentSeed[] = [
  {
    name: 'General Medicine',
    description: 'Comprehensive medical care for adults with chronic and acute conditions',
    icon: 'stethoscope',
  },
  {
    name: 'Pediatrics',
    description: 'Child healthcare, immunization, growth monitoring, and neonatal care',
    icon: 'baby',
  },
  {
    name: 'Obstetrics & Gynecology',
    description:
      "Women's health, maternity care, high-risk pregnancies, and gynecological surgeries",
    icon: 'heart',
  },
  {
    name: 'Orthopedics',
    description: 'Bone, joint, and muscle disorders including joint replacement and trauma',
    icon: 'bone',
  },
  {
    name: 'General Surgery',
    description:
      'Surgical procedures including laparoscopic, gastrointestinal, and breast surgery',
    icon: 'scalpel',
  },
  {
    name: 'Ophthalmology',
    description: 'Eye care, cataract surgery, glaucoma treatment, and vision correction',
    icon: 'eye',
  },
  {
    name: 'ENT',
    description: 'Ear, nose, and throat disorders including endoscopic sinus surgery',
    icon: 'ear',
  },
  {
    name: 'Dermatology',
    description: 'Skin, hair, and nail conditions with laser and cosmetic procedures',
    icon: 'sparkles',
  },
  {
    name: 'Psychiatry',
    description: 'Mental health, de-addiction, counseling, and behavioral therapy',
    icon: 'brain',
  },
  {
    name: 'Radiology',
    description: 'X-ray, ultrasound, CT scan, MRI, and interventional radiology',
    icon: 'scan',
  },
  {
    name: 'Pathology',
    description: 'Clinical pathology, biochemistry, microbiology, and blood bank',
    icon: 'microscope',
  },
  {
    name: 'Anesthesiology',
    description: 'Anesthesia, pain management, and critical care support',
    icon: 'droplet',
  },
  {
    name: 'Emergency Medicine',
    description: '24/7 emergency and trauma care with resuscitation facilities',
    icon: 'ambulance',
  },
  {
    name: 'Dental Surgery',
    description: 'Oral health, dental implants, orthodontics, and maxillofacial surgery',
    icon: 'tooth',
  },
  {
    name: 'Physiotherapy',
    description: 'Rehabilitation, electrotherapy, exercise therapy, and sports injury',
    icon: 'activity',
  },
];
