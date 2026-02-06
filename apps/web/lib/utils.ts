import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import dayjs from 'dayjs';
import buddhistEra from 'dayjs/plugin/buddhistEra';
import 'dayjs/locale/th';

dayjs.extend(buddhistEra);
dayjs.locale('th');

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * แปลงวันที่เป็นรูปแบบไทย พ.ศ.
 * @param date - วันที่ (Date, string, dayjs)
 * @param format - รูปแบบการแสดงผล (default: 'DD/MM/BBBB')
 * @returns วันที่ในรูปแบบ พ.ศ.
 */
export function formatThaiDate(date: Date | string | dayjs.Dayjs | null | undefined, format: string = 'DD/MM/BBBB'): string {
  if (!date) return '-';
  return dayjs(date).format(format);
}

/**
 * แปลงวันที่และเวลาเป็นรูปแบบไทย พ.ศ.
 * @param date - วันที่เวลา
 * @returns วันที่เวลาในรูปแบบ พ.ศ.
 */
export function formatThaiDateTime(date: Date | string | dayjs.Dayjs | null | undefined): string {
  if (!date) return '-';
  return dayjs(date).format('DD/MM/BBBB HH:mm');
}

/**
 * แปลงวันที่เป็นรูปแบบยาวภาษาไทย พ.ศ.
 * @param date - วันที่
 * @returns วันที่ในรูปแบบยาว เช่น "15 มกราคม 2567"
 */
export function formatThaiDateLong(date: Date | string | dayjs.Dayjs | null | undefined): string {
  if (!date) return '-';
  return dayjs(date).format('D MMMM BBBB');
}

/**
 * แปลงรูปแบบ YYYY-MM เป็นชื่อเดือนภาษาไทย + พ.ศ.
 * @param monthYear - รูปแบบ YYYY-MM เช่น "2026-01"
 * @returns ชื่อเดือนภาษาไทย + พ.ศ. เช่น "มกราคม 2569"
 */
export function formatThaiMonthYear(monthYear: string | null | undefined): string {
  if (!monthYear) return '-';
  
  try {
    // แปลง "YYYY-MM" เป็น dayjs object
    const date = dayjs(monthYear + '-01');
    if (!date.isValid()) return monthYear;
    
    // แปลงเป็นรูปแบบ "ชื่อเดือน พ.ศ." เช่น "มกราคม 2569"
    return date.format('MMMM BBBB');
  } catch (error) {
    console.error('Error formatting month year:', error);
    return monthYear;
  }
}
