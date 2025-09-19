export default function DayModal({ open, onClose, title, items, onDelete, allowAdd = false, inputValue, onInputChange, onAdd }) {
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
          background: "#fff", padding: 32, borderRadius: 12, minWidth: 340, boxShadow: "0 2px 8px #0002"
        }}
        onClick={e => e.stopPropagation()}
      >
        <h3 style={{ marginTop: 0 }}>{title}</h3>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: "bold", marginBottom: 4, color: "#000" }}>登録済みの予定</div>
          {items && items.length > 0 ? (
            items.map((d, idx) => (
              <div
                key={idx}
                style={{
                  border: "1px solid #eee",
                  borderRadius: 6,
                  padding: 8,
                  marginBottom: 6,
                  background: "#fafaff",
                  color: "#000"
                }}
              >
                <span style={{ fontWeight: "bold" }}>🕒{d.start}〜{d.end}</span><br />
                <span>{d.content}</span>
                <button
                  onClick={() => onDelete(idx)}
                  style={{
                    marginLeft: 12,
                    color: "#fff",
                    background: "#e55",
                    border: "none",
                    borderRadius: 4,
                    padding: "2px 8px",
                    cursor: "pointer",
                    fontSize: "0.95rem"
                  }}
                >削除</button>
              </div>
            ))
          ) : (
            <div style={{ color: "#888" }}>予定はありません</div>
          )}
        </div>
        {allowAdd && (
          <>
            <div style={{ marginBottom: 16 }}>
              <div style={{ marginBottom: 8, fontWeight: "bold", color: "#000" }}>新規予定を追加</div>
              <label style={{ display: "inline-block", width: "90px" }}>
                開始時刻：
                <input
                  type="time"
                  value={inputValue?.start || ''}
                  onChange={e => onInputChange({ ...inputValue, start: e.target.value })}
                  style={{ fontSize: "1.1rem", marginLeft: 8, marginRight: 16 }}
                />
              </label>
              <label style={{ display: "inline-block", width: "90px" }}>
                終了時刻：
                <input
                  type="time"
                  value={inputValue?.end || ''}
                  onChange={e => onInputChange({ ...inputValue, end: e.target.value })}
                  style={{ fontSize: "1.1rem", marginLeft: 8 }}
                />
              </label>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label>
                予定：
                <input
                  type="text"
                  value={inputValue?.content || ''}
                  onChange={e => onInputChange({ ...inputValue, content: e.target.value })}
                  style={{ fontSize: "1.1rem", marginLeft: 8, width: "80%" }}
                  placeholder="例：会議、通院 など"
                />
              </label>
              <button
                type="button"
                onClick={onAdd}
                style={{ fontSize: "1.1rem", padding: "6px 16px", background: "#4caf50", color: "#fff", border: "none", borderRadius: 6, marginLeft: 12 }}
              >追加</button>
            </div>
          </>
        )}
        <div style={{ textAlign: "right" }}>
          <button
            onClick={onClose}
            style={{ fontSize: "1.1rem", padding: "6px 16px" }}
          >閉じる</button>
        </div>
      </div>
    </div>
  )
} 