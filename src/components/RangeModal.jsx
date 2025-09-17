import { months } from '../utils/date'

export default function RangeModal({ open, onClose, value, setValue, getDaysIn, onSubmit, year }) {
  if (!open) return null
  return (
    <div style={{
      position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
      background: "rgba(0,0,0,0.3)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000
    }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#fff", padding: 32, borderRadius: 12, minWidth: 380, boxShadow: "0 2px 8px #0002"
        }}
        onClick={e => e.stopPropagation()}
      >
        <h3 style={{ marginTop: 0 }}>{year}年の予定を追加</h3>

        <div style={{ marginBottom: 12, fontWeight: "bold", color: "#000" }}>期間</div>
        <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16 }}>
          <div>
            <label>開始：</label>
            <select
              value={value.startMonth}
              onChange={e => {
                const m = Number(e.target.value)
                setValue(v => ({ ...v, startMonth: m, startDay: Math.min(v.startDay, getDaysIn(m)) }))
              }}
              style={{ marginLeft: 6, marginRight: 6 }}
            >
              {months.map((m, i) => <option key={m} value={i + 1}>{i + 1}月</option>)}
            </select>
            <select
              value={value.startDay}
              onChange={e => setValue(v => ({ ...v, startDay: Number(e.target.value) }))}
            >
              {Array.from({ length: getDaysIn(value.startMonth) }, (_, i) => i + 1).map(d =>
                <option key={d} value={d}>{d}日</option>
              )}
            </select>
          </div>

          <div>〜</div>

          <div>
            <label>終了：</label>
            <select
              value={value.endMonth}
              onChange={e => {
                const m = Number(e.target.value)
                setValue(v => ({ ...v, endMonth: m, endDay: Math.min(v.endDay, getDaysIn(m)) }))
              }}
              style={{ marginLeft: 6, marginRight: 6 }}
            >
              {months.map((m, i) => <option key={m} value={i + 1}>{i + 1}月</option>)}
            </select>
            <select
              value={value.endDay}
              onChange={e => setValue(v => ({ ...v, endDay: Number(e.target.value) }))}
            >
              {Array.from({ length: getDaysIn(value.endMonth) }, (_, i) => i + 1).map(d =>
                <option key={d} value={d}>{d}日</option>
              )}
            </select>
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ marginBottom: 8, fontWeight: "bold", color: "#000" }}>時刻</div>
          <label style={{ display: "inline-block", width: "90px" }}>
            開始時刻：
            <input
              type="time"
              value={value.start}
              onChange={e => setValue(v => ({ ...v, start: e.target.value }))}
              style={{ fontSize: "1.1rem", marginLeft: 8, marginRight: 16 }}
            />
          </label>
          <label style={{ display: "inline-block", width: "90px" }}>
            終了時刻：
            <input
              type="time"
              value={value.end}
              onChange={e => setValue(v => ({ ...v, end: e.target.value }))}
              style={{ fontSize: "1.1rem", marginLeft: 8 }}
            />
          </label>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label>
            予定：
            <input
              type="text"
              value={value.content}
              onChange={e => setValue(v => ({ ...v, content: e.target.value }))}
              style={{ fontSize: "1.1rem", marginLeft: 8, width: "80%" }}
              placeholder="例：出張、入院 など"
            />
          </label>
        </div>

        <div style={{ textAlign: "right" }}>
          <button
            onClick={onSubmit}
            style={{ fontSize: "1.1rem", padding: "6px 16px", background: "#4caf50", color: "#fff", border: "none", borderRadius: 6, marginRight: 8 }}
          >追加</button>
          <button
            onClick={onClose}
            style={{ fontSize: "1.1rem", padding: "6px 16px" }}
          >閉じる</button>
        </div>
      </div>
    </div>
  )
} 