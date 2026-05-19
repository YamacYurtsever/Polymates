import { useEffect, useState } from 'react'

export interface CountdownState {
  text: string
  urgent: boolean
}

export function useCountdownState(target: string): CountdownState | null {
  const [remaining, setRemaining] = useState(() => new Date(target).getTime() - Date.now())

  useEffect(() => {
    setRemaining(new Date(target).getTime() - Date.now())
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

  let text: string
  if (days > 0) text = `${days}d ${hours}h`
  else if (hours > 0) text = `${hours}h ${minutes}m`
  else if (minutes >= 10) text = `${minutes}m ${seconds.toString().padStart(2, '0')}s`
  else text = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`

  return { text, urgent: totalSeconds <= 3600 }
}

export function useCountdown(target: string): string | null {
  const state = useCountdownState(target)
  return state?.text ?? null
}
