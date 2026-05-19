import { useRef } from 'react'
import { Box, Typography } from '@mui/material'
import GavelIcon from '@mui/icons-material/Gavel'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { tokens } from '../../theme'
import { useReducedMotion } from './useReducedMotion'

gsap.registerPlugin(useGSAP, ScrollTrigger)

const VERDICT =
  '"The defendant cites a single grainy photograph of running shoes by the door. The shoes appear unworn, the laces still pristine. The court is not impressed. Ruling: NO."'

export function SampleVerdict() {
  const reduced = useReducedMotion()
  const rootRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      if (reduced) return
      const root = rootRef.current
      if (!root) return
      const gavel = root.querySelector<HTMLElement>('[data-gavel]')
      const stamp = root.querySelector<HTMLElement>('[data-stamp]')
      const verdict = root.querySelector<HTMLElement>('[data-verdict]')
      const tl = gsap.timeline({
        scrollTrigger: { trigger: root, start: 'top 75%', once: true },
      })
      if (gavel) {
        tl.fromTo(
          gavel,
          { rotation: -30, opacity: 0 },
          { rotation: 0, opacity: 1, duration: 0.5, ease: 'back.out(2.2)', transformOrigin: '80% 20%' },
        )
      }
      if (verdict) {
        tl.from(verdict, { opacity: 0, y: 10, duration: 0.6, ease: 'power2.out' }, '-=0.2')
      }
      if (stamp) {
        tl.fromTo(
          stamp,
          { scale: 1.6, opacity: 0, rotation: -6 },
          { scale: 1, opacity: 1, rotation: -8, duration: 0.45, ease: 'power3.out' },
          '-=0.15',
        )
      }
    },
    { scope: rootRef, dependencies: [reduced] },
  )

  return (
    <Box
      ref={rootRef}
      data-reveal
      sx={{
        position: 'relative',
        border: 1,
        borderColor: 'divider',
        borderRadius: 1.5,
        bgcolor: tokens.surface,
        p: { xs: 3, md: 5 },
        overflow: 'hidden',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 2 }}>
        <Box
          data-gavel
          sx={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            border: 1,
            borderColor: 'divider',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: tokens.brand,
            bgcolor: tokens.bg,
          }}
        >
          <GavelIcon fontSize="small" />
        </Box>
        <Box>
          <Typography
            sx={{
              fontSize: '0.7rem',
              letterSpacing: '0.12em',
              fontWeight: 650,
              color: tokens.brand,
              textTransform: 'uppercase',
            }}
          >
            The honourable judge
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Re: "Will Sarah actually go to the gym this week?"
          </Typography>
        </Box>
      </Box>

      <Typography
        data-verdict
        sx={{
          fontFamily: tokens.fontSerif,
          fontStyle: 'italic',
          fontSize: { xs: '1.15rem', md: '1.5rem' },
          lineHeight: 1.45,
          color: tokens.ink,
          maxWidth: 720,
        }}
      >
        {VERDICT}
      </Typography>

      <Box
        data-stamp
        sx={{
          position: 'absolute',
          right: { xs: 16, md: 40 },
          bottom: { xs: 16, md: 40 },
          border: `2px solid ${tokens.no}`,
          color: tokens.no,
          px: 1.25,
          py: 0.5,
          borderRadius: 1,
          fontFamily: tokens.fontMono,
          fontWeight: 700,
          letterSpacing: '0.16em',
          fontSize: { xs: '1rem', md: '1.4rem' },
          transform: 'rotate(-8deg)',
          opacity: reduced ? 1 : 0,
        }}
      >
        NO
      </Box>
    </Box>
  )
}
