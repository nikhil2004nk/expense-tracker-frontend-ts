/**
 * Format a date as relative time (e.g., "1 min ago", "2 hrs ago")
 * @param date - Date string or Date object
 * @returns Formatted relative time string
 */
export function timeAgo(date: string | Date): string {
  const now = new Date()
  
  // Handle backend format "YYYY-MM-DD HH:mm:ss" and treat as UTC
  let past: Date
  if (typeof date === 'string' && date.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)) {
    // Convert "YYYY-MM-DD HH:mm:ss" to ISO format and treat as UTC
    const isoString = date.replace(' ', 'T') + 'Z'
    past = new Date(isoString)
  } else {
    past = new Date(date)
  }
  
  const diffInMs = now.getTime() - past.getTime()
  const diffInSeconds = Math.floor(diffInMs / 1000)

  // Less than a minute
  if (diffInSeconds < 60) {
    return diffInSeconds <= 1 ? '1 sec ago' : `${diffInSeconds} secs ago`
  }

  // Less than an hour
  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) {
    return diffInMinutes === 1 ? '1 min ago' : `${diffInMinutes} mins ago`
  }

  // Less than a day
  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) {
    return diffInHours === 1 ? '1 hr ago' : `${diffInHours} hrs ago`
  }

  // Less than a week
  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) {
    return diffInDays === 1 ? '1 day ago' : `${diffInDays} days ago`
  }

  // Less than a month (30 days)
  const diffInWeeks = Math.floor(diffInDays / 7)
  if (diffInDays < 30) {
    return diffInWeeks === 1 ? '1 week ago' : `${diffInWeeks} weeks ago`
  }

  // Less than a year
  const diffInMonths = Math.floor(diffInDays / 30)
  if (diffInDays < 365) {
    return diffInMonths === 1 ? '1 month ago' : `${diffInMonths} months ago`
  }

  // More than a year
  const diffInYears = Math.floor(diffInDays / 365)
  return diffInYears === 1 ? '1 year ago' : `${diffInYears} years ago`
}

