import { months, weekDays } from '../utils/date'

export default function CalendarGrid({ days, details, selectedYear, selectedMonth, onDayClick }) {
  return (
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
                  onClick={() => day && onDayClick(String(day))}
                >
                  {day && (
                    <div>
                      <div style={{ fontWeight: "bold", color: "#000", fontSize: "1.2rem" }}>{day}</div>
                      {details[selectedYear]?.[selectedMonth]?.[String(day)]?.length > 0 &&
                        details[selectedYear][selectedMonth][String(day)].map((d, idx) => (
                          <div key={idx} style={{ fontSize: "0.9rem", color: "#555", marginTop: 4, borderBottom: "1px solid #eee" }}>
                            🕒{d.start}〜{d.end} <br />
                            {d.content}
                          </div>
                        ))}
                    </div>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
} 