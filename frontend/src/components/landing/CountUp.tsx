import { useRef } from 'react'
import { Box } from '@mui/material'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { useReducedMotion } from './useReducedMotion'

gsap.registerPlugin(useGSAP, ScrollTrigger)

interface Props {
  to: number
  from?: number
  duration?: number
  prefix?: string
  suffix?: string
  decimals?: number
}

export function CountUp({ to, from = 0, duration = 1.4, prefix = '', suffix = '', decimals = 0 }: Props) {
  const reduced = useReducedMotion()
  const ref = useRef<HTMLSpanElement>(null)

  const format = (v: number) => {
    const n = decimals > 0 ? v.toFixed(decimals) : String(Math.round(v))
    return `${prefix}${n}${suffix}`
  }

  useGSAP(
    () => {
      const el = ref.current
      if (!el) return
      if (reduced) {
        el.textContent = format(to)
        return
      }
      el.textContent = format(from)
      const obj = { v: from }
      gsap.to(obj, {
        v: to,
        duration,
        ease: 'power2.out',
        onUpdate: () => {
          el.textContent = format(obj.v)
        },
        scrollTrigger: {
          trigger: el,
          start: 'top 88%',
          once: true,
        },
      })
    },
    { dependencies: [reduced, to] },
  )

  return <Box component="span" ref={ref} className="tabular">{format(reduced ? to : from)}</Box>
}
