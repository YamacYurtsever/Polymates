import { useRef, type ReactNode } from 'react'
import { Box } from '@mui/material'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { useReducedMotion } from './useReducedMotion'

gsap.registerPlugin(useGSAP)

interface Props {
  children: ReactNode
  strength?: number
  maxOffset?: number
}

export function MagneticButton({ children, strength = 0.25, maxOffset = 6 }: Props) {
  const reduced = useReducedMotion()
  const wrapRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)

  useGSAP(
    (_ctx, contextSafe) => {
      if (reduced) return
      const wrap = wrapRef.current
      const inner = innerRef.current
      if (!wrap || !inner || !contextSafe) return

      const clamp = gsap.utils.clamp(-maxOffset, maxOffset)

      const onMove = contextSafe((e: MouseEvent) => {
        const rect = wrap.getBoundingClientRect()
        const dx = e.clientX - (rect.left + rect.width / 2)
        const dy = e.clientY - (rect.top + rect.height / 2)
        gsap.to(inner, {
          x: clamp(dx * strength),
          y: clamp(dy * strength),
          duration: 0.4,
          ease: 'power3.out',
        })
      })

      const onLeave = contextSafe(() => {
        gsap.to(inner, {
          x: 0,
          y: 0,
          duration: 0.7,
          ease: 'elastic.out(1, 0.4)',
        })
      })

      wrap.addEventListener('mousemove', onMove)
      wrap.addEventListener('mouseleave', onLeave)
      return () => {
        wrap.removeEventListener('mousemove', onMove)
        wrap.removeEventListener('mouseleave', onLeave)
      }
    },
    { scope: wrapRef, dependencies: [reduced, strength, maxOffset] },
  )

  return (
    <Box ref={wrapRef} sx={{ display: 'inline-block' }}>
      <Box ref={innerRef} sx={{ display: 'inline-block', willChange: 'transform' }}>
        {children}
      </Box>
    </Box>
  )
}
