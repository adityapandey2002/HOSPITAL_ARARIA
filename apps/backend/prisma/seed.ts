// Database Seed Script for DH Araria Hospital Portal
// Run with: npm run db:seed

import { PrismaClient, UserRole, AppointmentStatus, AppointmentType, BloodGroup, BloodComponentType, NoticeCategory, NoticePriority, GrievanceCategory, GrievanceStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create admin user
  const adminPassword = await bcrypt.hash('Admin@123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@dhararia.gov.in' },
    update: {},
    create: {
      email: 'admin@dhararia.gov.in',
      password: adminPassword,
      name: 'System Administrator',
      phone: '+91-6453-222123',
      role: UserRole.ADMIN,
      isActive: true,
    },
  });
  console.log('✅ Admin user created:', admin.email);

  // Create staff user
  const staffPassword = await bcrypt.hash('Staff@123', 12);
  const staff = await prisma.user.upsert({
    where: { email: 'staff@dhararia.gov.in' },
    update: {},
    create: {
      email: 'staff@dhararia.gov.in',
      password: staffPassword,
      name: 'Hospital Staff',
      phone: '+91-6453-222124',
      role: UserRole.STAFF,
      isActive: true,
    },
  });
  console.log('✅ Staff user created:', staff.email);

  // Create demo patient user
  const patientPassword = await bcrypt.hash('Demo@123', 12);
  const patient = await prisma.user.upsert({
    where: { email: 'demo@dhararia.gov.in' },
    update: {},
    create: {
      email: 'demo@dhararia.gov.in',
      password: patientPassword,
      name: 'Demo Patient',
      phone: '+91-9876543210',
      role: UserRole.PATIENT,
      isActive: true,
      abhaId: '12-3456-7890-1234',
    },
  });
  console.log('✅ Demo patient created:', patient.email);

  // Create departments
  const departmentsData = [
    { name: 'General Medicine', description: 'Comprehensive medical care for adults with chronic and acute conditions', icon: 'stethoscope', displayOrder: 1 },
    { name: 'Pediatrics', description: 'Child healthcare, immunization, growth monitoring, and neonatal care', icon: 'baby', displayOrder: 2 },
    { name: 'Obstetrics & Gynecology', description: 'Women\'s health, maternity care, high-risk pregnancies, and gynecological surgeries', icon: 'heart', displayOrder: 3 },
    { name: 'Orthopedics', description: 'Bone, joint, and muscle disorders including joint replacement and trauma', icon: 'bone', displayOrder: 4 },
    { name: 'General Surgery', description: 'Surgical procedures including laparoscopic, gastrointestinal, and breast surgery', icon: 'scalpel', displayOrder: 5 },
    { name: 'Ophthalmology', description: 'Eye care, cataract surgery, glaucoma treatment, and vision correction', icon: 'eye', displayOrder: 6 },
    { name: 'ENT', description: 'Ear, nose, and throat disorders including endoscopic sinus surgery', icon: 'ear', displayOrder: 7 },
    { name: 'Dermatology', description: 'Skin, hair, and nail conditions with laser and cosmetic procedures', icon: 'sparkles', displayOrder: 8 },
    { name: 'Psychiatry', description: 'Mental health, de-addiction, counseling, and behavioral therapy', icon: 'brain', displayOrder: 9 },
    { name: 'Radiology', description: 'X-ray, ultrasound, CT scan, MRI, and interventional radiology', icon: 'scan', displayOrder: 10 },
    { name: 'Pathology', description: 'Clinical pathology, biochemistry, microbiology, and blood bank', icon: 'microscope', displayOrder: 11 },
    { name: 'Anesthesiology', description: 'Anesthesia, pain management, and critical care support', icon: 'droplet', displayOrder: 12 },
    { name: 'Emergency Medicine', description: '24/7 emergency and trauma care with resuscitation facilities', icon: 'ambulance', displayOrder: 13 },
    { name: 'Dental Surgery', description: 'Oral health, dental implants, orthodontics, and maxillofacial surgery', icon: 'tooth', displayOrder: 14 },
    { name: 'Physiotherapy', description: 'Rehabilitation, electrotherapy, exercise therapy, and sports injury', icon: 'activity', displayOrder: 15 },
  ];

  const departments = [];
  for (const deptData of departmentsData) {
    const dept = await prisma.department.upsert({
      where: { name: deptData.name },
      update: {},
      create: deptData,
    });
    departments.push(dept);
    console.log(`✅ Department created: ${dept.name}`);
  }

  // Create doctors
  const doctorsData = [
    {
      userId: admin.id,
      name: 'Dr. Rajesh Kumar',
      specialization: 'Cardiology',
      qualification: 'MD, DM (Cardiology), FACC',
      experience: 15,
      hprId: 'HPR-12345678',
      departmentId: departments.find(d => d.name === 'General Medicine')!.id,
      consultationFee: 500,
      languages: ['English', 'Hindi', 'Maithili'],
      bio: 'Senior Cardiologist with 15+ years experience in interventional cardiology.',
    },
    {
      userId: admin.id,
      name: 'Dr. Priya Sharma',
      specialization: 'Gynecology & Obstetrics',
      qualification: 'MS (OBG), DNB, MRCOG',
      experience: 12,
      hprId: 'HPR-23456789',
      departmentId: departments.find(d => d.name === 'Obstetrics & Gynecology')!.id,
      consultationFee: 400,
      languages: ['English', 'Hindi', 'Bengali'],
      bio: 'Expert in high-risk pregnancies and minimally invasive gynecological surgeries.',
    },
    {
      userId: admin.id,
      name: 'Dr. Amit Singh',
      specialization: 'Orthopedics',
      qualification: 'MS (Ortho), MCh (Joint Replacement)',
      experience: 18,
      hprId: 'HPR-34567890',
      departmentId: departments.find(d => d.name === 'Orthopedics')!.id,
      consultationFee: 600,
      languages: ['English', 'Hindi', 'Punjabi'],
      bio: 'Specialist in joint replacement and complex trauma surgeries.',
    },
    {
      userId: admin.id,
      name: 'Dr. Sunita Devi',
      specialization: 'Pediatrics',
      qualification: 'MD (Pediatrics), DNB',
      experience: 10,
      hprId: 'HPR-45678901',
      departmentId: departments.find(d => d.name === 'Pediatrics')!.id,
      consultationFee: 350,
      languages: ['English', 'Hindi', 'Maithili'],
      bio: 'Child specialist with expertise in neonatal care and vaccination.',
    },
    {
      userId: admin.id,
      name: 'Dr. Vikash Patel',
      specialization: 'General Surgery',
      qualification: 'MS (General Surgery), FIAGES',
      experience: 14,
      hprId: 'HPR-56789012',
      departmentId: departments.find(d => d.name === 'General Surgery')!.id,
      consultationFee: 450,
      languages: ['English', 'Hindi', 'Gujarati'],
      bio: 'Laparoscopic surgeon with extensive experience in gastrointestinal surgeries.',
    },
    {
      userId: admin.id,
      name: 'Dr. Anjali Verma',
      specialization: 'Dermatology',
      qualification: 'MD (Dermatology), DVD',
      experience: 8,
      hprId: 'HPR-67890123',
      departmentId: departments.find(d => d.name === 'Dermatology')!.id,
      consultationFee: 400,
      languages: ['English', 'Hindi'],
      bio: 'Dermatologist specializing in cosmetic dermatology and laser treatments.',
    },
  ];

  for (const docData of doctorsData) {
    const doctor = await prisma.doctor.upsert({
      where: { hprId: docData.hprId! },
      update: {},
      create: docData,
    });
    console.log(`✅ Doctor created: ${doctor.name}`);

    // Create time slots for each doctor
    const days = [1, 2, 3, 4, 5, 6]; // Mon-Sat
    for (const day of days) {
      await prisma.timeSlot.upsert({
        where: {
          doctorId_dayOfWeek_startTime: {
            doctorId: doctor.id,
            dayOfWeek: day,
            startTime: '10:00',
          },
        },
        update: {},
        create: {
          doctorId: doctor.id,
          dayOfWeek: day,
          startTime: '10:00',
          endTime: '13:00',
          isAvailable: true,
          maxAppointments: 20,
        },
      });
    }
    console.log(`   ✅ Time slots created for ${doctor.name}`);
  }

  // Create blood stock
  const bloodGroups = Object.values(BloodGroup);
  const componentTypes = Object.values(BloodComponentType);

  for (const group of bloodGroups) {
    for (const component of componentTypes) {
      const units = Math.floor(Math.random() * 40) + 10;
      await prisma.bloodStock.upsert({
        where: {
          bloodGroup_componentType: { bloodGroup: group, componentType: component },
        },
        update: { unitsAvailable: units },
        create: {
          bloodGroup: group,
          componentType: component,
          unitsAvailable: units,
        },
      });
    }
  }
  console.log('✅ Blood stock initialized');

  // Create sample notices
  const noticesData = [
    {
      title: 'Free Health Check-up Camp - World Health Day',
      content: 'District Hospital Araria is organizing a free comprehensive health check-up camp on World Health Day (April 7th). Services include general consultation, blood sugar testing, blood pressure monitoring, and specialist referrals.',
      category: NoticeCategory.PUBLIC_HEALTH,
      priority: NoticePriority.HIGH,
      publishedAt: new Date('2024-03-25'),
      expiresAt: new Date('2024-04-07'),
      isPublished: true,
      authorId: admin.id,
      language: 'en',
    },
    {
      title: 'Recruitment: Staff Nurses & Pharmacists',
      content: 'Applications are invited for the post of Staff Nurses (15 posts) and Pharmacists (5 posts) on contractual basis. Last date to apply: April 15, 2024.',
      category: NoticeCategory.RECRUITMENT,
      priority: NoticePriority.HIGH,
      publishedAt: new Date('2024-03-20'),
      expiresAt: new Date('2024-04-15'),
      isPublished: true,
      authorId: admin.id,
      language: 'en',
    },
    {
      title: 'OPD Schedule Change - Effective April 1st',
      content: 'OPD timings for General Medicine and Pediatrics revised. New timings: Morning 9:00 AM - 1:00 PM, Evening 4:00 PM - 6:00 PM. Emergency services remain 24/7.',
      category: NoticeCategory.SCHEDULE_CHANGE,
      priority: NoticePriority.MEDIUM,
      publishedAt: new Date('2024-03-28'),
      isPublished: true,
      authorId: admin.id,
      language: 'en',
    },
  ];

  for (const noticeData of noticesData) {
    await prisma.notice.create({
      data: noticeData,
    });
  }
  console.log('✅ Sample notices created');

  // Create audit log entry
  await prisma.auditLog.create({
    data: {
      userId: admin.id,
      action: 'SEED_DATABASE',
      resource: 'Database',
      details: { message: 'Initial database seed completed' },
      ipAddress: '127.0.0.1',
    },
  });

  console.log('🎉 Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });