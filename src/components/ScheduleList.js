import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Edit, Trash2, Plus } from 'lucide-react';
import { format } from 'date-fns';
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

  const getFilteredSchedules = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (filter) {
      case 'today':
        return schedules.filter(schedule => {
          const scheduleDate = new Date(schedule.date);
          return scheduleDate.toDateString() === today.toDateString();
        });
      case 'upcoming':
        return schedules.filter(schedule => {
          const scheduleDate = new Date(schedule.date);
          return scheduleDate >= today;
        });
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
          filteredSchedules.map(schedule => (
            <div key={schedule.id} className="schedule-item">
              <div className="schedule-content">
                <h3>{schedule.title}</h3>
                <p className="schedule-description">{schedule.description}</p>
                <div className="schedule-meta">
                  <span className="schedule-date">
                    {format(new Date(schedule.date), 'yyyy年MM月dd日 HH:mm', { locale: ja })}
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
          ))
        )}
      </div>
    </div>
  );
};

export default ScheduleList;
