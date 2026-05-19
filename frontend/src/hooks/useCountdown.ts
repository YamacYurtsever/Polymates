import { useEffect, useState } from 'react'

export function useCountdown(target: string): string | null {
  const [remaining, setRemaining] = useState(() => new Date(target).getTime() - Date.now())

  useEffect(() => {
    const id = setInterval(() => {
      setRemaining(new Date(target).getTime() - Date.now())
    }, 1000)
    return () => clearInterval(id)
  }, [target])

  if (remaining <= 0) return null

  const totalSeconds = Math.floor(remaining / 1000)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (days > 0) return `${days}d ${hours}h ${minutes}m`
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`
  return `${minutes}m ${seconds}s`
}
