export function formatDate(input: string | Date, pattern: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD'): string {
  const d = typeof input === 'string' ? new Date(input) : input
  if (isNaN(d.getTime())) return ''
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = String(d.getFullYear())

  switch (pattern) {
    case 'DD/MM/YYYY':
      return `${dd}/${mm}/${yyyy}`
    case 'MM/DD/YYYY':
      return `${mm}/${dd}/${yyyy}`
    case 'YYYY-MM-DD':
      return `${yyyy}-${mm}-${dd}`
    default:
      return `${dd}/${mm}/${yyyy}`
  }
}
