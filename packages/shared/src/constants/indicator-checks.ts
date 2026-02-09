/**
 * Evidence Rules & Checks สำหรับคำนวณ % ความสมบูรณ์
 * ตาม ว19/2568 - ตัวชี้วัดการเตรียมความพร้อมและพัฒนาอย่างเข้ม (ครูผู้ช่วย)
 *
 * แต่ละ check มี:
 * - id: รหัสเฉพาะ
 * - label: คำอธิบาย
 * - weight: น้ำหนัก (0-100) รวมทุก check ต่อ indicator = 100
 * - evidenceType: ประเภทหลักฐานที่ยอมรับ
 * - autoDetectable: ระบบตรวจจับอัตโนมัติได้หรือไม่
 */

// =============================================
// Types
// =============================================

export type EvidenceType =
  | 'document'      // เอกสาร (pdf, doc, jpg)
  | 'video'         // วิดีโอ session
  | 'audio'         // เสียง session
  | 'transcript'    // ข้อความถอดเสียง
  | 'image'         // ภาพถ่าย
  | 'form'          // แบบฟอร์ม/บันทึก
  | 'certificate'   // เกียรติบัตร/วุฒิบัตร
  | 'link'          // ลิงก์ URL
  | 'text'          // ข้อความ/สรุป
  | 'checklist'     // พฤติกรรมบ่งชี้ (ประเมินโดยผู้ประเมิน)
  | 'any';          // ยอมรับทุกประเภท

export interface EvidenceCheck {
  id: string;
  label: string;
  weight: number;
  evidenceTypes: EvidenceType[];
  autoDetectable: boolean;
  heuristic?: string; // คำอธิบายวิธีตรวจจับอัตโนมัติ
}

export interface IndicatorChecks {
  id: string;           // รหัสตัวชี้วัด (เช่น PRO_1.1)
  name: string;
  checks: EvidenceCheck[];
}

export interface DomainChecks {
  id: string;           // PROFESSIONAL, SOCIAL, PERSONAL
  name: string;
  items: IndicatorChecks[];
}

export interface IndicatorCheckConfig {
  version: string;
  domains: DomainChecks[];
}

// =============================================
// ตัวอย่างสถานะ "ผ่าน"
// =============================================

export type CompletenessStatus = 'READY' | 'DRAFT' | 'INSUFFICIENT';

export function getCompletenessStatus(score: number): CompletenessStatus {
  if (score >= 80) return 'READY';
  if (score >= 50) return 'DRAFT';
  return 'INSUFFICIENT';
}

export const COMPLETENESS_STATUS_LABELS: Record<CompletenessStatus, string> = {
  READY: 'พร้อมนำเสนอ',
  DRAFT: 'ฉบับร่าง',
  INSUFFICIENT: 'ยังไม่เพียงพอ',
};

export const COMPLETENESS_STATUS_COLORS: Record<CompletenessStatus, string> = {
  READY: '#22c55e',     // green
  DRAFT: '#f59e0b',     // amber
  INSUFFICIENT: '#ef4444', // red
};

// =============================================
// Full Indicator Check Config (ว19/2568)
// =============================================

