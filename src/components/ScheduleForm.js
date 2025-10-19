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
    priority: 'medium',
    scheduleType: 'single', // single, recurring, period
    recurringType: 'daily', // daily, weekly, monthly, yearly
    recurringInterval: 1, // 繰り返し間隔（1日おき、2週間おきなど）
    recurringEndDate: '', // 繰り返し終了日
    periodStartDate: '', // 期間開始日
    periodEndDate: '', // 期間終了日
    periodStartTime: '', // 期間開始時間
    periodEndTime: '' // 期間終了時間
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
            priority: schedule.priority || 'medium',
            scheduleType: schedule.scheduleType || 'single',
            recurringType: schedule.recurringType || 'daily',
            recurringInterval: schedule.recurringInterval || 1,
            recurringEndDate: schedule.recurringEndDate || '',
            periodStartDate: schedule.periodStartDate || '',
            periodEndDate: schedule.periodEndDate || '',
            periodStartTime: schedule.periodStartTime || '',
            periodEndTime: schedule.periodEndTime || ''
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

    // スケジュールタイプに応じたバリデーション
    if (formData.scheduleType === 'single') {
      if (!formData.date) {
        newErrors.date = '日付は必須です';
      }
      if (!formData.time) {
        newErrors.time = '時間は必須です';
      }
    } else if (formData.scheduleType === 'recurring') {
      if (!formData.date) {
        newErrors.date = '開始日は必須です';
      }
      if (!formData.time) {
        newErrors.time = '時間は必須です';
      }
      if (!formData.recurringEndDate) {
        newErrors.recurringEndDate = '繰り返し終了日は必須です';
      }
      if (formData.recurringInterval < 1) {
        newErrors.recurringInterval = '繰り返し間隔は1以上である必要があります';
      }
    } else if (formData.scheduleType === 'period') {
      if (!formData.periodStartDate) {
        newErrors.periodStartDate = '開始日は必須です';
      }
      if (!formData.periodEndDate) {
        newErrors.periodEndDate = '終了日は必須です';
      }
      if (!formData.periodStartTime) {
        newErrors.periodStartTime = '開始時間は必須です';
      }
      if (!formData.periodEndTime) {
        newErrors.periodEndTime = '終了時間は必須です';
      }
      // 期間の妥当性チェック
      if (formData.periodStartDate && formData.periodEndDate) {
        const startDate = new Date(formData.periodStartDate);
        const endDate = new Date(formData.periodEndDate);
        if (startDate >= endDate) {
          newErrors.periodEndDate = '終了日は開始日より後である必要があります';
        }
      }
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
      date: formData.scheduleType === 'period' ? 
        `${formData.periodStartDate}T${formData.periodStartTime}` : 
        `${formData.date}T${formData.time}`,
      location: formData.location.trim(),
      priority: formData.priority,
      scheduleType: formData.scheduleType,
      recurringType: formData.recurringType,
      recurringInterval: formData.recurringInterval,
      recurringEndDate: formData.recurringEndDate,
      periodStartDate: formData.periodStartDate,
      periodEndDate: formData.periodEndDate,
      periodStartTime: formData.periodStartTime,
      periodEndTime: formData.periodEndTime,
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
          <label htmlFor="scheduleType">スケジュールタイプ</label>
          <select
            id="scheduleType"
            name="scheduleType"
            value={formData.scheduleType}
            onChange={handleChange}
          >
            <option value="single">単発</option>
            <option value="recurring">繰り返し</option>
            <option value="period">期間指定</option>
          </select>
        </div>

        {/* 繰り返しスケジュール設定 */}
        {formData.scheduleType === 'recurring' && (
          <>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="recurringType">繰り返しタイプ</label>
                <select
                  id="recurringType"
                  name="recurringType"
                  value={formData.recurringType}
                  onChange={handleChange}
                >
                  <option value="daily">日次</option>
                  <option value="weekly">週次</option>
                  <option value="monthly">月次</option>
                  <option value="yearly">年次</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="recurringInterval">繰り返し間隔</label>
                <input
                  type="number"
                  id="recurringInterval"
                  name="recurringInterval"
                  value={formData.recurringInterval}
                  onChange={handleChange}
                  min="1"
                  className={errors.recurringInterval ? 'error' : ''}
                />
                {errors.recurringInterval && <span className="error-message">{errors.recurringInterval}</span>}
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="recurringEndDate">繰り返し終了日 *</label>
              <input
                type="date"
                id="recurringEndDate"
                name="recurringEndDate"
                value={formData.recurringEndDate}
                onChange={handleChange}
                className={errors.recurringEndDate ? 'error' : ''}
              />
              {errors.recurringEndDate && <span className="error-message">{errors.recurringEndDate}</span>}
            </div>
          </>
        )}

        {/* 期間指定スケジュール設定 */}
        {formData.scheduleType === 'period' && (
          <>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="periodStartDate">開始日 *</label>
                <input
                  type="date"
                  id="periodStartDate"
                  name="periodStartDate"
                  value={formData.periodStartDate}
                  onChange={handleChange}
                  className={errors.periodStartDate ? 'error' : ''}
                />
                {errors.periodStartDate && <span className="error-message">{errors.periodStartDate}</span>}
              </div>
              <div className="form-group">
                <label htmlFor="periodEndDate">終了日 *</label>
                <input
                  type="date"
                  id="periodEndDate"
                  name="periodEndDate"
                  value={formData.periodEndDate}
                  onChange={handleChange}
                  className={errors.periodEndDate ? 'error' : ''}
                />
                {errors.periodEndDate && <span className="error-message">{errors.periodEndDate}</span>}
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="periodStartTime">開始時間 *</label>
                <input
                  type="time"
                  id="periodStartTime"
                  name="periodStartTime"
                  value={formData.periodStartTime}
                  onChange={handleChange}
                  className={errors.periodStartTime ? 'error' : ''}
                />
                {errors.periodStartTime && <span className="error-message">{errors.periodStartTime}</span>}
              </div>
              <div className="form-group">
                <label htmlFor="periodEndTime">終了時間 *</label>
                <input
                  type="time"
                  id="periodEndTime"
                  name="periodEndTime"
                  value={formData.periodEndTime}
                  onChange={handleChange}
                  className={errors.periodEndTime ? 'error' : ''}
                />
                {errors.periodEndTime && <span className="error-message">{errors.periodEndTime}</span>}
              </div>
            </div>
          </>
        )}

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
