import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clear existing data (be careful in production!)
  await prisma.pLCActivity.deleteMany();
  await prisma.developmentPlan.deleteMany();
  await prisma.reflectiveJournal.deleteMany();
  await prisma.competencyAssessment.deleteMany();
  await prisma.mentoringVisit.deleteMany();
  await prisma.user.deleteMany();
  await prisma.teacher.deleteMany();
  await prisma.school.deleteMany();

  console.log('✅ Cleared existing data');

  // Seed Schools
  const schools = await Promise.all([
    prisma.school.create({
      data: {
        schoolName: 'โรงเรียนบ้านพญาไพร',
        province: 'เชียงราย',
        region: 'NORTH',
        schoolSize: 'SMALL',
        areaType: 'REMOTE',
        studentTotal: 120,
        directorName: 'นายสุขสันต์ สอนนวล',
        qualitySchoolFlag: true,
        communityContext: 'โรงเรียนในพื้นที่ห่างไกล บริเวณภูเขา ชุมชนเกษตรกรรม',
      },
    }),
    prisma.school.create({
      data: {
        schoolName: 'โรงเรียนบ้านห้วยไร่สามัคคี',
        province: 'เชียงราย',
        region: 'NORTH',
        schoolSize: 'SMALL',
        areaType: 'VERY_REMOTE',
        studentTotal: 85,
        directorName: 'นางสาวจิราพร ใจดี',
        qualitySchoolFlag: true,
        communityContext: 'โรงเรียนบนดอยสูง ชุมชนชาวเขา',
      },
    }),
    prisma.school.create({
      data: {
        schoolName: 'โรงเรียนวัดศรีบุญเรือง',
        province: 'กาฬสินธุ์',
        region: 'NORTHEAST',
        schoolSize: 'MEDIUM',
        areaType: 'REMOTE',
        studentTotal: 250,
        directorName: 'นายประสิทธิ์ วงศ์สุข',
        qualitySchoolFlag: false,
        communityContext: 'โรงเรียนในชนบทอีสาน เกษตรกรรมนาข้าว',
      },
    }),
    prisma.school.create({
      data: {
        schoolName: 'โรงเรียนบ้านทุ่งใหญ่',
        province: 'สุรินทร์',
        region: 'NORTHEAST',
        schoolSize: 'SMALL',
        areaType: 'REMOTE',
        studentTotal: 145,
        directorName: 'นางวิไล จันทร์สว่าง',
        qualitySchoolFlag: true,
        communityContext: 'ชุมชนเกษตรกรรม มีวัดเป็นศูนย์กลาง',
      },
    }),
    prisma.school.create({
      data: {
        schoolName: 'โรงเรียนบ้านคลองใหม่',
        province: 'สุราษฎร์ธานี',
        region: 'SOUTH',
        schoolSize: 'SMALL',
        areaType: 'REMOTE',
        studentTotal: 95,
        directorName: 'นายสมชาย ทองดี',
        qualitySchoolFlag: false,
        communityContext: 'ชุมชนริมคลอง ประมงและสวนผลไม้',
      },
    }),
  ]);

  console.log(`✅ Created ${schools.length} schools`);

  // Seed Teachers (ครูรัก(ษ์)ถิ่น รุ่นที่ 1)
  const teachers = await Promise.all([
    prisma.teacher.create({
      data: {
        citizenId: '1234567890123',
        fullName: 'นางสาวพิมพ์ชนก ใจดี',
        gender: 'FEMALE',
        birthDate: new Date('1998-05-15'),
        cohort: 1,
        appointmentDate: new Date('2024-05-01'),
        position: 'ครูผู้ช่วย',
        major: 'ภาษาไทย',
        email: 'pimchanok@example.com',
        phone: '081-234-5678',
        schoolId: schools[0].id,
        status: 'ACTIVE',
      },
    }),
    prisma.teacher.create({
      data: {
        citizenId: '2345678901234',
        fullName: 'นายธนพล ศรีสุข',
        gender: 'MALE',
        birthDate: new Date('1997-08-20'),
        cohort: 1,
        appointmentDate: new Date('2024-05-01'),
        position: 'ครูผู้ช่วย',
        major: 'คณิตศาสตร์',
        email: 'thanaphon@example.com',
        phone: '082-345-6789',
        schoolId: schools[0].id,
        status: 'ACTIVE',
      },
    }),
    prisma.teacher.create({
      data: {
        citizenId: '3456789012345',
        fullName: 'นางสาววิไลวรรณ นาคทอง',
        gender: 'FEMALE',
        birthDate: new Date('1999-03-10'),
        cohort: 1,
        appointmentDate: new Date('2024-05-01'),
        position: 'ครูผู้ช่วย',
        major: 'ภาษาอังกฤษ',
        email: 'wilaiwan@example.com',
        phone: '083-456-7890',
        schoolId: schools[1].id,
        status: 'ACTIVE',
      },
    }),
    prisma.teacher.create({
      data: {
        citizenId: '4567890123456',
        fullName: 'นายสมศักดิ์ จันทร์งาม',
        gender: 'MALE',
        birthDate: new Date('1998-11-25'),
        cohort: 1,
        appointmentDate: new Date('2024-05-01'),
        position: 'ครูผู้ช่วย',
        major: 'วิทยาศาสตร์',
        email: 'somsak@example.com',
        phone: '084-567-8901',
        schoolId: schools[2].id,
        status: 'ACTIVE',
      },
    }),
    prisma.teacher.create({
      data: {
        citizenId: '5678901234567',
        fullName: 'นางสาวอรุณี สวัสดิ์',
        gender: 'FEMALE',
        birthDate: new Date('1999-07-05'),
        cohort: 1,
        appointmentDate: new Date('2024-05-01'),
        position: 'ครูผู้ช่วย',
        major: 'สังคมศึกษา',
        email: 'arunee@example.com',
        phone: '085-678-9012',
        schoolId: schools[3].id,
        status: 'ACTIVE',
      },
    }),
    prisma.teacher.create({
      data: {
        citizenId: '6789012345678',
        fullName: 'นายประเสริฐ มีชัย',
        gender: 'MALE',
        birthDate: new Date('1998-02-14'),
        cohort: 1,
        appointmentDate: new Date('2024-05-01'),
        position: 'ครูผู้ช่วย',
        major: 'พลศึกษา',
        email: 'prasert@example.com',
        phone: '086-789-0123',
        schoolId: schools[4].id,
        status: 'ACTIVE',
      },
    }),
  ]);

  console.log(`✅ Created ${teachers.length} teachers`);

  // Seed Users (with hashed passwords)
  const hashedPassword = await bcrypt.hash('password123', 10);

  const users = await Promise.all([
    // Admin user
    prisma.user.create({
      data: {
        email: 'admin@teachermon.com',
        password: hashedPassword,
        role: 'ADMIN',
        fullName: 'ผู้ดูแลระบบ',
        isActive: true,
      },
    }),
    // Project Manager
    prisma.user.create({
      data: {
        email: 'manager@teachermon.com',
        password: hashedPassword,
        role: 'PROJECT_MANAGER',
        fullName: 'ผู้จัดการโครงการ',
        isActive: true,
      },
    }),
    // Teacher users
    ...teachers.map((teacher) =>
      prisma.user.create({
        data: {
          email: teacher.email!,
          password: hashedPassword,
          role: 'TEACHER',
          teacherId: teacher.id,
          isActive: true,
        },
      })
    ),
  ]);

  console.log(`✅ Created ${users.length} users`);

  // Seed Mentoring Visits
  const visits = await Promise.all([
    prisma.mentoringVisit.create({
      data: {
        teacherId: teachers[0].id,
        visitDate: new Date('2024-06-15'),
        visitType: 'LESSON_STUDY',
        observer: 'ดร.สมหมาย พัฒนาการศึกษา',
        focusArea: 'CLASSROOM',
        strengths: 'มีการเตรียมแผนการสอนดี มีสื่อการสอนน่าสนใจ',
        challenges: 'การจัดการชั้นเรียนยังต้องพัฒนา',
        suggestions: 'ควรศึกษาเทคนิคการจัดการชั้นเรียนเพิ่มเติม',
        followUpRequired: true,
      },
    }),
    prisma.mentoringVisit.create({
      data: {
        teacherId: teachers[1].id,
        visitDate: new Date('2024-06-20'),
        visitType: 'COACHING',
        observer: 'อาจารย์วิภา สุขใจ',
        focusArea: 'PEDAGOGY',
        strengths: 'เข้าใจเนื้อหาดี สามารถอธิบายได้ชัดเจน',
        challenges: 'นักเรียนมีส่วนร่วมน้อย',
        suggestions: 'ใช้กิจกรรมกลุ่มเพื่อเพิ่มการมีส่วนร่วม',
        followUpRequired: false,
      },
    }),
  ]);

  console.log(`✅ Created ${visits.length} mentoring visits`);

  // Seed Competency Assessments
  const assessments = await Promise.all([
    prisma.competencyAssessment.create({
      data: {
        teacherId: teachers[0].id,
        assessmentPeriod: 'BEFORE',
        pedagogyScore: 3,
        classroomScore: 2,
        communityScore: 3,
        professionalismScore: 4,
        overallLevel: 'FAIR',
        assessor: 'คณะกรรมการประเมิน',
        notes: 'มีพื้นฐานดี แต่ต้องพัฒนาทักษะการสอนเพิ่มเติม',
      },
    }),
    prisma.competencyAssessment.create({
      data: {
        teacherId: teachers[1].id,
        assessmentPeriod: 'BEFORE',
        pedagogyScore: 4,
        classroomScore: 3,
        communityScore: 3,
        professionalismScore: 4,
        overallLevel: 'GOOD',
        assessor: 'คณะกรรมการประเมิน',
      },
    }),
  ]);

  console.log(`✅ Created ${assessments.length} competency assessments`);

  // Seed Reflective Journals
  const journals = await Promise.all([
    prisma.reflectiveJournal.create({
      data: {
        teacherId: teachers[0].id,
        month: '2024-06',
        reflectionText: 'เดือนแรกของการเป็นครู รู้สึกตื่นเต้นและกังวลไปพร้อมๆ กัน ได้เรียนรู้มากมายจากพี่เลี้ยงและเพื่อนครู',
        successStory: 'นักเรียนเริ่มเข้าใจและชอบวิชาภาษาไทยมากขึ้น',
        difficulty: 'การจัดการชั้นเรียนยังไม่คล่อง',
        supportRequest: 'ต้องการคำแนะนำเกี่ยวกับการจัดการชั้นเรียน',
      },
    }),
    prisma.reflectiveJournal.create({
      data: {
        teacherId: teachers[0].id,
        month: '2024-07',
        reflectionText: 'เดือนนี้รู้สึกว่าเริ่มปรับตัวได้ดีขึ้น ลองใช้เทคนิคต่างๆ ที่ได้เรียนรู้',
        successStory: 'ใช้เกมการสอนได้ผลดี นักเรียนสนุกและเรียนรู้ไปด้วย',
        difficulty: 'บางครั้งนักเรียนยังคุยกันระหว่างสอน',
        supportRequest: 'อยากมีตัวอย่างการจัดกิจกรรมเพิ่มเติม',
      },
    }),
  ]);

  console.log(`✅ Created ${journals.length} reflective journals`);

  // Seed PLC Activities
  const plcActivities = await Promise.all([
    prisma.pLCActivity.create({
      data: {
        teacherId: teachers[0].id,
        plcDate: new Date('2024-07-10'),
        plcLevel: 'PROVINCIAL',
        topic: 'การจัดการเรียนรู้แบบ Active Learning',
        role: 'PARTICIPANT',
        takeaway: 'ได้เทคนิคใหม่ๆ ในการจัดกิจกรรมให้นักเรียนมีส่วนร่วม',
      },
    }),
    prisma.pLCActivity.create({
      data: {
        teacherId: teachers[1].id,
        plcDate: new Date('2024-07-10'),
        plcLevel: 'PROVINCIAL',
        topic: 'การจัดการเรียนรู้แบบ Active Learning',
        role: 'PARTICIPANT',
        takeaway: 'แลกเปลี่ยนประสบการณ์กับครูคณิตศาสตร์ท่านอื่นๆ',
      },
    }),
  ]);

  console.log(`✅ Created ${plcActivities.length} PLC activities`);

  // Seed Development Plans
  const plans = await Promise.all([
    prisma.developmentPlan.create({
      data: {
        teacherId: teachers[0].id,
        focusCompetency: 'การจัดการชั้นเรียน',
        actionPlan: '1. สังเกตการสอนของครูพี่เลี้ยง\n2. เข้าอบรมเทคนิคการจัดการชั้นเรียน\n3. ลองปฏิบัติและขอคำแนะนำ',
        supportType: 'COACHING',
        startDate: new Date('2024-06-01'),
        endDate: new Date('2024-08-31'),
        progressStatus: 'IN_PROGRESS',
        progressNotes: 'ได้สังเกตการสอนครูพี่เลี้ยงแล้ว 2 ครั้ง กำลังรอเข้าอบรม',
      },
    }),
  ]);

  console.log(`✅ Created ${plans.length} development plans`);

  // Seed Policy Insights
  await prisma.policyInsight.create({
    data: {
      period: 2024,
      keyIssue: 'ครูใหม่ในพื้นที่ห่างไกลต้องการการสนับสนุนด้านการจัดการชั้นเรียนมากที่สุด',
      systemicBarrier: 'ขาดครูพี่เลี้ยงที่มีเวลาเพียงพอ และระยะทางห่างไกลทำให้การเข้าถึงการอบรมทำได้ยาก',
      successfulPractice: 'การจัด PLC Online ช่วยให้ครูสามารถแลกเปลี่ยนประสบการณ์ได้แม้อยู่ห่างไกล',
      policyRecommendation: 'ควรจัดสรรงบประมาณสำหรับการพัฒนาระบบ coaching online และจัดอบรมในพื้นที่เพิ่มเติม',
    },
  });

  console.log('✅ Created policy insights');

  console.log('✅ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
