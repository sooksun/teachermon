'use client';

import React from 'react';
import { DatePicker, DatePickerProps } from 'antd';
import th from 'antd/es/date-picker/locale/th_TH';
import dayTh from 'dayjs/locale/th';
import dayjs, { Dayjs } from 'dayjs';
import buddhistEra from 'dayjs/plugin/buddhistEra';

dayjs.extend(buddhistEra);
dayjs.locale(dayTh);

const buddhistLocale: typeof th = {
  ...th,
  lang: {
    ...th.lang,
    fieldDateFormat: 'BBBB-MM',
    fieldDateTimeFormat: 'BBBB-MM-DD HH:mm:ss',
    yearFormat: 'BBBB',
    cellYearFormat: 'BBBB',
  },
};

export interface ThaiMonthPickerProps extends Omit<DatePickerProps, 'locale' | 'onChange' | 'picker'> {
  value?: string | Date | Dayjs | null;
  onChange?: (date: Dayjs | null, dateString: string) => void;
  className?: string;
}

export function ThaiMonthPicker({
  value,
  onChange,
  className,
  ...props
}: ThaiMonthPickerProps) {
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
      picker="month"
      locale={buddhistLocale}
      value={dayjsValue}
      onChange={handleChange}
      className={className}
      format="BBBB-MM"
      {...props}
    />
  );
}
