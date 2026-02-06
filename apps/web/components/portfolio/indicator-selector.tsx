'use client';

import React, { useState } from 'react';

export interface Indicator {
  code: string;
  name: string;
  description: string;
  category: string;
  examples?: string[]; // ตัวอย่างหลักฐานที่เกี่ยวข้อง
}

const INDICATORS: Indicator[] = [
  {
    code: 'WP_1',
    name: 'การออกแบบการจัดการเรียนรู้',
    description: 'การวิเคราะห์หลักสูตร การออกแบบหน่วยการเรียนรู้ การจัดทำแผนการจัดการเรียนรู้ และการวิเคราะห์ผู้เรียนเป็นรายบุคคล',
    category: 'การพัฒนาการสอน',
    examples: [
      'แผนการสอนรายชั่วโมง/รายหน่วย',
      'การวิเคราะห์หลักสูตรและมาตรฐานการเรียนรู้',
      'การวิเคราะห์ผู้เรียนเป็นรายบุคคล',
      'หน่วยการเรียนรู้ที่สอดคล้องกับบริบท',
    ],
  },
  {
    code: 'WP_2',
    name: 'การจัดการเรียนรู้ที่เน้นผู้เรียนเป็นสำคัญ',
    description: 'การจัดกิจกรรมการเรียนรู้แบบ Active Learning การใช้สื่อและเทคโนโลยี การจัดบรรยากาศที่ส่งเสริมผู้เรียน และการใช้เทคโนโลยีดิจิทัล',
    category: 'การพัฒนาการสอน',
    examples: [
      'ภาพถ่ายกิจกรรมในชั้นเรียน',
      'วิดีโอการสอน',
      'ผลงานนักเรียน',
      'การใช้สื่อดิจิทัล (Google Classroom, คลิปวิดีโอ)',
      'การจัดบรรยากาศการเรียนรู้',
    ],
  },
  {
    code: 'WP_3',
    name: 'การวัดและประเมินผล',
    description: 'การวัดและประเมินผลการเรียนรู้ด้วยวิธีการที่หลากหลาย การนำผลการประเมินมาพัฒนาการเรียนรู้ และการจัดทำข้อมูลสารสนเทศของผู้เรียน',
    category: 'การพัฒนาการสอน',
    examples: [
      'แบบทดสอบ/แบบประเมิน',
      'ผลการประเมินนักเรียน',
      'ร่องรอยการเก็บคะแนน',
      'วิจัยในชั้นเรียน',
      'เอกสารธุรการชั้นเรียน (ปพ.)',
    ],
  },
  {
    code: 'ET_1',
    name: 'ความเป็นครู',
    description: 'การมีวินัยในตนเอง การตรงต่อเวลา การเป็นแบบอย่างที่ดี จรรยาบรรณวิชาชีพ และการเอาใจใส่ช่วยเหลือผู้เรียน',
    category: 'ความเป็นมืออาชีพ',
    examples: [
      'บันทึกความดี/เกียรติบัตร',
      'บันทึกการลงเวลาปฏิบัติราชการ',
      'บันทึกการเยี่ยมบ้าน',
      'บันทึกการคัดกรอง/ให้คำปรึกษา',
      'เกียรติบัตร/รางวัล',
    ],
  },
  {
    code: 'ET_2',
    name: 'การจัดการชั้นเรียน',
    description: 'การจัดบรรยากาศที่ส่งเสริมผู้เรียน การจัดการชั้นเรียน การดำเนินการตามระบบดูแลช่วยเหลือผู้เรียน และการประสานความร่วมมือ',
    category: 'ความเป็นมืออาชีพ',
    examples: [
      'ภาพบรรยากาศชั้นเรียน',
      'บันทึกการเยี่ยมบ้าน',
      'รายงานระบบดูแลช่วยเหลือ',
      'การประชุมผู้ปกครอง',
      'บันทึกการคัดกรอง/ให้คำปรึกษา',
    ],
  },
  {
    code: 'ET_3',
    name: 'ภาวะผู้นำทางวิชาการ',
    description: 'การเรียนรู้จากกัลยาณมิตร การเรียนรู้ร่วมกันเป็นเครือข่ายทางวิชาชีพ (PLC) การเป็นวิทยากร และการพัฒนาวิชาชีพ',
    category: 'ความเป็นมืออาชีพ',
    examples: [
      'บันทึกการนิเทศ/สังเกตการสอน',
      'บันทึกกิจกรรม PLC (Logbook)',
      'ภาพถ่ายการประชุมกลุ่ม',
      'ผลลัพธ์จากการทำ PLC',
      'การเป็นวิทยากร/ผู้เชี่ยวชาญ',
    ],
  },
  {
    code: 'ET_4',
    name: 'การพัฒนาตนเอง',
    description: 'การพัฒนาทักษะภาษาไทยและภาษาอังกฤษ เทคโนโลยีดิจิทัล การวางแผนการเงิน การดูแลสุขภาพกายและใจ และการเรียนรู้ด้านกฎหมายระเบียบ',
    category: 'ความเป็นมืออาชีพ',
    examples: [
      'เกียรติบัตร/วุฒิบัตรการอบรม',
      'รายงานการอบรมพัฒนาตนเอง',
      'ผลงานจากการใช้เทคโนโลยี',
      'แผนการออม',
      'หลักฐานการเข้าร่วมกิจกรรมกีฬา/นันทนาการ/ธรรมะ',
      'คำสั่งแต่งตั้งการปฏิบัติงาน',
    ],
  },
];

interface IndicatorSelectorProps {
  selectedCodes: string[];
  onSelectionChange: (codes: string[]) => void;
  aiSuggestedCodes?: string[]; // ตัวชี้วัดที่ AI แนะนำ
  className?: string;
}

