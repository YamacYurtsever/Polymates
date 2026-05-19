import { useRef } from 'react'
import { Box, Typography } from '@mui/material'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { tokens } from '../../theme'
import { useReducedMotion } from './useReducedMotion'

gsap.registerPlugin(useGSAP)

const LINE_ONE = ['Polymarket']
const LINE_TWO = ['for', 'friend', 'groups']

export function AnimatedHeadline() {
  const reduced = useReducedMotion()
  const rootRef = useRef<HTMLHeadingElement>(null)
  const periodRef = useRef<HTMLSpanElement>(null)

  useGSAP(
    () => {
      if (reduced) return
      const words = rootRef.current?.querySelectorAll<HTMLElement>('[data-word]')
      if (!words || words.length === 0) return
      gsap.from(words, {
        y: 14,
        opacity: 0,
        stagger: 0.06,
        duration: 0.6,
        ease: 'power3.out',
      })
      if (periodRef.current) {
        gsap.to(periodRef.current, {
          scale: 1.15,
          duration: 1.2,
          yoyo: true,
          repeat: -1,
          ease: 'sine.inOut',
          transformOrigin: 'center',
          delay: 0.6,
        })
      }
    },
    { scope: rootRef, dependencies: [reduced] },
  )

  const wordSx = {
    display: 'inline-block',
    willChange: 'transform, opacity',
  }

  return (
    <Typography
      ref={rootRef}
      component="h1"
      sx={{
        fontSize: { xs: '2.5rem', sm: '3.5rem', md: '4.5rem' },
        fontWeight: 650,
        letterSpacing: '-0.03em',
        lineHeight: 1.02,
        mb: 2.5,
      }}
    >
      {LINE_ONE.map((w, i) => (
        <Box key={`l1-${i}`} component="span" data-word sx={wordSx}>
          {w}
        </Box>
      ))}
      <br />
      {LINE_TWO.map((w, i) => (
        <Box
          key={`l2-${i}`}
          component="span"
          data-word
          sx={{ ...wordSx, mr: i < LINE_TWO.length - 1 ? '0.25em' : 0 }}
        >
          {w}
        </Box>
      ))}
      <Box
        component="span"
        ref={periodRef}
        data-word
        sx={{
          ...wordSx,
          color: tokens.brand,
          ml: '0.02em',
        }}
      >
        .
      </Box>
    </Typography>
  )
}
