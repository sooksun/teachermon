'use client';

import { useState } from 'react';
import { Sparkles, Lightbulb, Shield, Loader2 } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { toast } from 'react-toastify';

interface AIJournalHelperProps {
  text: string;
  onTextImproved: (improvedText: string) => void;
  indicatorCode?: string;
}

export function AIJournalHelper({ text, onTextImproved, indicatorCode = 'WP.1' }: AIJournalHelperProps) {
  const [isImproving, setIsImproving] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [showPrompts, setShowPrompts] = useState(false);
  const [prompts, setPrompts] = useState<string[]>([]);

  // ปรับภาษาให้เป็นทางการ
  const handleImproveLanguage = async () => {
    if (!text || text.trim().length < 10) {
      toast.warning('กรุณาเขียนข้อความอย่างน้อย 10 ตัวอักษร', { position: 'top-right' });
      return;
    }

    setIsImproving(true);
    try {
      const response = await apiClient.post('/journals/ai/improve-language', {
        text,
        indicatorCode,
      });

      onTextImproved(response.data.improvedText);
      
      toast.success('✨ ปรับภาษาเสร็จแล้ว!', { 
        position: 'top-right',
        autoClose: 2000,
      });

      // แสดง suggestions ถ้ามี
      if (response.data.suggestions && response.data.suggestions.length > 0) {
        toast.info(
          <div>
            <strong>💡 คำแนะนำ:</strong>
            <ul className="list-disc ml-4 mt-1">
              {response.data.suggestions.slice(0, 3).map((s: string, i: number) => (
                <li key={i} className="text-sm">{s}</li>
              ))}
            </ul>
          </div>,
          { 
            position: 'bottom-right',
            autoClose: 8000,
          }
        );
      }
    } catch (error: any) {
      console.error('AI Error:', error);
      toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการปรับภาษา', {
        position: 'top-right',
      });
    } finally {
      setIsImproving(false);
    }
  };

  // ตรวจสอบ PDPA
  const handleCheckPDPA = async () => {
    if (!text || text.trim().length < 10) {
      toast.warning('กรุณาเขียนข้อความก่อนตรวจสอบ', { position: 'top-right' });
      return;
    }

    setIsChecking(true);
    try {
      const response = await apiClient.post('/journals/ai/check-pdpa', {
        text,
      });

      const { isSafe, riskLevel, violations, suggestions } = response.data;

      if (isSafe) {
        toast.success('✅ ปลอดภัย! ไม่พบข้อมูลอ่อนไหว', {
          position: 'top-right',
          autoClose: 3000,
        });
      } else {
        const riskColor = 
          riskLevel === 'HIGH_RISK' ? 'text-red-600' :
          riskLevel === 'MEDIUM_RISK' ? 'text-orange-600' :
          'text-yellow-600';

        toast.warning(
          <div>
            <strong className={riskColor}>⚠️ พบข้อมูลอ่อนไหว ({violations.length} รายการ)</strong>
            <ul className="list-disc ml-4 mt-2 text-sm">
              {violations.map((v: any, i: number) => (
                <li key={i}>
                  <strong>{v.type}:</strong> {v.suggestion}
                </li>
              ))}
            </ul>
            {suggestions && suggestions.length > 0 && (
              <div className="mt-2 text-sm">
                <strong>คำแนะนำ:</strong> {suggestions[0]}
              </div>
            )}
          </div>,
          {
            position: 'top-center',
            autoClose: 10000,
          }
        );
      }
    } catch (error: any) {
      toast.error('เกิดข้อผิดพลาดในการตรวจสอบ PDPA', {
        position: 'top-right',
      });
    } finally {
      setIsChecking(false);
    }
  };

  // แนะนำคำถามสะท้อนคิด
  const handleSuggestPrompts = async () => {
    setShowPrompts(true);
    try {
      const response = await apiClient.post('/journals/ai/suggest-prompts', {
        indicatorCode,
      });

      setPrompts(response.data.prompts || []);
    } catch (error: any) {
      toast.error('เกิดข้อผิดพลาดในการแนะนำคำถาม', {
        position: 'top-right',
      });
    }
  };

  return (
    <div className="space-y-3">
      {/* AI Action Buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleImproveLanguage}
          disabled={isImproving}
          className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-purple-700 bg-purple-50 border border-purple-200 rounded-md hover:bg-purple-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isImproving ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4 mr-2" />
          )}
          {isImproving ? 'กำลังปรับภาษา...' : '✨ ช่วยปรับภาษา'}
        </button>

        <button
          type="button"
          onClick={handleSuggestPrompts}
          className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors"
        >
          <Lightbulb className="w-4 h-4 mr-2" />
          💡 คำถามสะท้อนคิด
        </button>

        <button
          type="button"
          onClick={handleCheckPDPA}
          disabled={isChecking}
          className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-md hover:bg-green-100 transition-colors disabled:opacity-50"
        >
          {isChecking ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Shield className="w-4 h-4 mr-2" />
          )}
          {isChecking ? 'กำลังตรวจสอบ...' : '🔒 ตรวจ PDPA'}
        </button>
      </div>

      {/* คำถามสะท้อนคิด */}
      {showPrompts && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-blue-900">💡 คำถามสะท้อนคิดสำหรับ {indicatorCode}</h4>
            <button
              type="button"
              onClick={() => setShowPrompts(false)}
              className="text-blue-600 hover:text-blue-800"
            >
              ✕
            </button>
          </div>
          <ul className="space-y-2 text-sm text-blue-800">
            {prompts.map((prompt, index) => (
              <li key={index} className="flex items-start">
                <span className="font-semibold mr-2">{index + 1}.</span>
                <span>{prompt}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* คำเตือน */}
      <div className="text-xs text-gray-500 italic">
        ⚠️ AI เป็นเพียงผู้ช่วยเสนอแนะ กรุณาตรวจสอบและปรับแก้เอง
      </div>
    </div>
  );
}
