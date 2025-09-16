import { useState } from 'react'
import './App.css'

const months = [
  "1月", "2月", "3月", "4月", "5月", "6月",
  "7月", "8月", "9月", "10月", "11月", "12月"
]
const daysInMonth = [31,28,31,30,31,30,31,31,30,31,30,31]
const weekDays = ["日", "月", "火", "水", "木", "金", "土"]

// 年リスト（1925年～2125年）
const currentYear = 2025
const years = Array.from({ length: 201 }, (_, i) => currentYear - 100 + i)

// 各月の1日が何曜日かを計算
function getFirstDayOfWeek(year) {
  return Array.from({ length: 12 }, (_, m) => {
    return new Date(year, m, 1).getDay()
  })
}

function isLeapYear(year) {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0)
}

function App() {
  const [selectedYear, setSelectedYear] = useState(currentYear)
  const [selectedMonth, setSelectedMonth] = useState(0)
  const [modal, setModal] = useState({ open: false, day: null })

  // うるう年対応
  const daysInMonthLeap = [...daysInMonth]
  if (isLeapYear(selectedYear)) daysInMonthLeap[1] = 29

  // 月×日ごとの予定を管理するstate（年・月ごとに管理）
  const [schedules, setSchedules] = useState({})

  // 入力変更時のハンドラ
  const handleChange = (year, monthIdx, dayIdx, value) => {
    setSchedules(prev => {
      const newSchedules = { ...prev }
      if (!newSchedules[year]) newSchedules[year] = Array.from({ length: 12 }, (_, m) => Array.from({ length: daysInMonthLeap[m] }, () => ""))
      // 月の日数が変わる場合（2月のうるう年など）に対応
      if (newSchedules[year][monthIdx].length !== daysInMonthLeap[monthIdx]) {
        newSchedules[year][monthIdx] = Array.from({ length: daysInMonthLeap[monthIdx] }, (_, i) => newSchedules[year][monthIdx][i] || "")
      }
      newSchedules[year][monthIdx][dayIdx] = value
      return newSchedules
    })
  }

  // 詳細予定の保存（複数予定対応）
  const [details, setDetails] = useState({}) // { [year]: { [month]: { [day]: [ { start, end, content } ] } } }

  // 新規入力用
  const [inputDetail, setInputDetail] = useState({ start: '', end: '', content: '' })

  // モーダルを開くときに入力欄をリセット
  const openModal = (day) => {
    setModal({ open: true, day })
    setInputDetail({ start: '', end: '', content: '' })
  }

  // 予定追加
  const handleDetailAdd = (year, month, day, start, end, content) => {
    if (!start || !end || !content) return
    setDetails(prev => {
      const newDetails = { ...prev }
      if (!newDetails[year]) newDetails[year] = {}
      if (!newDetails[year][month]) newDetails[year][month] = {}
      if (!newDetails[year][month][day]) newDetails[year][month][day] = []
      newDetails[year][month][day] = [
        ...newDetails[year][month][day],
        { start, end, content }
      ]
      return newDetails
    })
    setInputDetail({ start: '', end: '', content: '' }) // 入力欄リセット
  }

  // 予定削除
  const handleDetailDelete = (year, month, day, idx) => {
    setDetails(prev => {
      const newDetails = { ...prev }
      if (
        newDetails[year] &&
        newDetails[year][month] &&
        newDetails[year][month][day]
      ) {
        newDetails[year][month][day] = newDetails[year][month][day].filter((_, i) => i !== idx)
      }
      return newDetails
    })
  }

  // 保存ボタン（モーダルを閉じるだけ）
  const handleDetailSaveAndClose = () => {
    setModal({ open: false, day: null })
    setInputDetail({ start: '', end: '', content: '' })
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

  // 選択中の予定データ
  const currentSchedules =
    schedules[selectedYear]?.[selectedMonth] ||
    Array.from({ length: daysInMonthLeap[selectedMonth] }, () => "")

  // モーダル用の値
  const detailValue = modal.open && details[selectedYear]?.[selectedMonth]?.[modal.day]
    ? details[selectedYear][selectedMonth][modal.day]
    : { start: '', end: '', content: '' }

  return (
    <>
      <div style={{ display: 'flex', gap: 24, alignItems: 'center', marginBottom: 24, fontSize: "1.5rem" }}>
        <select value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))} style={{ fontSize: "1.2rem", padding: "6px 12px" }}>
          {years.map(y => (
            <option key={y} value={y}>{y}年</option>
          ))}
        </select>
        <h2 style={{ margin: 0, fontSize: "2rem" }}>{months[selectedMonth]}カレンダー</h2>
      </div>
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
      {/* カレンダー表示 */}
      <div style={{ maxWidth: 700, margin: "0 auto", maxHeight: 800, overflowY: "auto" }}>
        <table border="1" style={{ borderCollapse: 'collapse', width: '100%', fontSize: "1.2rem" }}>
          <thead>
            <tr>
              {weekDays.map((wd, i) => (
                <th
                  key={wd}
                  style={{
                    background: i === 0 ? "#ffeaea" : i === 6 ? "#eaf3ff" : "#f8f8f8",
                    color: "#000",
                    padding: "12px 0",
                    fontSize: "1.1rem"
                  }}
                >
                  {wd}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {days.map((week, wi) => (
              <tr key={wi}>
                {week.map((day, di) => (
                  <td
                    key={di}
                    style={{
                      height: 90,
                      verticalAlign: "top",
                      background: di === 0 ? "#fff6f6" : di === 6 ? "#f6faff" : "#fff",
                      padding: "8px",
                      cursor: day ? "pointer" : "default"
                    }}
                    onClick={() => day && openModal(day)}
                  >
                    {day &&
                      <div>
                        <div style={{ fontWeight: "bold", color: "#000", fontSize: "1.2rem" }}>{day}</div>
                        {/* その日の全予定を表示 */}
                        {details[selectedYear]?.[selectedMonth]?.[day]?.length > 0 &&
                          details[selectedYear][selectedMonth][day].map((d, idx) => (
                            <div key={idx} style={{ fontSize: "0.9rem", color: "#555", marginTop: 4, borderBottom: "1px solid #eee" }}>
                              🕒{d.start}〜{d.end} <br />
                              {d.content}
                            </div>
                          ))
                        }
                      </div>
                    }
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* モーダル */}
      {modal.open && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
          background: "rgba(0,0,0,0.3)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000
        }}
          onClick={() => setModal({ open: false, day: null })}
        >
          <div
            style={{
              background: "#fff", padding: 32, borderRadius: 12, minWidth: 340, boxShadow: "0 2px 8px #0002"
            }}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ marginTop: 0 }}>{selectedYear}年{months[selectedMonth]}{modal.day}日の予定</h3>
            {/* 既存の予定一覧（常に表示） */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: "bold", marginBottom: 4, color: "#000" }}>登録済みの予定</div>
              {details[selectedYear]?.[selectedMonth]?.[modal.day]?.length > 0 ? (
                details[selectedYear][selectedMonth][modal.day].map((d, idx) => (
                  <div key={idx} style={{ border: "1px solid #eee", borderRadius: 6, padding: 8, marginBottom: 6, background: "#fafaff" }}>
                    <span style={{ fontWeight: "bold" }}>🕒{d.start}〜{d.end}</span><br />
                    <span>{d.content}</span>
                    <button
                      onClick={() => handleDetailDelete(selectedYear, selectedMonth, modal.day, idx)}
                      style={{ marginLeft: 12, color: "#fff", background: "#e55", border: "none", borderRadius: 4, padding: "2px 8px", cursor: "pointer", fontSize: "0.95rem" }}
                    >削除</button>
                  </div>
                ))
              ) : (
                <div style={{ color: "#888" }}>予定はありません</div>
              )}
            </div>
            {/* 新規追加欄 */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ marginBottom: 8, fontWeight: "bold", color: "#000" }}>
                開始時刻・終了時刻を設定してください
              </div>
              <label style={{ display: "inline-block", width: "90px" }}>
                開始時刻：
                <input
                  type="time"
                  value={inputDetail.start}
                  onChange={e => setInputDetail(detail => ({ ...detail, start: e.target.value }))}
                  style={{ fontSize: "1.1rem", marginLeft: 8, marginRight: 16 }}
                />
              </label>
              <label style={{ display: "inline-block", width: "90px" }}>
                終了時刻：
                <input
                  type="time"
                  value={inputDetail.end}
                  onChange={e => setInputDetail(detail => ({ ...detail, end: e.target.value }))}
                  style={{ fontSize: "1.1rem", marginLeft: 8 }}
                />
              </label>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label>
                予定：
                <input
                  type="text"
                  value={inputDetail.content}
                  onChange={e => setInputDetail(detail => ({ ...detail, content: e.target.value }))}
                  style={{ fontSize: "1.1rem", marginLeft: 8, width: "80%" }}
                  placeholder="例：会議、通院 など"
                />
              </label>
              <button
                onClick={() => handleDetailAdd(selectedYear, selectedMonth, modal.day, inputDetail.start, inputDetail.end, inputDetail.content)}
                style={{ fontSize: "1.1rem", padding: "6px 16px", background: "#4caf50", color: "#fff", border: "none", borderRadius: 6, marginLeft: 12 }}
              >追加</button>
            </div>
            <div style={{ textAlign: "right" }}>
              <button
                onClick={handleDetailSaveAndClose}
                style={{ fontSize: "1.1rem", padding: "6px 16px", marginRight: 12 }}
              >保存</button>
              <button
                onClick={() => setModal({ open: false, day: null })}
                style={{ fontSize: "1.1rem", padding: "6px 16px" }}
              >閉じる</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default App