export const INDICATOR_CHECK_CONFIG: IndicatorCheckConfig = {
  version: 'w19_2568_v1',
  domains: [
    // ─────────────────────────────────────────────
    // 1. ด้านวิชาชีพ (PROFESSIONAL) - 10 รายการ
    // ─────────────────────────────────────────────
    {
      id: 'PROFESSIONAL',
      name: 'ด้านวิชาชีพ',
      items: [
        // --- ส่วน 1: การจัดการเรียนรู้ (7 ข้อ) ---
        {
          id: 'PRO_1.1',
          name: '1.1 การวิเคราะห์หลักสูตร',
          checks: [
            { id: 'CURR_ANALYSIS_DOC', label: 'มีเอกสารวิเคราะห์หลักสูตร/มาตรฐาน/ตัวชี้วัด', weight: 25, evidenceTypes: ['document'], autoDetectable: false },
            { id: 'COURSE_DESC', label: 'มีคำอธิบายรายวิชา', weight: 25, evidenceTypes: ['document'], autoDetectable: false },
            { id: 'UNIT_PLAN', label: 'มีหน่วยการเรียนรู้ครอบคลุมเนื้อหา', weight: 25, evidenceTypes: ['document'], autoDetectable: false },
            { id: 'EVIDENCE_LINKED_SESSION', label: 'มีหลักฐานเชื่อมกับ session การสอนอย่างน้อย 1 ครั้ง', weight: 25, evidenceTypes: ['video', 'audio', 'link'], autoDetectable: true, heuristic: 'ตรวจว่ามี session ที่ถูกแท็กตัวชี้วัดนี้' },
          ],
        },
        {
          id: 'PRO_1.2',
          name: '1.2 การออกแบบการจัดการเรียนรู้',
          checks: [
            { id: 'LEARNING_DESIGN_DOC', label: 'มีแผนการจัดการเรียนรู้ที่สอดคล้องกับรายวิชา', weight: 25, evidenceTypes: ['document'], autoDetectable: false },
            { id: 'CONTEXT_ALIGNMENT', label: 'หน่วยการเรียนรู้สอดคล้องกับผู้เรียนและบริบทสถานศึกษา', weight: 25, evidenceTypes: ['document', 'text'], autoDetectable: false },
            { id: 'STUDENT_ANALYSIS', label: 'มีผลวิเคราะห์ผู้เรียนเป็นรายบุคคล', weight: 25, evidenceTypes: ['document', 'form'], autoDetectable: false },
            { id: 'POST_TEACHING_NOTE', label: 'มีบันทึกหลังสอน', weight: 25, evidenceTypes: ['document', 'text', 'form'], autoDetectable: true, heuristic: 'ตรวจจาก journal/reflection ที่เชื่อมกับ session' },
          ],
        },
        {
          id: 'PRO_1.3',
          name: '1.3 การจัดกิจกรรมการเรียนรู้ (Active Learning)',
          checks: [
            { id: 'HAS_SESSION', label: 'มี session การสอนที่บันทึกเสียง/วิดีโออย่างน้อย 1 ครั้ง', weight: 25, evidenceTypes: ['video', 'audio'], autoDetectable: true, heuristic: 'ตรวจจาก AnalysisJob ที่สถานะ DONE' },
            { id: 'HAS_TRANSCRIPT', label: 'มี transcript พร้อม timecode', weight: 25, evidenceTypes: ['transcript'], autoDetectable: true, heuristic: 'ตรวจจาก hasTranscript ใน AnalysisJob' },
            { id: 'AL_SIGNALS', label: 'พบสัญญาณ Active Learning (คำถาม/มอบหมาย/ทำงานกลุ่ม)', weight: 25, evidenceTypes: ['transcript'], autoDetectable: true, heuristic: 'วิเคราะห์ transcript หาคำสำคัญ: ทำงานกลุ่ม, คำถามปลายเปิด, อภิปราย' },
            { id: 'REFLECTION_NOTE', label: 'มีสรุปสะท้อนผล/สิ่งที่ปรับปรุง', weight: 25, evidenceTypes: ['text', 'form'], autoDetectable: true, heuristic: 'ตรวจจาก reflective journal' },
          ],
        },
        {
          id: 'PRO_1.4',
          name: '1.4 การเลือกและใช้สื่อ เทคโนโลยี',
          checks: [
            { id: 'MEDIA_SELECTION', label: 'มีหลักฐานการเลือกและใช้สื่อ/เทคโนโลยีที่สอดคล้องกับกิจกรรม', weight: 30, evidenceTypes: ['document', 'image', 'link'], autoDetectable: false },
            { id: 'MEDIA_EXAMPLES', label: 'มีตัวอย่างสื่อที่ใช้จริง (ไฟล์/ภาพ/ลิงก์)', weight: 35, evidenceTypes: ['document', 'image', 'link', 'video'], autoDetectable: false },
            { id: 'STUDENT_THINKING_SKILLS', label: 'มีหลักฐานว่าสื่อช่วยให้ผู้เรียนเกิดทักษะการคิด', weight: 35, evidenceTypes: ['document', 'image', 'text'], autoDetectable: false },
          ],
        },
        {
          id: 'PRO_1.5',
          name: '1.5 การวัดและประเมินผล',
          checks: [
            { id: 'ASSESSMENT_TOOLS', label: 'มีเครื่องมือวัดผลที่หลากหลาย (ข้อสอบ/แบบประเมิน/rubric)', weight: 30, evidenceTypes: ['document'], autoDetectable: false },
            { id: 'STANDARD_ALIGNMENT', label: 'การวัดผลสอดคล้องกับมาตรฐานการเรียนรู้', weight: 30, evidenceTypes: ['document', 'text'], autoDetectable: false },
            { id: 'SCORE_RECORDS', label: 'มีร่องรอยการเก็บคะแนน/ผลการเรียน', weight: 20, evidenceTypes: ['document', 'form'], autoDetectable: false },
            { id: 'CONTINUOUS_IMPROVEMENT', label: 'มีหลักฐานการนำผลมาพัฒนาผู้เรียนอย่างต่อเนื่อง', weight: 20, evidenceTypes: ['document', 'text'], autoDetectable: false },
          ],
        },
        {
          id: 'PRO_1.6',
          name: '1.6 การจัดบรรยากาศ',
          checks: [
            { id: 'CLASSROOM_ATMOSPHERE', label: 'มีหลักฐานการจัดบรรยากาศส่งเสริมผู้เรียน', weight: 35, evidenceTypes: ['image', 'video'], autoDetectable: false },
            { id: 'THINKING_SKILLS_PROMOTE', label: 'ส่งเสริมกระบวนการคิด ทักษะชีวิต ทักษะการทำงาน', weight: 35, evidenceTypes: ['document', 'image', 'text'], autoDetectable: false },
            { id: 'IT_SKILLS_PROMOTE', label: 'ส่งเสริมทักษะด้านสารสนเทศ/เทคโนโลยี', weight: 30, evidenceTypes: ['image', 'document', 'link'], autoDetectable: false },
          ],
        },
        {
          id: 'PRO_1.7',
          name: '1.7 การใช้เทคโนโลยีดิจิทัล',
          checks: [
            { id: 'ONLINE_LEARNING', label: 'มีหลักฐานการจัดการเรียนรู้แบบออนไลน์/ใช้สื่อดิจิทัล', weight: 40, evidenceTypes: ['link', 'image', 'document'], autoDetectable: false },
            { id: 'DIGITAL_TOOLS_USED', label: 'มีตัวอย่างเครื่องมือดิจิทัลที่ใช้ (Google Classroom, แอพ, คลิป)', weight: 30, evidenceTypes: ['link', 'image'], autoDetectable: false },
            { id: 'STUDENT_DIGITAL_WORK', label: 'มีผลงานนักเรียนจากการใช้เทคโนโลยีดิจิทัล', weight: 30, evidenceTypes: ['document', 'image', 'link'], autoDetectable: false },
          ],
        },
        // --- ส่วน 2: การส่งเสริมสนับสนุน (3 ข้อ) ---
        {
          id: 'PRO_2.1',
          name: '2.1 การจัดทำข้อมูลสารสนเทศ',
          checks: [
            { id: 'STUDENT_INFO_SYSTEM', label: 'มีข้อมูลสารสนเทศของผู้เรียน (ปพ./DMC)', weight: 35, evidenceTypes: ['document', 'form', 'link'], autoDetectable: false },
            { id: 'COURSE_INFO_SYSTEM', label: 'มีข้อมูลสารสนเทศรายวิชา', weight: 30, evidenceTypes: ['document', 'form'], autoDetectable: false },
            { id: 'INFO_USAGE_EVIDENCE', label: 'มีหลักฐานการนำข้อมูลไปใช้ส่งเสริมการเรียนรู้', weight: 35, evidenceTypes: ['document', 'text'], autoDetectable: false },
          ],
        },
        {
          id: 'PRO_2.2',
          name: '2.2 ระบบดูแลช่วยเหลือผู้เรียน',
          checks: [
            { id: 'STUDENT_CARE_SYSTEM', label: 'มีหลักฐานดำเนินการตามระบบดูแลช่วยเหลือผู้เรียน', weight: 30, evidenceTypes: ['document', 'form'], autoDetectable: false },
            { id: 'INDIVIDUAL_DATA', label: 'ใช้ข้อมูลสารสนเทศผู้เรียนรายบุคคล', weight: 25, evidenceTypes: ['document', 'form'], autoDetectable: false },
            { id: 'HOME_VISIT', label: 'มีบันทึกการเยี่ยมบ้าน/ให้คำปรึกษา', weight: 25, evidenceTypes: ['document', 'form', 'image'], autoDetectable: false },
            { id: 'COLLABORATION', label: 'มีหลักฐานการประสานความร่วมมือกับผู้เกี่ยวข้อง', weight: 20, evidenceTypes: ['document', 'form', 'image'], autoDetectable: false },
          ],
        },
        {
          id: 'PRO_2.3',
          name: '2.3 กฎหมายและระเบียบปฏิบัติ',
          checks: [
            { id: 'FOUR_DEPT_KNOWLEDGE', label: 'มีความรู้ด้านงาน 4 ฝ่าย (วิชาการ, งบประมาณ, บุคคล, บริหาร)', weight: 25, evidenceTypes: ['document', 'certificate', 'text'], autoDetectable: false },
            { id: 'PROCUREMENT_KNOWLEDGE', label: 'เรียนรู้เรื่องจัดซื้อจัดจ้าง การเงิน พัสดุ สารบรรณ', weight: 25, evidenceTypes: ['document', 'certificate'], autoDetectable: false },
            { id: 'EDUCATION_LAW', label: 'มีความรู้ด้านนโยบายและกฎหมายการศึกษา', weight: 25, evidenceTypes: ['document', 'certificate', 'text'], autoDetectable: false },
            { id: 'WORK_ORDER', label: 'มีคำสั่งแต่งตั้ง/บันทึกการปฏิบัติงาน', weight: 25, evidenceTypes: ['document'], autoDetectable: false },
          ],
        },
      ],
    },

    // ─────────────────────────────────────────────
    // 2. ด้านสังคม (SOCIAL) - 2 รายการ
    // ─────────────────────────────────────────────
    {
      id: 'SOCIAL',
      name: 'ด้านสังคม',
      items: [
        {
          id: 'SOC_1',
          name: 'การเรียนรู้จากกัลยาณมิตร',
          checks: [
            { id: 'MENTOR_LEARNING', label: 'มีหลักฐานการเรียนรู้จากกัลยาณมิตร (Mentor/ครูพี่เลี้ยง)', weight: 30, evidenceTypes: ['document', 'form', 'image'], autoDetectable: true, heuristic: 'ตรวจจาก MentoringVisit records' },
            { id: 'OBSERVATION_REPORT', label: 'มีรายงาน/บันทึกจากการสังเกตการสอน', weight: 35, evidenceTypes: ['document', 'form'], autoDetectable: true, heuristic: 'ตรวจจาก MentoringVisit ที่มี observation notes' },
            { id: 'MENTOR_APPLY', label: 'มีหลักฐานการนำมาปรับใช้กับการสอนของตนเอง', weight: 35, evidenceTypes: ['text', 'document'], autoDetectable: true, heuristic: 'ตรวจจาก reflection journal ที่อ้างอิง mentoring' },
          ],
        },
        {
          id: 'SOC_2',
          name: 'การเรียนรู้เป็นเครือข่าย (PLC)',
          checks: [
            { id: 'PLC_EVIDENCE', label: 'มีหลักฐาน PLC (ไฟล์/รูป/บันทึก)', weight: 34, evidenceTypes: ['document', 'form', 'image'], autoDetectable: true, heuristic: 'ตรวจจาก PLCActivity records' },
            { id: 'APPLY_TO_CLASS', label: 'มีการนำผลไปปรับใช้ในชั้นเรียน (เชื่อมกับ session)', weight: 33, evidenceTypes: ['text', 'document', 'link'], autoDetectable: false },
            { id: 'RESULT_NOTE', label: 'มีบันทึกผล/บทเรียนหลังปรับใช้', weight: 33, evidenceTypes: ['text', 'document'], autoDetectable: true, heuristic: 'ตรวจจาก reflective journal ที่อ้างอิง PLC' },
          ],
        },
      ],
    },

    // ─────────────────────────────────────────────
    // 3. ด้านคุณลักษณะส่วนบุคคล (PERSONAL)
    // ─────────────────────────────────────────────
    {
      id: 'PERSONAL',
      name: 'ด้านคุณลักษณะส่วนบุคคล',
      items: [
        // --- ส่วน 1: วินัย คุณธรรม จริยธรรม (11 ข้อ) ---
        // วินัยและการประพฤติตน
        {
          id: 'PER_1.1',
          name: 'มีวินัยในตนเอง',
          checks: [
            { id: 'SELF_DISCIPLINE', label: 'ยอมรับและปฏิบัติตามกฎ กติกา มารยาท ขนบธรรมเนียม', weight: 50, evidenceTypes: ['checklist'], autoDetectable: false },
            { id: 'DISCIPLINE_EVIDENCE', label: 'มีหลักฐาน/ผู้ยืนยันพฤติกรรม', weight: 50, evidenceTypes: ['checklist', 'document'], autoDetectable: false },
          ],
        },
        {
          id: 'PER_1.2',
          name: 'ตรงต่อเวลา',
          checks: [
            { id: 'PUNCTUAL_BEHAVIOR', label: 'ตรงต่อเวลาในการปฏิบัติงาน', weight: 50, evidenceTypes: ['checklist'], autoDetectable: false },
            { id: 'PUNCTUAL_EVIDENCE', label: 'มีหลักฐาน (สมุดลงเวลา/ระบบสแกน)', weight: 50, evidenceTypes: ['checklist', 'document'], autoDetectable: false },
          ],
        },
        {
          id: 'PER_1.3',
          name: 'อุทิศเวลาให้แก่ทางราชการและผู้เรียน',
          checks: [
            { id: 'DEDICATE_TIME', label: 'อุทิศเวลาให้แก่ทางราชการและผู้เรียนอย่างต่อเนื่อง', weight: 50, evidenceTypes: ['checklist'], autoDetectable: false },
            { id: 'DEDICATE_EVIDENCE', label: 'มีหลักฐาน/บันทึกกิจกรรมนอกเวลา', weight: 50, evidenceTypes: ['checklist', 'document', 'image'], autoDetectable: false },
          ],
        },
        {
          id: 'PER_1.4',
          name: 'เอาใจใส่ช่วยเหลือผู้เรียน',
          checks: [
            { id: 'STUDENT_CARE', label: 'เอาใจใส่ช่วยเหลือผู้เรียน/ผู้รับบริการ เต็มความสามารถ สม่ำเสมอ และเท่าเทียม', weight: 50, evidenceTypes: ['checklist'], autoDetectable: false },
            { id: 'STUDENT_CARE_EVIDENCE', label: 'มีหลักฐาน/บันทึกการช่วยเหลือผู้เรียน', weight: 50, evidenceTypes: ['checklist', 'document', 'form'], autoDetectable: false },
          ],
        },
        {
          id: 'PER_1.5',
          name: 'รักษาความสามัคคี',
          checks: [
            { id: 'TEAMWORK', label: 'รักษาความสามัคคี มีน้ำใจเอื้อเฟื้อเผื่อแผ่ต่อเพื่อนร่วมงาน', weight: 50, evidenceTypes: ['checklist'], autoDetectable: false },
            { id: 'TEAMWORK_EVIDENCE', label: 'มีหลักฐาน (ภาพถ่าย/บันทึก/ใบรับรอง)', weight: 50, evidenceTypes: ['checklist', 'image', 'document'], autoDetectable: false },
          ],
        },
        // การเสียสละและแบบอย่าง
        {
          id: 'PER_1.6',
          name: 'ช่วยเหลือ/ร่วมมือแก่ส่วนรวม',
          checks: [
            { id: 'PUBLIC_SERVICE', label: 'ช่วยเหลือ/ร่วมมือแก่ส่วนรวมอย่างทุ่มเท เสียสละจนสำเร็จ', weight: 50, evidenceTypes: ['checklist'], autoDetectable: false },
            { id: 'PUBLIC_SERVICE_EVIDENCE', label: 'มีหลักฐาน/ภาพถ่าย/คำสั่ง', weight: 50, evidenceTypes: ['checklist', 'image', 'document'], autoDetectable: false },
          ],
        },
        {
          id: 'PER_1.7',
          name: 'อนุรักษ์วัฒนธรรมไทยและสิ่งแวดล้อม',
          checks: [
            { id: 'CULTURE_ACTIVITY_1', label: 'มีส่วนร่วมกิจกรรมอนุรักษ์วัฒนธรรมไทย/สิ่งแวดล้อม ครั้งที่ 1', weight: 50, evidenceTypes: ['image', 'document', 'certificate'], autoDetectable: false },
            { id: 'CULTURE_ACTIVITY_2', label: 'มีส่วนร่วมกิจกรรมอนุรักษ์วัฒนธรรมไทย/สิ่งแวดล้อม ครั้งที่ 2 (อย่างน้อย 2)', weight: 50, evidenceTypes: ['image', 'document', 'certificate'], autoDetectable: false },
          ],
        },
        {
          id: 'PER_1.8',
          name: 'ดำรงชีวิตตามหลักปรัชญาเศรษฐกิจพอเพียง',
          checks: [
            { id: 'SUFFICIENCY_LIVING', label: 'ดำรงชีวิตตามหลักปรัชญาของเศรษฐกิจพอเพียง', weight: 50, evidenceTypes: ['checklist'], autoDetectable: false },
            { id: 'SUFFICIENCY_EVIDENCE', label: 'มีหลักฐานกิจกรรม/โครงการที่เกี่ยวข้อง', weight: 50, evidenceTypes: ['checklist', 'image', 'document'], autoDetectable: false },
          ],
        },
        {
          id: 'PER_1.9',
          name: 'ละเว้นอบายมุขและสิ่งเสพติด',
          checks: [
            { id: 'NO_VICE', label: 'ละเว้นอบายมุขและสิ่งเสพติด', weight: 50, evidenceTypes: ['checklist'], autoDetectable: false },
            { id: 'ANTI_DRUG_CAMPAIGN', label: 'ร่วมรณรงค์ส่งเสริมผู้อื่น/มีหลักฐาน', weight: 50, evidenceTypes: ['checklist', 'image', 'document'], autoDetectable: false },
          ],
        },
        {
          id: 'PER_1.10',
          name: 'ประพฤติตนเป็นแบบอย่างที่ดี',
          checks: [
            { id: 'ROLE_MODEL', label: 'ประพฤติตนเป็นแบบอย่างที่ดีให้กับผู้เรียน', weight: 50, evidenceTypes: ['checklist'], autoDetectable: false },
            { id: 'ROLE_MODEL_EVIDENCE', label: 'ได้รับการยอมรับจากบุคคลรอบข้าง/หลักฐาน', weight: 50, evidenceTypes: ['checklist', 'document'], autoDetectable: false },
          ],
        },
        {
          id: 'PER_1.11',
          name: 'รักษาชื่อเสียง ปกป้องศักดิ์ศรีวิชาชีพ',
          checks: [
            { id: 'PROFESSION_HONOR', label: 'รักษาชื่อเสียง ปกป้องศักดิ์ศรีวิชาชีพ', weight: 50, evidenceTypes: ['checklist'], autoDetectable: false },
            { id: 'HONOR_CERTIFICATE', label: 'ได้รับการยกย่องเชิดชูเกียรติอย่างน้อย 1 รายการ', weight: 50, evidenceTypes: ['certificate', 'document'], autoDetectable: false },
          ],
        },
        // --- ส่วน 2: การพัฒนาตนเอง (4 ข้อ) ---
        {
          id: 'PER_2.1',
          name: 'ภาษาไทยและอังกฤษ',
          checks: [
            { id: 'THAI_TRAINING', label: 'อบรม/พัฒนาทักษะภาษาไทย อย่างน้อย 1 หลักสูตร', weight: 50, evidenceTypes: ['certificate', 'document'], autoDetectable: false },
            { id: 'ENG_TRAINING', label: 'อบรม/พัฒนาทักษะภาษาอังกฤษ อย่างน้อย 1 หลักสูตร', weight: 50, evidenceTypes: ['certificate', 'document'], autoDetectable: false },
          ],
        },
        {
          id: 'PER_2.2',
          name: 'เทคโนโลยีดิจิทัล',
          checks: [
            { id: 'DIGITAL_TRAINING', label: 'อบรม/พัฒนาทักษะเทคโนโลยีดิจิทัลเพื่อการศึกษา', weight: 50, evidenceTypes: ['certificate', 'document'], autoDetectable: false },
            { id: 'DIGITAL_OUTPUT', label: 'มีผลงานจากการใช้เทคโนโลยี', weight: 50, evidenceTypes: ['document', 'link', 'image'], autoDetectable: false },
          ],
        },
        {
          id: 'PER_2.3',
          name: 'การเงิน',
          checks: [
            { id: 'FINANCE_TRAINING', label: 'เข้ารับการพัฒนาด้านการวางแผนการเงิน/วินัยทางการเงิน', weight: 50, evidenceTypes: ['certificate', 'document'], autoDetectable: false },
            { id: 'FINANCE_PLAN', label: 'มีแผนการออม/วางแผนการเงิน (ถ้ามี)', weight: 50, evidenceTypes: ['document', 'text'], autoDetectable: false },
          ],
        },
        {
          id: 'PER_2.4',
          name: 'สุขภาพ',
          checks: [
            { id: 'HEALTH_ACTIVITY', label: 'เข้าร่วมกิจกรรมกีฬา/นันทนาการ/ธรรมะ', weight: 50, evidenceTypes: ['certificate', 'image', 'document'], autoDetectable: false },
            { id: 'HEALTH_CHECK', label: 'ผลการตรวจสุขภาพประจำปี/หลักฐานดูแลสุขภาพ', weight: 50, evidenceTypes: ['document', 'certificate'], autoDetectable: false },
          ],
        },
      ],
    },
  ],
};

