'use client';

import React from 'react';
import { DatePicker, DatePickerProps } from 'antd';
import th from 'antd/es/date-picker/locale/th_TH';
import dayTh from 'dayjs/locale/th';
import dayjs, { Dayjs } from 'dayjs';
import buddhistEra from 'dayjs/plugin/buddhistEra';

dayjs.extend(buddhistEra);
dayjs.locale(dayTh);

/** รูปแบบ d/m/y (วัน/เดือน/ปี พ.ศ.) */
const DATE_FORMAT_DMY = 'DD/MM/BBBB';

const buddhistLocale: typeof th = {
  ...th,
  lang: {
    ...th.lang,
    fieldDateFormat: DATE_FORMAT_DMY,
    fieldDateTimeFormat: 'DD/MM/BBBB HH:mm:ss',
    yearFormat: 'BBBB',
    cellYearFormat: 'BBBB',
  },
};

export interface ThaiDatePickerProps extends Omit<DatePickerProps, 'locale' | 'onChange'> {
  value?: string | Date | Dayjs | null;
  onChange?: (date: Dayjs | null, dateString: string) => void;
  className?: string;
}

export function ThaiDatePicker({
  value,
  onChange,
  className,
  ...props
}: ThaiDatePickerProps) {
  const handleChange = (date: Dayjs | null, dateString: string) => {
    if (onChange) {
      onChange(date, dateString);
    }
  };

  // Convert value to Dayjs if it's a string or Date
  let dayjsValue: Dayjs | null = null;
  if (value) {
    if (typeof value === 'string') {
      dayjsValue = dayjs(value);
    } else if (value instanceof Date) {
      dayjsValue = dayjs(value);
    } else {
      dayjsValue = value;
    }
  }

  return (
    <DatePicker
      locale={buddhistLocale}
      value={dayjsValue}
      onChange={handleChange}
      className={className}
      format={DATE_FORMAT_DMY}
      {...props}
    />
  );
}
