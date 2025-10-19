import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, isWithinInterval, isAfter, isBefore } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import './Calendar.css';

const Calendar = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [schedules, setSchedules] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);

  useEffect(() => {
    const savedSchedules = localStorage.getItem('schedules');
    if (savedSchedules) {
      setSchedules(JSON.parse(savedSchedules));
    }
  }, []);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // 繰り返しスケジュールの展開ロジック
  const expandRecurringSchedule = (schedule, targetDate) => {
    if (schedule.scheduleType !== 'recurring') return false;
    
    const startDate = new Date(schedule.date);
    const endDate = new Date(schedule.recurringEndDate);
    
    // 対象日が期間外の場合は除外
    if (isBefore(targetDate, startDate) || isAfter(targetDate, endDate)) {
      return false;
    }
    
    const daysDiff = Math.floor((targetDate - startDate) / (1000 * 60 * 60 * 24));
    
    switch (schedule.recurringType) {
      case 'daily':
        return daysDiff % schedule.recurringInterval === 0;
      case 'weekly':
        return daysDiff % (schedule.recurringInterval * 7) === 0;
      case 'monthly':
        // 月次は近似計算（より正確には日付の比較が必要）
        const monthsDiff = Math.floor(daysDiff / 30);
        return monthsDiff % schedule.recurringInterval === 0 && 
               targetDate.getDate() === startDate.getDate();
      case 'yearly':
        // 年次は近似計算
        const yearsDiff = Math.floor(daysDiff / 365);
        return yearsDiff % schedule.recurringInterval === 0 &&
               targetDate.getMonth() === startDate.getMonth() &&
               targetDate.getDate() === startDate.getDate();
      default:
        return false;
    }
  };

  // 期間指定スケジュールの判定
  const isWithinPeriodSchedule = (schedule, targetDate) => {
    if (schedule.scheduleType !== 'period') return false;
    
    const startDate = new Date(schedule.periodStartDate);
    const endDate = new Date(schedule.periodEndDate);
    
    return isWithinInterval(targetDate, { start: startDate, end: endDate });
  };

  const getSchedulesForDate = (date) => {
    return schedules.filter(schedule => {
      // 単発スケジュール
      if (schedule.scheduleType === 'single' || !schedule.scheduleType) {
        return isSameDay(new Date(schedule.date), date);
      }
      
      // 繰り返しスケジュール
      if (schedule.scheduleType === 'recurring') {
        return expandRecurringSchedule(schedule, date);
      }
      
      // 期間指定スケジュール
      if (schedule.scheduleType === 'period') {
        return isWithinPeriodSchedule(schedule, date);
      }
      
      return false;
    });
  };

  const getSchedulesForSelectedDate = () => {
    if (!selectedDate) return [];
    return getSchedulesForDate(selectedDate);
  };

  const navigateMonth = (direction) => {
    if (direction === 'prev') {
      setCurrentMonth(subMonths(currentMonth, 1));
    } else {
      setCurrentMonth(addMonths(currentMonth, 1));
    }
  };

  const getDayClass = (day) => {
    const today = new Date();
    const isToday = isSameDay(day, today);
    const isSelected = selectedDate && isSameDay(day, selectedDate);
    const hasSchedules = getSchedulesForDate(day).length > 0;
    
    let className = 'calendar-day';
    if (isToday) className += ' today';
    if (isSelected) className += ' selected';
    if (hasSchedules) className += ' has-schedules';
    
    return className;
  };

  const getPriorityClass = (priority) => {
    switch (priority) {
      case 'high': return 'priority-high';
      case 'medium': return 'priority-medium';
      case 'low': return 'priority-low';
      default: return 'priority-medium';
    }
  };

  return (
    <div className="calendar">
      <div className="calendar-header">
        <h2>カレンダー</h2>
        <div className="calendar-navigation">
          <button onClick={() => navigateMonth('prev')} className="nav-button">
            <ChevronLeft size={20} />
          </button>
          <h3 className="month-title">
            {format(currentMonth, 'yyyy年MM月', { locale: ja })}
          </h3>
          <button onClick={() => navigateMonth('next')} className="nav-button">
            <ChevronRight size={20} />
          </button>
        </div>
        <Link to="/add" className="add-button">
          <Plus size={20} />
          新規作成
        </Link>
      </div>

      <div className="calendar-grid">
        <div className="calendar-weekdays">
          {['日', '月', '火', '水', '木', '金', '土'].map(day => (
            <div key={day} className="weekday">{day}</div>
          ))}
        </div>
        
        <div className="calendar-days">
          {monthDays.map(day => {
            const daySchedules = getSchedulesForDate(day);
            return (
              <div
                key={day.toISOString()}
                className={getDayClass(day)}
                onClick={() => setSelectedDate(day)}
              >
                <div className="day-number">
                  {format(day, 'd')}
                </div>
                {daySchedules.length > 0 && (
                  <div className="day-schedules">
                    {daySchedules.slice(0, 3).map(schedule => (
                      <div
                        key={schedule.id}
                        className={`schedule-dot ${getPriorityClass(schedule.priority)}`}
                        title={schedule.title}
                      />
                    ))}
                    {daySchedules.length > 3 && (
                      <div className="more-schedules">+{daySchedules.length - 3}</div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {selectedDate && (
        <div className="selected-date-schedules">
          <h3>
            {format(selectedDate, 'yyyy年MM月dd日', { locale: ja })}のスケジュール
          </h3>
          <div className="schedule-list">
            {getSchedulesForSelectedDate().length === 0 ? (
              <p className="no-schedules">この日のスケジュールはありません</p>
            ) : (
              getSchedulesForSelectedDate().map(schedule => {
                const getScheduleTimeDisplay = () => {
                  if (schedule.scheduleType === 'period') {
                    return `${schedule.periodStartTime} - ${schedule.periodEndTime}`;
                  } else if (schedule.scheduleType === 'recurring') {
                    return format(new Date(schedule.date), 'HH:mm');
                  } else {
                    return format(new Date(schedule.date), 'HH:mm');
                  }
                };

                const getScheduleTypeLabel = () => {
                  switch (schedule.scheduleType) {
                    case 'recurring':
                      const recurringLabels = {
                        daily: '日次',
                        weekly: '週次',
                        monthly: '月次',
                        yearly: '年次'
                      };
                      return `🔄 ${recurringLabels[schedule.recurringType] || '繰り返し'}`;
                    case 'period':
                      return '📅 期間指定';
                    default:
                      return '';
                  }
                };

                return (
                  <div key={schedule.id} className={`schedule-item ${getPriorityClass(schedule.priority)}`}>
                    <div className="schedule-time">
                      {getScheduleTimeDisplay()}
                    </div>
                    <div className="schedule-content">
                      <h4>{schedule.title}</h4>
                      {getScheduleTypeLabel() && (
                        <p className="schedule-type">{getScheduleTypeLabel()}</p>
                      )}
                      {schedule.description && (
                        <p className="schedule-description">{schedule.description}</p>
                      )}
                      {schedule.location && (
                        <p className="schedule-location">📍 {schedule.location}</p>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;
