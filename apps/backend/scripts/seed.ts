/**
 * Database seed for the Drizzle-owned tables.
 *
 * Run with `npm run db:seed` from apps/backend.
 *
 * Idempotent: every insert is guarded by a lookup on the natural key, so the
 * script can be re-run against an existing database without duplicating rows.
 *
 * The five MikroORM-managed tables are deliberately untouched. In particular,
 * no `audit_logs` row is written: CERT-In audit records describe user actions,
 * and a seed has no user.
 */
import { config as loadEnv } from 'dotenv';
loadEnv();

import * as bcrypt from 'bcrypt';
import { and, eq } from 'drizzle-orm';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import {
  BloodComponentType,
  BloodGroup,
  NoticeCategory,
  NoticePriority,
} from '@dh-araria/shared';

import { newId } from '../src/common/drizzle/id';
import * as schema from '../src/common/drizzle/schema';
import { resolveDatabaseConnection, tlsOptions } from '../src/config/database-url';

async function ensureUser(
  db: NodePgDatabase<typeof schema>,
  data: {
    email: string;
    password: string;
    name: string;
    phone: string;
    role: 'ADMIN' | 'STAFF' | 'PATIENT' | 'DOCTOR';
    abhaId?: string;
  }
) {
  const [existing] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, data.email))
    .limit(1);
  if (existing) return existing;

  const [created] = await db
    .insert(schema.users)
    .values({ id: newId(), isActive: true, ...data })
    .returning();
  return created;
}

