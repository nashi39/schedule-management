import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, ArrowLeft } from 'lucide-react';
import './ScheduleForm.css';
import { getOneSignalUserId } from '../config/onesignal';
import { schedulePushNotification } from '../utils/onesignalApi';

const ScheduleForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    priority: 'medium'
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isEdit) {
      // 編集モードの場合、既存のスケジュールを読み込み
      const savedSchedules = localStorage.getItem('schedules');
      if (savedSchedules) {
        const schedules = JSON.parse(savedSchedules);
        const schedule = schedules.find(s => s.id === id);
        if (schedule) {
          const [date, time] = schedule.date.split('T');
          setFormData({
            title: schedule.title,
            description: schedule.description,
            date: date,
            time: time,
            location: schedule.location || '',
            priority: schedule.priority || 'medium'
          });
        }
      }
    } else {
      // 新規作成の場合、デフォルト値を設定
      const now = new Date();
      const defaultDate = now.toISOString().split('T')[0];
      const defaultTime = now.toTimeString().split(' ')[0].substring(0, 5);
      
      setFormData(prev => ({
        ...prev,
        date: defaultDate,
        time: defaultTime
      }));
    }
  }, [id, isEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // エラーをクリア
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'タイトルは必須です';
    }

    if (!formData.date) {
      newErrors.date = '日付は必須です';
    }

    if (!formData.time) {
      newErrors.time = '時間は必須です';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const scheduleData = {
      id: isEdit ? id : Date.now().toString(),
      title: formData.title.trim(),
      description: formData.description.trim(),
      date: `${formData.date}T${formData.time}`,
      location: formData.location.trim(),
      priority: formData.priority,
      createdAt: isEdit ? undefined : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const savedSchedules = localStorage.getItem('schedules');
    let schedules = savedSchedules ? JSON.parse(savedSchedules) : [];

    if (isEdit) {
      schedules = schedules.map(schedule => 
        schedule.id === id ? scheduleData : schedule
      );
    } else {
      schedules.push(scheduleData);
    }

    localStorage.setItem('schedules', JSON.stringify(schedules));

    // 予約通知をサーバー経由で作成（失敗しても保存は継続）
    try {
      const subscriptionId = await getOneSignalUserId();
      const sendAfter = new Date(scheduleData.date);
      const now = new Date();
      if (subscriptionId && !Number.isNaN(sendAfter.getTime()) && sendAfter > now) {
        const bodyParts = [];
        if (scheduleData.description) bodyParts.push(scheduleData.description);
        if (scheduleData.location) bodyParts.push(`場所: ${scheduleData.location}`);
        await schedulePushNotification({
          subscriptionId,
          title: scheduleData.title || 'スケジュール',
          message: bodyParts.join('\n') || 'スケジュールの時間になりました',
          sendAfterISO: sendAfter.toISOString(),
        });
      }
    } catch (err) {
      // コンソールにのみ記録し、UXを阻害しない
      // eslint-disable-next-line no-console
      console.warn('予約通知の作成に失敗:', err);
    }

    navigate('/');
  };

  return (
    <div className="schedule-form">
      <div className="form-header">
        <button 
          onClick={() => navigate('/')}
          className="back-button"
        >
          <ArrowLeft size={20} />
          戻る
        </button>
        <h2>{isEdit ? 'スケジュール編集' : '新規スケジュール作成'}</h2>
      </div>

      <form onSubmit={handleSubmit} className="form">
        <div className="form-group">
          <label htmlFor="title">タイトル *</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className={errors.title ? 'error' : ''}
            placeholder="スケジュールのタイトルを入力"
          />
          {errors.title && <span className="error-message">{errors.title}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="description">説明</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="4"
            placeholder="詳細な説明を入力（任意）"
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="date">日付 *</label>
            <input
              type="date"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className={errors.date ? 'error' : ''}
            />
            {errors.date && <span className="error-message">{errors.date}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="time">時間 *</label>
            <input
              type="time"
              id="time"
              name="time"
              value={formData.time}
              onChange={handleChange}
              className={errors.time ? 'error' : ''}
            />
            {errors.time && <span className="error-message">{errors.time}</span>}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="location">場所</label>
          <input
            type="text"
            id="location"
            name="location"
            value={formData.location}
            onChange={handleChange}
            placeholder="会議室、住所など（任意）"
          />
        </div>

        <div className="form-group">
          <label htmlFor="priority">優先度</label>
          <select
            id="priority"
            name="priority"
            value={formData.priority}
            onChange={handleChange}
          >
            <option value="low">低</option>
            <option value="medium">中</option>
            <option value="high">高</option>
          </select>
        </div>

        <div className="form-actions">
          <button type="submit" className="save-button">
            <Save size={20} />
            {isEdit ? '更新' : '保存'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ScheduleForm;
