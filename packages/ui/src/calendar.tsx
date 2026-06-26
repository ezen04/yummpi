'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DayPicker, useDayPicker, type CalendarMonth } from 'react-day-picker';
import { ko } from 'date-fns/locale';
import { format } from 'date-fns';
import { cn } from './utils';

/**
 * 날짜 선택 캘린더 (shadcn 패턴, react-day-picker v9 기반).
 *
 * @yummpi/ui 의 `Calendar`는 lucide 아이콘 (CalendarDays alias)이라 이름 충돌.
 * 컴포넌트는 `DatePicker`로 export.
 *
 * 디자인:
 * - 캡션과 prev/next 버튼이 같은 라인 (peg마 매칭)
 * - 5주든 6주든 컨테이너 높이 고정. 행 간격으로 균등 분포 (fixedWeeks=false)
 */
export type DatePickerProps = React.ComponentProps<typeof DayPicker>;

function CustomMonthCaption({
  calendarMonth,
}: {
  calendarMonth: CalendarMonth;
}) {
  const { previousMonth, nextMonth, goToMonth } = useDayPicker();
  return (
    <div className="flex items-center justify-between pb-2">
      <span className="text-[15px] leading-7 font-semibold text-[var(--label-normal)]">
        {format(calendarMonth.date, 'yyyy년 M월', { locale: ko })}
      </span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => previousMonth && goToMonth(previousMonth)}
          disabled={!previousMonth}
          aria-label="이전 달"
          className="w-7 h-7 rounded-[var(--radius-8)] flex items-center justify-center text-[var(--primary)] hover:bg-[var(--fill-normal)] disabled:opacity-30 transition-colors"
        >
          <ChevronLeft size={16} />
        </button>
        <button
          type="button"
          onClick={() => nextMonth && goToMonth(nextMonth)}
          disabled={!nextMonth}
          aria-label="다음 달"
          className="w-7 h-7 rounded-[var(--radius-8)] flex items-center justify-center text-[var(--primary)] hover:bg-[var(--fill-normal)] disabled:opacity-30 transition-colors"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

export function DatePicker({
  className,
  classNames,
  showOutsideDays = false,
  ...props
}: DatePickerProps) {
  return (
    <DayPicker
      locale={ko}
      // outside days 비표시 — 다음달 날짜가 보이면 UX 헷갈림
      showOutsideDays={showOutsideDays}
      className={cn('p-3 font-[var(--font-sans)]', className)}
      classNames={{
        months: 'flex flex-col',
        // 컨테이너 높이 고정 → 5주/6주 캘린더가 같은 높이 안에 균등 분포 (justify-around)
        month: 'flex flex-col h-[300px]',
        // 기본 nav 비표시 — CustomMonthCaption 안에서 prev/next 버튼 직접 렌더
        nav: 'hidden',
        weekdays: 'flex',
        weekday:
          'w-9 h-9 flex items-center justify-center text-[12px] leading-4 font-medium text-[var(--label-alternative)]',
        // weeks를 flex-1 + justify-around로 → 행 간격이 5주/6주에 따라 자동 균등 분포
        month_grid: 'flex-1 flex flex-col',
        weeks: 'flex-1 flex flex-col justify-around',
        week: 'flex',
        day: 'w-9 h-9 flex items-center justify-center text-[13px] leading-[18px] font-normal',
        day_button: cn(
          'w-9 h-9 rounded-[var(--radius-8)] flex items-center justify-center cursor-pointer',
          'hover:bg-[var(--fill-normal)] transition-colors',
          'text-[var(--label-normal)]'
        ),
        selected: cn(
          '[&_button]:bg-[var(--primary)] [&_button]:text-[var(--static-white)]',
          '[&_button]:hover:bg-[var(--primary)]'
        ),
        today:
          '[&_button]:font-semibold [&_button]:text-[var(--primary)] [&_.day_button]:bg-transparent',
        outside: '[&_button]:text-[var(--label-assistive)] opacity-50',
        disabled:
          '[&_button]:text-[var(--label-assistive)] opacity-30 [&_button]:cursor-not-allowed',
        ...classNames,
      }}
      components={{
        MonthCaption: CustomMonthCaption,
      }}
      {...props}
    />
  );
}
