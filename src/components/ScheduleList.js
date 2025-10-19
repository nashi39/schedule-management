import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Edit, Trash2, Plus } from 'lucide-react';
import { format, isWithinInterval, isAfter, isBefore } from 'date-fns';
import { ja } from 'date-fns/locale';
import './ScheduleList.css';

const ScheduleList = () => {
  const [schedules, setSchedules] = useState([]);
  const [filter, setFilter] = useState('all'); // all, today, upcoming

  useEffect(() => {
    // ローカルストレージからスケジュールを読み込み
    const savedSchedules = localStorage.getItem('schedules');
    if (savedSchedules) {
      setSchedules(JSON.parse(savedSchedules));
    }
  }, []);

  const deleteSchedule = (id) => {
    const updatedSchedules = schedules.filter(schedule => schedule.id !== id);
    setSchedules(updatedSchedules);
    localStorage.setItem('schedules', JSON.stringify(updatedSchedules));
  };

  // スケジュールが今日に関連するかチェック
  const isScheduleRelatedToToday = (schedule) => {
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    if (schedule.scheduleType === 'single' || !schedule.scheduleType) {
      const scheduleDate = new Date(schedule.date);
      return scheduleDate >= todayStart && scheduleDate < todayEnd;
    }

    if (schedule.scheduleType === 'period') {
      const startDate = new Date(schedule.periodStartDate);
      const endDate = new Date(schedule.periodEndDate);
      return isWithinInterval(today, { start: startDate, end: endDate });
    }

    if (schedule.scheduleType === 'recurring') {
      const startDate = new Date(schedule.date);
      const endDate = new Date(schedule.recurringEndDate);
      
      if (isBefore(today, startDate) || isAfter(today, endDate)) {
        return false;
      }

      const daysDiff = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
      
      switch (schedule.recurringType) {
        case 'daily':
          return daysDiff % schedule.recurringInterval === 0;
        case 'weekly':
          return daysDiff % (schedule.recurringInterval * 7) === 0;
        case 'monthly':
          const monthsDiff = Math.floor(daysDiff / 30);
          return monthsDiff % schedule.recurringInterval === 0 && 
                 today.getDate() === startDate.getDate();
        case 'yearly':
          const yearsDiff = Math.floor(daysDiff / 365);
          return yearsDiff % schedule.recurringInterval === 0 &&
                 today.getMonth() === startDate.getMonth() &&
                 today.getDate() === startDate.getDate();
        default:
          return false;
      }
    }

    return false;
  };

  // スケジュールが今後の予定かチェック
  const isScheduleUpcoming = (schedule) => {
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    if (schedule.scheduleType === 'single' || !schedule.scheduleType) {
      const scheduleDate = new Date(schedule.date);
      return scheduleDate >= todayStart;
    }

    if (schedule.scheduleType === 'period') {
      const startDate = new Date(schedule.periodStartDate);
      return startDate >= todayStart;
    }

    if (schedule.scheduleType === 'recurring') {
      const startDate = new Date(schedule.date);
      return startDate >= todayStart;
    }

    return false;
  };

  const getFilteredSchedules = () => {
    switch (filter) {
      case 'today':
        return schedules.filter(isScheduleRelatedToToday);
      case 'upcoming':
        return schedules.filter(isScheduleUpcoming);
      default:
        return schedules;
    }
  };

  const filteredSchedules = getFilteredSchedules();

  return (
    <div className="schedule-list">
      <div className="schedule-list-header">
        <h2>スケジュール一覧</h2>
        <div className="filter-buttons">
          <button 
            className={filter === 'all' ? 'active' : ''}
            onClick={() => setFilter('all')}
          >
            すべて
          </button>
          <button 
            className={filter === 'today' ? 'active' : ''}
            onClick={() => setFilter('today')}
          >
            今日
          </button>
          <button 
            className={filter === 'upcoming' ? 'active' : ''}
            onClick={() => setFilter('upcoming')}
          >
            今後の予定
          </button>
        </div>
        <Link to="/add" className="add-button">
          <Plus size={20} />
          新規作成
        </Link>
      </div>

      <div className="schedule-items">
        {filteredSchedules.length === 0 ? (
          <div className="empty-state">
            <p>スケジュールがありません</p>
            <Link to="/add" className="add-first-button">
              最初のスケジュールを作成
            </Link>
          </div>
        ) : (
          filteredSchedules.map(schedule => {
            const getScheduleDateDisplay = () => {
              if (schedule.scheduleType === 'period') {
                const startDate = format(new Date(schedule.periodStartDate), 'yyyy年MM月dd日', { locale: ja });
                const endDate = format(new Date(schedule.periodEndDate), 'yyyy年MM月dd日', { locale: ja });
                return `${startDate} - ${endDate}`;
              } else if (schedule.scheduleType === 'recurring') {
                const startDate = format(new Date(schedule.date), 'yyyy年MM月dd日', { locale: ja });
                const endDate = format(new Date(schedule.recurringEndDate), 'yyyy年MM月dd日', { locale: ja });
                return `${startDate} - ${endDate}`;
              } else {
                return format(new Date(schedule.date), 'yyyy年MM月dd日 HH:mm', { locale: ja });
              }
            };

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
              <div key={schedule.id} className="schedule-item">
                <div className="schedule-content">
                  <h3>{schedule.title}</h3>
                  {getScheduleTypeLabel() && (
                    <p className="schedule-type">{getScheduleTypeLabel()}</p>
                  )}
                  <p className="schedule-description">{schedule.description}</p>
                  <div className="schedule-meta">
                    <span className="schedule-date">
                      {getScheduleDateDisplay()}
                    </span>
                    <span className="schedule-time">
                      {getScheduleTimeDisplay()}
                    </span>
                    {schedule.location && (
                      <span className="schedule-location">📍 {schedule.location}</span>
                    )}
                  </div>
                </div>
                <div className="schedule-actions">
                  <Link to={`/edit/${schedule.id}`} className="edit-button">
                    <Edit size={16} />
                  </Link>
                  <button 
                    onClick={() => deleteSchedule(schedule.id)}
                    className="delete-button"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ScheduleList;