async function main() {
  const connection = resolveDatabaseConnection(process.env);
  const pool = new Pool({
    host: connection.host,
    port: connection.port,
    user: connection.user,
    password: connection.password,
    database: connection.database,
    ssl: tlsOptions(connection.ssl),
  });
  const db = drizzle(pool, { schema });

  console.log('Seeding database...');

  const admin = await ensureUser(db, {
    email: 'admin@dhararia.gov.in',
    password: await bcrypt.hash('Admin@123', 12),
    name: 'System Administrator',
    phone: '+91-6453-222123',
    role: 'ADMIN',
  });
  console.log(`  admin user: ${admin.email}`);

  const staffPassword = await bcrypt.hash('Staff@123', 12);
  await ensureUser(db, {
    email: 'staff@dhararia.gov.in',
    password: staffPassword,
    name: 'Hospital Staff',
    phone: '+91-6453-222124',
    role: 'STAFF',
  });
  console.log('  staff user: staff@dhararia.gov.in');

  await ensureUser(db, {
    email: 'demo@dhararia.gov.in',
    password: await bcrypt.hash('Demo@123', 12),
    name: 'Demo Patient',
    phone: '+91-9876543210',
    role: 'PATIENT',
    abhaId: '12-3456-7890-1234',
  });
  console.log('  patient user: demo@dhararia.gov.in');

  const departmentsData = [
    ['General Medicine', 'Comprehensive medical care for adults with chronic and acute conditions', 'stethoscope'],
    ['Pediatrics', 'Child healthcare, immunization, growth monitoring, and neonatal care', 'baby'],
    ['Obstetrics & Gynecology', "Women's health, maternity care, high-risk pregnancies, and gynecological surgeries", 'heart'],
    ['Orthopedics', 'Bone, joint, and muscle disorders including joint replacement and trauma', 'bone'],
    ['General Surgery', 'Surgical procedures including laparoscopic, gastrointestinal, and breast surgery', 'scalpel'],
    ['Ophthalmology', 'Eye care, cataract surgery, glaucoma treatment, and vision correction', 'eye'],
    ['ENT', 'Ear, nose, and throat disorders including endoscopic sinus surgery', 'ear'],
    ['Dermatology', 'Skin, hair, and nail conditions with laser and cosmetic procedures', 'sparkles'],
    ['Psychiatry', 'Mental health, de-addiction, counseling, and behavioral therapy', 'brain'],
    ['Radiology', 'X-ray, ultrasound, CT scan, MRI, and interventional radiology', 'scan'],
    ['Pathology', 'Clinical pathology, biochemistry, microbiology, and blood bank', 'microscope'],
    ['Anesthesiology', 'Anesthesia, pain management, and critical care support', 'droplet'],
    ['Emergency Medicine', '24/7 emergency and trauma care with resuscitation facilities', 'ambulance'],
    ['Dental Surgery', 'Oral health, dental implants, orthodontics, and maxillofacial surgery', 'tooth'],
    ['Physiotherapy', 'Rehabilitation, electrotherapy, exercise therapy, and sports injury', 'activity'],
  ] as const;

  const departmentIds = new Map<string, string>();
  for (const [name, description, icon] of departmentsData) {
    const [existing] = await db
      .select({ id: schema.departments.id })
      .from(schema.departments)
      .where(eq(schema.departments.name, name))
      .limit(1);

    if (existing) {
      departmentIds.set(name, existing.id);
      continue;
    }

    const [created] = await db
      .insert(schema.departments)
      .values({ id: newId(), name, description, icon })
      .returning({ id: schema.departments.id });
    departmentIds.set(name, created.id);
  }
  console.log(`  departments: ${departmentIds.size}`);

  const doctorsData = [
    {
      name: 'Dr. Rajesh Kumar',
      email: 'rajesh.kumar@dhararia.gov.in',
      specialization: 'Cardiology',
      qualification: 'MD, DM (Cardiology), FACC',
      experience: 15,
      hprId: 'HPR-12345678',
      department: 'General Medicine',
      consultationFee: 500,
      languages: ['English', 'Hindi', 'Maithili'],
      bio: 'Senior Cardiologist with 15+ years experience in interventional cardiology.',
    },
    {
      name: 'Dr. Priya Sharma',
      email: 'priya.sharma@dhararia.gov.in',
      specialization: 'Gynecology & Obstetrics',
      qualification: 'MS (OBG), DNB, MRCOG',
      experience: 12,
      hprId: 'HPR-23456789',
      department: 'Obstetrics & Gynecology',
      consultationFee: 400,
      languages: ['English', 'Hindi', 'Bengali'],
      bio: 'Expert in high-risk pregnancies and minimally invasive gynecological surgeries.',
    },
    {
      name: 'Dr. Amit Singh',
      email: 'amit.singh@dhararia.gov.in',
      specialization: 'Orthopedics',
      qualification: 'MS (Ortho), MCh (Joint Replacement)',
      experience: 18,
      hprId: 'HPR-34567890',
      department: 'Orthopedics',
      consultationFee: 600,
      languages: ['English', 'Hindi', 'Punjabi'],
      bio: 'Specialist in joint replacement and complex trauma surgeries.',
    },
    {
      name: 'Dr. Sunita Devi',
      email: 'sunita.devi@dhararia.gov.in',
      specialization: 'Pediatrics',
      qualification: 'MD (Pediatrics), DNB',
      experience: 10,
      hprId: 'HPR-45678901',
      department: 'Pediatrics',
      consultationFee: 350,
      languages: ['English', 'Hindi', 'Maithili'],
      bio: 'Child specialist with expertise in neonatal care and vaccination.',
    },
    {
      name: 'Dr. Vikash Patel',
      email: 'vikash.patel@dhararia.gov.in',
      specialization: 'General Surgery',
      qualification: 'MS (General Surgery), FIAGES',
      experience: 14,
      hprId: 'HPR-56789012',
      department: 'General Surgery',
      consultationFee: 450,
      languages: ['English', 'Hindi', 'Gujarati'],
      bio: 'Laparoscopic surgeon with extensive experience in gastrointestinal surgeries.',
    },
    {
      name: 'Dr. Anjali Verma',
      email: 'anjali.verma@dhararia.gov.in',
      specialization: 'Dermatology',
      qualification: 'MD (Dermatology), DVD',
      experience: 8,
      hprId: 'HPR-67890123',
      department: 'Dermatology',
      consultationFee: 400,
      languages: ['English', 'Hindi'],
      bio: 'Dermatologist specializing in cosmetic dermatology and laser treatments.',
    },
  ];

  const doctorPassword = await bcrypt.hash('Doctor@123', 12);

  for (const [index, data] of doctorsData.entries()) {
    const doctorUser = await ensureUser(db, {
      email: data.email,
      password: doctorPassword,
      name: data.name,
      phone: `+91-6453-2${String(20000 + index).slice(-5)}`,
      role: 'DOCTOR',
    });

    let [doctor] = await db
      .select({ id: schema.doctors.id })
      .from(schema.doctors)
      .where(eq(schema.doctors.hprId, data.hprId))
      .limit(1);

    if (!doctor) {
      const departmentId = departmentIds.get(data.department);
      if (!departmentId) throw new Error(`Missing department: ${data.department}`);

      [doctor] = await db
        .insert(schema.doctors)
        .values({
          id: newId(),
          userId: doctorUser.id,
          name: data.name,
          specialization: data.specialization,
          qualification: data.qualification,
          experience: data.experience,
          hprId: data.hprId,
          departmentId,
          consultationFee: data.consultationFee,
          languages: data.languages,
          bio: data.bio,
        })
        .returning({ id: schema.doctors.id });
    }

    // Mon-Sat, 10:00-13:00, matching the printed OPD schedule.
    await db
      .insert(schema.timeSlots)
      .values(
        [1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({
          id: newId(),
          doctorId: doctor.id,
          dayOfWeek,
          startTime: '10:00',
          endTime: '13:00',
          isAvailable: true,
          maxAppointments: 20,
          createdAt: new Date(),
          updatedAt: new Date(),
        }))
      )
      .onConflictDoNothing();
  }
  console.log(`  doctors: ${doctorsData.length}`);

  for (const bloodGroup of Object.values(BloodGroup)) {
    for (const componentType of Object.values(BloodComponentType)) {
      const unitsAvailable = Math.floor(Math.random() * 40) + 10;
      await db
        .insert(schema.bloodStock)
        .values({
          id: newId(),
          bloodGroup,
          componentType,
          unitsAvailable,
          createdAt: new Date(),
          lastUpdated: new Date(),
        })
        .onConflictDoUpdate({
          target: [schema.bloodStock.bloodGroup, schema.bloodStock.componentType],
          set: { unitsAvailable, lastUpdated: new Date() },
        });
    }
  }
  console.log('  blood stock: 40 rows');

  const noticesData = [
    {
      title: 'Free Health Check-up Camp - World Health Day',
      content:
        'District Hospital Araria is organizing a free comprehensive health check-up camp on World Health Day (April 7th). Services include general consultation, blood sugar testing, blood pressure monitoring, and specialist referrals.',
      category: NoticeCategory.PUBLIC_HEALTH,
      priority: NoticePriority.HIGH,
      publishedAt: new Date('2024-03-25'),
      expiresAt: new Date('2024-04-07'),
    },
    {
      title: 'Recruitment: Staff Nurses & Pharmacists',
      content:
        'Applications are invited for the post of Staff Nurses (15 posts) and Pharmacists (5 posts) on contractual basis. Last date to apply: April 15, 2024.',
      category: NoticeCategory.RECRUITMENT,
      priority: NoticePriority.HIGH,
      publishedAt: new Date('2024-03-20'),
      expiresAt: new Date('2024-04-15'),
    },
    {
      title: 'OPD Schedule Change - Effective April 1st',
      content:
        'OPD timings for General Medicine and Pediatrics revised. New timings: Morning 9:00 AM - 1:00 PM, Evening 4:00 PM - 6:00 PM. Emergency services remain 24/7.',
      category: NoticeCategory.SCHEDULE_CHANGE,
      priority: NoticePriority.MEDIUM,
      publishedAt: new Date('2024-03-28'),
      expiresAt: null,
    },
  ];

  for (const notice of noticesData) {
    const [existing] = await db
      .select({ id: schema.notices.id })
      .from(schema.notices)
      .where(and(eq(schema.notices.title, notice.title), eq(schema.notices.language, 'en')))
      .limit(1);
    if (existing) continue;

    await db.insert(schema.notices).values({
      id: newId(),
      ...notice,
      isPublished: true,
      language: 'en',
      authorId: admin.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
  console.log(`  notices: ${noticesData.length}`);

  await pool.end();
  console.log('Seed complete.');
}

main().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