export function IndicatorSelector({
  selectedCodes,
  onSelectionChange,
  aiSuggestedCodes = [],
  className = '',
}: IndicatorSelectorProps) {
  const [showTable, setShowTable] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const toggleIndicator = (code: string) => {
    if (selectedCodes.includes(code)) {
      onSelectionChange(selectedCodes.filter((c) => c !== code));
    } else {
      onSelectionChange([...selectedCodes, code]);
    }
  };

  const filteredIndicators = INDICATORS.filter((ind) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      ind.code.toLowerCase().includes(searchLower) ||
      ind.name.toLowerCase().includes(searchLower) ||
      ind.description.toLowerCase().includes(searchLower) ||
      ind.category.toLowerCase().includes(searchLower)
    );
  });

  const groupedIndicators = filteredIndicators.reduce((acc, ind) => {
    if (!acc[ind.category]) {
      acc[ind.category] = [];
    }
    acc[ind.category].push(ind);
    return acc;
  }, {} as Record<string, Indicator[]>);

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-medium text-gray-700">
          รหัสตัวชี้วัด
          {selectedCodes.length > 0 && (
            <span className="ml-2 text-xs text-primary-600">
              (เลือกแล้ว {selectedCodes.length} ตัว)
            </span>
          )}
        </label>
        <button
          type="button"
          onClick={() => setShowTable(!showTable)}
          className="text-sm text-primary-600 hover:text-primary-700"
        >
          {showTable ? 'ซ่อนตาราง' : 'แสดงตาราง'}
        </button>
      </div>

      {/* Text Input (ยังคงใช้ได้) */}
      <input
        type="text"
        value={selectedCodes.join(', ')}
        onChange={(e) => {
          const codes = e.target.value
            .split(',')
            .map((c) => c.trim())
            .filter(Boolean);
          onSelectionChange(codes);
        }}
        placeholder="เช่น WP_1, WP_2, ET_1 หรือคลิกแสดงตารางเพื่อเลือก"
        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 mb-2"
      />

      {/* AI Suggested Indicators */}
      {aiSuggestedCodes.length > 0 && (
        <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <span className="text-sm font-medium text-blue-800">AI แนะนำ:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {aiSuggestedCodes.map((code) => {
              const indicator = INDICATORS.find((ind) => ind.code === code);
              return (
                <button
                  key={code}
                  type="button"
                  onClick={() => {
                    if (!selectedCodes.includes(code)) {
                      onSelectionChange([...selectedCodes, code]);
                    }
                  }}
                  className={`px-2 py-1 text-xs rounded ${
                    selectedCodes.includes(code)
                      ? 'bg-blue-600 text-white'
                      : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  }`}
                >
                  {indicator ? `${code} - ${indicator.name}` : code}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Indicator Table */}
      {showTable && (
        <div className="mt-3 border border-gray-200 rounded-lg overflow-hidden">
          {/* Search */}
          <div className="p-3 bg-gray-50 border-b">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ค้นหาตัวชี้วัด..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Table */}
          <div className="max-h-64 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 w-12">
                    เลือก
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 w-20">
                    รหัส
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">
                    ชื่อตัวชี้วัด
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">
                    คำอธิบาย
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 w-32">
                    หมวดหมู่
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 w-40">
                    ตัวอย่างหลักฐาน
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {Object.entries(groupedIndicators).map(([category, indicators]) => (
                  <React.Fragment key={category}>
                    {indicators.map((indicator) => {
                      const isSelected = selectedCodes.includes(indicator.code);
                      const isAISuggested = aiSuggestedCodes.includes(indicator.code);
                      return (
                        <tr
                          key={indicator.code}
                          className={`hover:bg-gray-50 ${
                            isAISuggested ? 'bg-blue-50/50' : ''
                          }`}
                        >
                          <td className="px-4 py-2">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleIndicator(indicator.code)}
                              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <span
                              className={`font-medium ${
                                isAISuggested ? 'text-blue-700' : 'text-gray-900'
                              }`}
                            >
                              {indicator.code}
                              {isAISuggested && (
                                <span className="ml-1 text-blue-600" title="AI แนะนำ">
                                  ✨
                                </span>
                              )}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-gray-900">{indicator.name}</td>
                          <td className="px-4 py-2 text-gray-600 text-xs">{indicator.description}</td>
                          <td className="px-4 py-2 text-gray-500 text-xs">{category}</td>
                          <td className="px-4 py-2 text-gray-500 text-xs">
                            {indicator.examples && indicator.examples.length > 0 ? (
                              <ul className="list-disc list-inside space-y-0.5">
                                {indicator.examples.slice(0, 2).map((ex, idx) => (
                                  <li key={idx}>{ex}</li>
                                ))}
                                {indicator.examples.length > 2 && (
                                  <li className="text-gray-400">+{indicator.examples.length - 2} อื่นๆ</li>
                                )}
                              </ul>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {filteredIndicators.length === 0 && (
            <div className="p-4 text-center text-sm text-gray-500">
              ไม่พบตัวชี้วัดที่ตรงกับการค้นหา
            </div>
          )}
        </div>
      )}

      {/* Selected Indicators Summary */}
      {selectedCodes.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {selectedCodes.map((code) => {
            const indicator = INDICATORS.find((ind) => ind.code === code);
            return (
              <span
                key={code}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-primary-100 text-primary-700 rounded"
              >
                {indicator ? `${code} - ${indicator.name}` : code}
                <button
                  type="button"
                  onClick={() => toggleIndicator(code)}
                  className="text-primary-600 hover:text-primary-800"
                >
                  ×
                </button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
