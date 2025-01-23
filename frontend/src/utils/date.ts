export function calculateDaysRemaining(targetDate: string, startDate: string): number {
    const target = new Date(targetDate)
    const start = new Date(startDate)
    const diffTime = target.getTime() - start.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }
  
  export function formatDate(date: string): string {
    if (/^\d{8}$/.test(date)) {
      const year = date.slice(0, 4);
      const month = date.slice(4, 6);
      const day = date.slice(6, 8);
      date = `${year}/${month}/${day}`; // YYYY/MM/DD 형식으로 변환
  }
    return new Date(date).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).replace(/\. /g, '.').slice(0, -1)
  }
