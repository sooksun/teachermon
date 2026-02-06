'use client';

import { MainLayout } from '@/components/layout/main-layout';

export default function PrivacyPolicyPage() {
  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="bg-white shadow rounded-lg p-8 space-y-6">
          <h1 className="text-3xl font-bold text-gray-900">
            นโยบายความเป็นส่วนตัว (Privacy Policy)
          </h1>
          <p className="text-sm text-gray-500">
            อัพเดตล่าสุด: 26 มกราคม 2569
          </p>

          <div className="prose max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                1. ข้อมูลที่เก็บรวบรวม
              </h2>
              <p className="text-gray-700 mb-3">
                ระบบ TeacherMon เก็บรวบรวมข้อมูลส่วนบุคคลดังต่อไปนี้:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>ข้อมูลส่วนตัว: ชื่อ-นามสกุล, อีเมล, เบอร์โทรศัพท์, ที่อยู่</li>
                <li>ข้อมูลการทำงาน: ตำแหน่ง, โรงเรียน, ภูมิภาค</li>
                <li>ข้อมูลการประเมิน: คะแนน, การสะท้อนคิด, แผนการพัฒนา</li>
                <li>ข้อมูลการใช้งาน: บันทึกการเข้าถึง, กิจกรรมในระบบ</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                2. วัตถุประสงค์ในการใช้ข้อมูล
              </h2>
              <p className="text-gray-700 mb-3">
                เราใช้ข้อมูลส่วนบุคคลเพื่อ:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>ให้บริการระบบติดตามและหนุนเสริมการพัฒนาครู</li>
                <li>วิเคราะห์และประเมินผลการพัฒนาครู</li>
                <li>ส่งข้อมูลสำคัญและแจ้งเตือน</li>
                <li>ปรับปรุงและพัฒนาระบบ</li>
                <li>ปฏิบัติตามกฎหมายและระเบียบที่เกี่ยวข้อง</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                3. การเปิดเผยข้อมูล
              </h2>
              <p className="text-gray-700 mb-3">
                เราอาจเปิดเผยข้อมูลส่วนบุคคลในกรณีต่อไปนี้:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>หน่วยงานที่เกี่ยวข้องกับการพัฒนาครู (ตามที่ได้รับความยินยอม)</li>
                <li>ผู้ให้บริการระบบ (ภายใต้ข้อตกลงการรักษาความลับ)</li>
                <li>ตามกฎหมายหรือคำสั่งศาล</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                4. สิทธิของเจ้าของข้อมูล
              </h2>
              <p className="text-gray-700 mb-3">
                ตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 คุณมีสิทธิ:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>ขอเข้าถึงข้อมูลส่วนตัว (Right to Access)</li>
                <li>ขอแก้ไขข้อมูลส่วนตัว (Right to Rectification)</li>
                <li>ขอลบข้อมูลส่วนตัว (Right to Erasure)</li>
                <li>ขอระงับการประมวลผลข้อมูล (Right to Restriction)</li>
                <li>ขอถ่ายโอนข้อมูล (Right to Data Portability)</li>
                <li>คัดค้านการประมวลผลข้อมูล (Right to Object)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                5. การรักษาความปลอดภัย
              </h2>
              <p className="text-gray-700 mb-3">
                เรามีมาตรการรักษาความปลอดภัยข้อมูลดังนี้:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>การเข้ารหัสข้อมูล (Encryption)</li>
                <li>การควบคุมการเข้าถึง (Access Control)</li>
                <li>การตรวจสอบ PDPA อัตโนมัติ</li>
                <li>การสำรองข้อมูล (Backup)</li>
                <li>การตรวจสอบและอัพเดตระบบความปลอดภัยอย่างสม่ำเสมอ</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                6. การเก็บรักษาข้อมูล (Data Retention Policy)
              </h2>
              <p className="text-gray-700 mb-3">
                ตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 มาตรา 28 เราจะเก็บรักษาข้อมูลส่วนบุคคลตามระยะเวลาดังนี้:
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-blue-200">
                      <th className="text-left py-2 px-3 font-semibold text-blue-900">ประเภทข้อมูล</th>
                      <th className="text-left py-2 px-3 font-semibold text-blue-900">ระยะเวลาเก็บรักษา</th>
                      <th className="text-left py-2 px-3 font-semibold text-blue-900">เหตุผล</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-700">
                    <tr className="border-b border-blue-100">
                      <td className="py-2 px-3">ข้อมูลครู (Teacher Profile)</td>
                      <td className="py-2 px-3 font-medium">7 ปี</td>
                      <td className="py-2 px-3 text-xs">ตามกฎหมายแรงงานและประวัติการทำงาน</td>
                    </tr>
                    <tr className="border-b border-blue-100">
                      <td className="py-2 px-3">ข้อมูลการประเมิน (Assessments)</td>
                      <td className="py-2 px-3 font-medium">7 ปี</td>
                      <td className="py-2 px-3 text-xs">เพื่อการติดตามและประเมินผลการพัฒนา</td>
                    </tr>
                    <tr className="border-b border-blue-100">
                      <td className="py-2 px-3">Journal และ Evidence</td>
                      <td className="py-2 px-3 font-medium">5 ปี</td>
                      <td className="py-2 px-3 text-xs">หลักฐานการพัฒนาตามโครงการ</td>
                    </tr>
                    <tr className="border-b border-blue-100">
                      <td className="py-2 px-3">PDPA Audit Logs</td>
                      <td className="py-2 px-3 font-medium">3 ปี</td>
                      <td className="py-2 px-3 text-xs">เพื่อการตรวจสอบและ compliance</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3">AI Activity Logs</td>
                      <td className="py-2 px-3 font-medium">1 ปี</td>
                      <td className="py-2 px-3 text-xs">หลังจาก review แล้ว</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-3">
                <p className="text-sm text-yellow-800 font-medium mb-2">
                  ⚠️ กระบวนการลบข้อมูลอัตโนมัติ
                </p>
                <ul className="list-disc pl-6 space-y-1 text-sm text-yellow-700">
                  <li>ระบบจะลบข้อมูลที่หมดอายุอัตโนมัติทุกวันเวลา 02:00 น.</li>
                  <li>คุณจะได้รับแจ้งเตือน 30 วันก่อนข้อมูลจะถูกลบ</li>
                  <li>ข้อมูลที่ถูกลบแล้วไม่สามารถกู้คืนได้</li>
                  <li>คุณสามารถ Export ข้อมูลของคุณได้ตลอดเวลาก่อนถูกลบ</li>
                </ul>
              </div>
              <p className="text-gray-700 mt-3">
                หลังจากระยะเวลาดังกล่าว เราจะลบหรือทำลายข้อมูลส่วนบุคคลโดยอัตโนมัติตาม Data Retention Policy
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                7. การติดต่อ
              </h2>
              <p className="text-gray-700 mb-3">
                หากคุณมีคำถามหรือต้องการใช้สิทธิ์ตาม PDPA กรุณาติดต่อ:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700">
                  <strong>เจ้าหน้าที่คุ้มครองข้อมูลส่วนบุคคล (DPO)</strong>
                </p>
                <p className="text-gray-700">อีเมล: dpo@teachermon.th</p>
                <p className="text-gray-700">โทรศัพท์: 02-XXX-XXXX</p>
              </div>
            </section>

            <section className="border-t pt-6">
              <p className="text-sm text-gray-500">
                นโยบายนี้อาจมีการปรับปรุงเป็นครั้งคราว เราจะแจ้งให้คุณทราบเมื่อมีการเปลี่ยนแปลงสำคัญ
              </p>
            </section>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
