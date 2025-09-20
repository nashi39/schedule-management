export const months = [
  "1月", "2月", "3月", "4月", "5月", "6月",
  "7月", "8月", "9月", "10月", "11月", "12月"
]

export const weekDays = ["日", "月", "火", "水", "木", "金", "土"]

const baseDaysInMonth = [31,28,31,30,31,30,31,31,30,31,30,31]

function isLeapYear(year) {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0)
}

function getDaysInMonth(year, monthIndex0) {
  if (monthIndex0 === 1) {
    return isLeapYear(year) ? 29 : 28
  }
  return baseDaysInMonth[monthIndex0]
}

export function getDaysInMonthArray(year) {
  return Array.from({ length: 12 }, (_, m) => getDaysInMonth(year, m))
}

export function getFirstDayOfWeek(year) {
  return Array.from({ length: 12 }, (_, m) => new Date(year, m, 1).getDay())
}

export const currentYear = new Date().getFullYear()

export const years = Array.from({ length: 201 }, (_, i) => currentYear - 100 + i) 