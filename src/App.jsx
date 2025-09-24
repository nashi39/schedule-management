import { useState, useEffect } from 'react'
import './App.css'
import CalendarGrid from './components/CalendarGrid'
import DayModal from './components/DayModal'
import RangeModal from './components/RangeModal'
import NotificationSettings from './components/NotificationSettings'
import { months, years, getFirstDayOfWeek, getDaysInMonthArray } from './utils/date'
import { useLocalStorageJson } from './hooks/useLocalStorage'
import { useNotification } from './hooks/useNotification'

function App() {
  // 今日の日付を取得
  const today = new Date()
  const todayYear = today.getFullYear()
  const todayMonth = today.getMonth() // 0-based
  const todayDay = today.getDate()
  
  const [selectedYear, setSelectedYear] = useState(todayYear)
  const [selectedMonth, setSelectedMonth] = useState(todayMonth)
  const [modal, setModal] = useState({ open: false, day: null })

  // うるう年対応
  const daysInMonthLeap = getDaysInMonthArray(selectedYear)

  // 詳細予定の保存（複数予定対応）
  const { value: details, setValue: setDetails } = useLocalStorageJson('calendar-details', {})
  
  // 通知機能
  const { 
    permission, 
    isEnabled, 
    setIsEnabled, 
    requestPermission, 
    scheduleNotification, 
    cancelNotification 
  } = useNotification()
  
  // 通知設定をlocalStorageに保存
  const { value: notificationSettings, setValue: setNotificationSettings } = useLocalStorageJson('notification-settings', { enabled: false })
  
  // 通知設定の同期
  useEffect(() => {
    setIsEnabled(notificationSettings.enabled)
  }, [notificationSettings.enabled, setIsEnabled])
  
  // Service Worker登録（最新に自動更新・不整合時は再読み込み）
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    const swUrl = '/sw.js'
    let didReload = false
    navigator.serviceWorker.register(swUrl, { scope: '/' })
      .then(reg => {
        // デプロイ直後に古いSWが残っていると白画面になることがあるため、積極的に更新
        try { reg.update() } catch {}
        // 新しいSWが有効化されたら一度だけリロード
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (didReload) return
          didReload = true
          window.location.reload()
        })
      })
      .catch(err => {
        console.log('Service Worker registration failed:', err)
      })
  }, [])

  // 通知設定の保存
  const handleNotificationToggle = async (enabled) => {
    if (enabled) {
      const granted = await requestPermission()
      if (granted) {
        setNotificationSettings({ enabled: true })
      }
    } else {
      setNotificationSettings({ enabled: false })
    }
  }

  // 新規入力用
  const [inputDetail, setInputDetail] = useState({ start: '', end: '', content: '' })

  // 複数日一括追加用モーダル
  const [rangeModal, setRangeModal] = useState(false)
  const [rangeInput, setRangeInput] = useState({
    startMonth: selectedMonth + 1,
    startDay: 1,
    endMonth: selectedMonth + 1,
    endDay: 1,
    start: '',
    end: '',
    content: ''
  })

  // 月に応じた日数（1始まりの月番号を受ける）
  const getDaysIn = (m1to12) => {
    return daysInMonthLeap[m1to12 - 1]
  }

  // 同一年内の範囲登録
  const handleRangeAdd = () => {
    const { startMonth, startDay, endMonth, endDay, start, end, content } = rangeInput
    if (!content || !start || !end) return
    // 日付妥当化
    const sM = Number(startMonth), sD = Number(startDay)
    const eM = Number(endMonth), eD = Number(endDay)
    if (!sM || !eM || !sD || !eD) return
    const startDate = new Date(selectedYear, sM - 1, sD)
    const endDate = new Date(selectedYear, eM - 1, eD)
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return

    // start > end のときは入れ替え
    const from = startDate <= endDate ? startDate : endDate
    const to = startDate <= endDate ? endDate : startDate

    setDetails(prev => {
      const newDetails = { ...prev }
      if (!newDetails[selectedYear]) newDetails[selectedYear] = {}

      // 1日ずつ追加
      for (let d = new Date(from); d.getTime() <= to.getTime(); d.setDate(d.getDate() + 1)) {
        const m = d.getMonth() // 0-based
        const dayKey = String(d.getDate())
        if (!newDetails[selectedYear][m]) newDetails[selectedYear][m] = {}
        if (!newDetails[selectedYear][m][dayKey]) newDetails[selectedYear][m][dayKey] = []
        newDetails[selectedYear][m][dayKey] = [
          ...newDetails[selectedYear][m][dayKey],
          { start, end, content }
        ]
        
        // 各日に通知を設定
        scheduleNotification(selectedYear, m, dayKey, start, content)
      }
      return newDetails
    })

    // 入力リセット＆クローズ
    setRangeInput({
      startMonth: selectedMonth + 1,
      startDay: 1,
      endMonth: selectedMonth + 1,
      endDay: 1,
      start: '',
      end: '',
      content: ''
    })
    setRangeModal(false)
  }

  // モーダルを開くときに入力欄をリセット
  const openModal = (day) => {
    setModal({ open: true, day: String(day) })
    setInputDetail({ start: '', end: '', content: '' })
  }

  // 予定追加
  const handleDetailAdd = (year, month, day, start, end, content) => {
    if (!start || !end || !content) return
    setDetails(prev => {
      const newDetails = { ...prev }
      if (!newDetails[year]) newDetails[year] = {}
      if (!newDetails[year][month]) newDetails[year][month] = {}
      // 予定追加
      if (!newDetails[year][month][String(day)]) newDetails[year][month][String(day)] = []
      newDetails[year][month][String(day)] = [
        ...newDetails[year][month][String(day)],
        { start, end, content }
      ]
      return newDetails
    })
    
    // 通知を設定
    scheduleNotification(year, month, day, start, content)
    
    setInputDetail({ start: '', end: '', content: '' }) // 入力欄リセット
  }

  // 予定削除
  const handleDetailDelete = (year, month, day, idx) => {
    setDetails(prev => {
      const newDetails = { ...prev }
      // 削除する予定の情報を取得
      const deletedItem = newDetails[year]?.[month]?.[String(day)]?.[idx]
      
      // 予定削除
      if (
        newDetails[year] &&
        newDetails[year][month] &&
        newDetails[year][month][String(day)]
      ) {
        newDetails[year][month][String(day)] = newDetails[year][month][String(day)].filter((_, i) => i !== idx)
      }
      
      // 通知をキャンセル
      if (deletedItem) {
        cancelNotification(year, month, day, deletedItem.start, deletedItem.content)
      }
      
      return newDetails
    })
  }

  // カレンダー配列生成
  const days = []
  const firstDayOfWeek = getFirstDayOfWeek(selectedYear)
  const firstDay = firstDayOfWeek[selectedMonth]
  const totalDays = daysInMonthLeap[selectedMonth]
  let week = Array(firstDay).fill(null)

  for (let day = 1; day <= totalDays; day++) {
    week.push(day)
    if (week.length === 7 || day === totalDays) {
      days.push(week)
      week = []
    }
  }
  if (week.length > 0 && week.length < 7) {
    while (week.length < 7) week.push(null)
    days.push(week)
  }

  return (
    <>
      <div style={{ display: 'flex', gap: 24, alignItems: 'center', marginBottom: 24, fontSize: "1.5rem" }}>
        <select value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))} style={{ fontSize: "1.2rem", padding: "6px 12px" }}>
          {years.map(y => (
            <option key={y} value={y}>{y}年</option>
          ))}
        </select>
        <h2 style={{ margin: 0, fontSize: "2rem" }}>{months[selectedMonth]}カレンダー</h2>
        <div style={{ marginLeft: 'auto', fontSize: "1.1rem", color: "#fff" }}>
          今日: {todayYear}年{months[todayMonth]}{todayDay}日
        </div>
      </div>
      
      {/* 通知設定 */}
      <NotificationSettings
        permission={permission}
        isEnabled={isEnabled}
        setIsEnabled={handleNotificationToggle}
        requestPermission={requestPermission}
      />
      
      {/* 月選択タブ */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
        {months.map((month, idx) => (
          <button
            key={month}
            onClick={() => setSelectedMonth(idx)}
            style={{
              padding: '10px 20px',
              background: selectedMonth === idx ? '#6970fcff' : '#f0f0f0',
              color: selectedMonth === idx ? '#fff' : '#333',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: "1.1rem"
            }}
          >
            {month}
          </button>
        ))}
      </div>

      {/* 新規予定ボタン */}
      <div style={{ marginBottom: 16 }}>
        <button
          onClick={() => {
            setRangeInput({
              startMonth: selectedMonth + 1,
              startDay: 1,
              endMonth: selectedMonth + 1,
              endDay: 1,
              start: '',
              end: '',
              content: ''
            })
            setRangeModal(true)
          }}
          style={{ padding: '8px 16px', background: '#4caf50', color: '#fff', border: 'none', borderRadius: 6, fontSize: '1.05rem', cursor: 'pointer' }}
        >
          新規予定を追加
        </button>
      </div>
      {/* カレンダー表示 */}
      <CalendarGrid
        days={days}
        details={details}
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
        onDayClick={openModal}
      />
      {/* モーダル */}
      <DayModal
        open={modal.open}
        onClose={() => setModal({ open: false, day: null })}
        title={`${selectedYear}年${months[selectedMonth]}${modal.day}日の予定`}
        items={details[selectedYear]?.[selectedMonth]?.[modal.day] || []}
        onDelete={(idx) => handleDetailDelete(selectedYear, selectedMonth, modal.day, idx)}
        allowAdd={true}
        inputValue={inputDetail}
        onInputChange={setInputDetail}
        onAdd={() => handleDetailAdd(
          selectedYear,
          selectedMonth,
          modal.day,
          inputDetail.start,
          inputDetail.end,
          inputDetail.content
        )}
      />
      {/* 複数日一括追加モーダル */}
      <RangeModal
        open={rangeModal}
        onClose={() => setRangeModal(false)}
        value={rangeInput}
        setValue={setRangeInput}
        getDaysIn={(m) => daysInMonthLeap[m - 1]}
        onSubmit={handleRangeAdd}
        year={selectedYear}
      />
    </>
  )
}

export default App