// =============================================
// Helper: ดึง checks ของตัวชี้วัดเฉพาะตัว
// =============================================

export function getIndicatorChecks(indicatorId: string): IndicatorChecks | undefined {
  for (const domain of INDICATOR_CHECK_CONFIG.domains) {
    const found = domain.items.find((item) => item.id === indicatorId);
    if (found) return found;
  }
  return undefined;
}

export function getDomainForIndicator(indicatorId: string): DomainChecks | undefined {
  for (const domain of INDICATOR_CHECK_CONFIG.domains) {
    if (domain.items.some((item) => item.id === indicatorId)) {
      return domain;
    }
  }
  return undefined;
}

// =============================================
// Slide Template Config (สไลด์มาตรฐาน ว19/2568)
// =============================================

export interface SlideTemplate {
  id: string;
  name: string;
  indicatorIds: string[]; // ตัวชี้วัดที่แสดงในสไลด์
  type: 'cover' | 'overview' | 'domain' | 'indicator' | 'checklist' | 'summary';
  assessmentRounds: number[]; // แสดงในครั้งที่เท่าไหร่
}

export const SLIDE_TEMPLATES: SlideTemplate[] = [
  { id: 'SLIDE_COVER', name: 'หน้าปก', indicatorIds: [], type: 'cover', assessmentRounds: [1, 2, 3, 4] },
  { id: 'SLIDE_OVERVIEW', name: 'ภาพรวมความสมบูรณ์ 3 ด้าน', indicatorIds: [], type: 'overview', assessmentRounds: [1, 2, 3, 4] },

  // ด้านวิชาชีพ
  { id: 'SLIDE_PRO_OVERVIEW', name: 'ด้านวิชาชีพ: ภาพรวม', indicatorIds: ['PRO_1.1', 'PRO_1.2', 'PRO_1.3', 'PRO_1.4', 'PRO_1.5', 'PRO_1.6', 'PRO_1.7', 'PRO_2.1', 'PRO_2.2', 'PRO_2.3'], type: 'domain', assessmentRounds: [1, 2, 3, 4] },
  { id: 'SLIDE_PRO_1_1', name: '1.1 การวิเคราะห์หลักสูตร', indicatorIds: ['PRO_1.1'], type: 'indicator', assessmentRounds: [1, 2, 3, 4] },
  { id: 'SLIDE_PRO_1_2', name: '1.2 การออกแบบการจัดการเรียนรู้', indicatorIds: ['PRO_1.2'], type: 'indicator', assessmentRounds: [1, 2, 3, 4] },
  { id: 'SLIDE_PRO_1_3', name: '1.3 กิจกรรม Active Learning', indicatorIds: ['PRO_1.3'], type: 'indicator', assessmentRounds: [1, 2, 3, 4] },
  { id: 'SLIDE_PRO_1_4_5', name: '1.4–1.5 สื่อเทคโนโลยี + วัดประเมินผล', indicatorIds: ['PRO_1.4', 'PRO_1.5'], type: 'indicator', assessmentRounds: [1, 2, 3, 4] },
  { id: 'SLIDE_PRO_1_6_7', name: '1.6–1.7 บรรยากาศ + เทคโนโลยีดิจิทัล', indicatorIds: ['PRO_1.6', 'PRO_1.7'], type: 'indicator', assessmentRounds: [1, 2, 3, 4] },
  { id: 'SLIDE_PRO_2', name: '2.1–2.3 การส่งเสริมสนับสนุน', indicatorIds: ['PRO_2.1', 'PRO_2.2', 'PRO_2.3'], type: 'indicator', assessmentRounds: [1, 2, 3, 4] },

  // ด้านสังคม
  { id: 'SLIDE_SOCIAL', name: 'ด้านสังคม: Mentor + PLC', indicatorIds: ['SOC_1', 'SOC_2'], type: 'domain', assessmentRounds: [3, 4] },

  // ด้านคุณลักษณะ
  { id: 'SLIDE_PER_DISCIPLINE', name: 'วินัย คุณธรรม จริยธรรม', indicatorIds: ['PER_1.1', 'PER_1.2', 'PER_1.3', 'PER_1.4', 'PER_1.5', 'PER_1.6', 'PER_1.7', 'PER_1.8', 'PER_1.9', 'PER_1.10', 'PER_1.11'], type: 'checklist', assessmentRounds: [1, 2, 3, 4] },
  { id: 'SLIDE_PER_DEVELOP', name: 'การพัฒนาตนเอง', indicatorIds: ['PER_2.1', 'PER_2.2', 'PER_2.3', 'PER_2.4'], type: 'indicator', assessmentRounds: [3, 4] },

  // สรุป
  { id: 'SLIDE_SUMMARY', name: 'สรุป: ผ่านเกณฑ์ + สิ่งที่ต้องเติม', indicatorIds: [], type: 'summary', assessmentRounds: [1, 2, 3, 4] },
];

// Helper: ดึง slides ที่ต้องแสดงในครั้งที่ X
export function getSlidesForRound(round: number): SlideTemplate[] {
  return SLIDE_TEMPLATES.filter((s) => s.assessmentRounds.includes(round));
}
