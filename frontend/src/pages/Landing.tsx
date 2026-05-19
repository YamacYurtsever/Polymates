import { useRef } from 'react'
import { Link as RouterLink, Navigate } from 'react-router-dom'
import { Box, Button, Chip, Container, Stack, Typography } from '@mui/material'
import GavelIcon from '@mui/icons-material/Gavel'
import GroupsIcon from '@mui/icons-material/Groups'
import InsertPhotoIcon from '@mui/icons-material/InsertPhoto'
import BalanceIcon from '@mui/icons-material/Balance'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { useAuth } from '../contexts/AuthContext'
import { LiveOddsCard } from '../components/landing/LiveOddsCard'
import { AnimatedHeadline } from '../components/landing/AnimatedHeadline'
import { MagneticButton } from '../components/landing/MagneticButton'
import { AnimatedExampleBar } from '../components/landing/AnimatedExampleBar'
import { FeatureCard } from '../components/landing/FeatureCard'
import { SampleVerdict } from '../components/landing/SampleVerdict'
import { CountUp } from '../components/landing/CountUp'
import { useReducedMotion } from '../components/landing/useReducedMotion'
import { tokens } from '../theme'
import logo from '../assets/logo.png'

gsap.registerPlugin(useGSAP, ScrollTrigger)

const EXAMPLE_BETS = [
  { q: 'Will Sarah actually go to the gym this week?', yes: 320, no: 680, bettors: 8, in: '2d 14h' },
  { q: 'Does Yamac pull an all-nighter before the demo?', yes: 740, no: 260, bettors: 5, in: '4h 32m' },
  { q: 'Will the group ski trip happen before March?', yes: 410, no: 590, bettors: 11, in: '6d' },
]

const FEATURES = [
  {
    index: '01',
    title: 'A judge that actually rules',
    body:
      'An LLM reads every piece of evidence and writes a sarcastic verdict with reasoning. No abstain, no draws — the case ends.',
    icon: <GavelIcon fontSize="small" />,
  },
  {
    index: '02',
    title: 'Parimutuel payouts',
    body:
      'No bookie, no fixed odds. The losing pool is split among winners by share of stake. Conviction is rewarded.',
    icon: <BalanceIcon fontSize="small" />,
  },
  {
    index: '03',
    title: 'Per-group economies',
    body:
      'Every group is its own market. 1,000 starting points, group-scoped leaderboards, bragging rights that travel with the friendship.',
    icon: <GroupsIcon fontSize="small" />,
  },
  {
    index: '04',
    title: 'Evidence cabinet',
    body:
      'Screenshots, receipts, PDFs, captions — submit anything that proves your case. The judge sees what you submit, nothing else.',
    icon: <InsertPhotoIcon fontSize="small" />,
  },
]

const STATS = [
  { value: 1000, label: 'starting points / group', suffix: '' },
  { value: 2, label: 'possible outcomes', suffix: '' },
  { value: 120, label: 'max words per verdict', suffix: '' },
  { value: 15, label: 'seconds to start a bet', suffix: 's' },
]

function ExampleCard({
  q,
  yes,
  no,
  bettors,
  in: closes,
  initialFill,
}: (typeof EXAMPLE_BETS)[number] & { initialFill: boolean }) {
  return (
    <Box
      data-reveal
      sx={{
        border: 1,
        borderColor: 'divider',
        borderRadius: 1.25,
        bgcolor: '#fff',
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        gap: 1.25,
        height: tokens.betCardHeight,
        overflow: 'hidden',
        transition: 'border-color 150ms ease-out',
        '&:hover': { borderColor: '#C8C8CD' },
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, flexGrow: 1 }}>
        <Typography
          sx={{
            fontWeight: 600,
            fontSize: '0.975rem',
            lineHeight: 1.35,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {q}
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="caption" color="text.secondary">
            {bettors} bettors
          </Typography>
          <Typography variant="caption" color="text.secondary" className="tabular">
            {closes}
          </Typography>
        </Box>
      </Box>
      <AnimatedExampleBar yesTotal={yes} noTotal={no} initialFill={initialFill} />
    </Box>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Typography
      data-reveal
      variant="subtitle2"
      sx={{ color: 'text.secondary', mb: 2.5 }}
    >
      {children}
    </Typography>
  )
}

export function Landing() {
  const { user, loading } = useAuth()
  const reduced = useReducedMotion()
  const pageRef = useRef<HTMLDivElement>(null)
  const exampleGridRef = useRef<HTMLDivElement>(null)
  const logoRef = useRef<HTMLImageElement>(null)

  useGSAP(
    () => {
      // Example-card bar fills
      const grid = exampleGridRef.current
      if (grid && !reduced) {
        const bars = grid.querySelectorAll<HTMLElement>('[data-example-bar]')
        bars.forEach((bar) => {
          const yesPct = Number(bar.dataset.yes ?? '0')
          const noPct = Number(bar.dataset.no ?? '0')
          const yesEl = bar.querySelector<HTMLElement>('[data-fill="yes"]')
          const noEl = bar.querySelector<HTMLElement>('[data-fill="no"]')
          if (!yesEl || !noEl) return
          gsap.fromTo(
            [yesEl, noEl],
            { width: '0%' },
            {
              width: (i) => (i === 0 ? `${yesPct}%` : `${noPct}%`),
              duration: 0.9,
              ease: 'power2.out',
              stagger: 0.08,
              scrollTrigger: { trigger: bar, start: 'top 88%', once: true },
            },
          )
        })
      }

      // Logo rotation
      if (logoRef.current && !reduced) {
        gsap.to(logoRef.current, {
          rotate: 360,
          duration: 20,
          repeat: -1,
          ease: 'none',
          transformOrigin: 'center',
        })
      }

      // Per-element scroll reveal for [data-reveal] — once each, no batch callbacks
      const page = pageRef.current
      if (page && !reduced) {
        const reveals = gsap.utils.toArray<HTMLElement>('[data-reveal]', page)
        reveals.forEach((el) => {
          gsap.fromTo(
            el,
            { opacity: 0, y: 24 },
            {
              opacity: 1,
              y: 0,
              duration: 0.7,
              ease: 'power2.out',
              overwrite: 'auto',
              scrollTrigger: { trigger: el, start: 'top 88%', once: true },
            },
          )
        })
      }
    },
    { scope: pageRef, dependencies: [reduced] },
  )

  if (!loading && user) return <Navigate to="/dashboard" replace />

  return (
    <Box ref={pageRef} sx={{ bgcolor: tokens.bg, minHeight: '100vh' }}>
      <Box
        component="header"
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: 'rgba(250,250,250,0.85)',
          backdropFilter: 'saturate(180%) blur(10px)',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <Container
          maxWidth={false}
          sx={{ maxWidth: 1120, display: 'flex', alignItems: 'center', minHeight: 56 }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexGrow: 1 }}>
            <Box
              component="img"
              ref={logoRef}
              src={logo}
              alt="Polymates"
              sx={{ width: 24, height: 24, objectFit: 'contain', willChange: 'transform' }}
            />
            <Typography sx={{ fontWeight: 650, fontSize: '1.05rem', letterSpacing: '-0.015em' }}>
              Polymates
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Button component={RouterLink} to="/login" size="small">
              Log in
            </Button>
            <Button component={RouterLink} to="/signup" size="small" variant="contained">
              Sign up
            </Button>
          </Stack>
        </Container>
      </Box>

      <Container maxWidth={false} sx={{ maxWidth: 1120, pt: { xs: 8, md: 14 }, pb: { xs: 6, md: 10 } }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1.15fr) minmax(0, 1fr)' },
            gap: { xs: 6, md: 8 },
            alignItems: 'center',
          }}
        >
          <Box>
            <Chip
              label="parimutuel · AI judge · per-group economy"
              size="small"
              variant="outlined"
              sx={{ mb: 3, color: 'text.secondary' }}
            />
            <AnimatedHeadline />
            <Typography
              sx={{
                fontSize: { xs: '1.05rem', md: '1.2rem' },
                color: 'text.secondary',
                lineHeight: 1.5,
                mb: 4,
                maxWidth: 560,
              }}
            >
              Binary bets, parimutuel payouts, and an AI judge that delivers the verdict. One economy
              per group. No money — just points and bragging rights.
            </Typography>
            <Stack direction="row" spacing={1.5}>
              <MagneticButton>
                <Button component={RouterLink} to="/signup" size="large" variant="contained">
                  Get started
                </Button>
              </MagneticButton>
              <Button component={RouterLink} to="/login" size="large" variant="outlined">
                Log in
              </Button>
            </Stack>
          </Box>
          <Box sx={{ width: '100%' }}>
            <LiveOddsCard />
          </Box>
        </Box>

        {/* Example bets ribbon */}
        <Box sx={{ mt: { xs: 10, md: 16 } }}>
          <SectionLabel>A taste of what bets look like</SectionLabel>
          <Box
            ref={exampleGridRef}
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
              gap: 2,
            }}
          >
            {EXAMPLE_BETS.map((b) => (
              <ExampleCard key={b.q} {...b} initialFill={reduced} />
            ))}
          </Box>
        </Box>

        {/* Features */}
        <Box sx={{ mt: { xs: 12, md: 20 } }}>
          <Box sx={{ maxWidth: 720, mb: { xs: 4, md: 6 } }}>
            <SectionLabel>Built for the stakes that matter</SectionLabel>
            <Typography
              data-reveal
              component="h2"
              sx={{
                fontSize: { xs: '1.85rem', md: '2.5rem' },
                fontWeight: 650,
                letterSpacing: '-0.02em',
                lineHeight: 1.1,
                mb: 1.5,
              }}
            >
              Every group has unsettled scores. Settle them on the record.
            </Typography>
            <Typography
              data-reveal
              sx={{ color: 'text.secondary', fontSize: { xs: '1rem', md: '1.1rem' }, lineHeight: 1.55 }}
            >
              The arguments about who flakes, who finishes, who shows up — Polymates turns them into
              positions with skin in the game. The receipts are saved, the verdict is read aloud, the
              leaderboard remembers.
            </Typography>
          </Box>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
              gap: 2,
            }}
          >
            {FEATURES.map((f) => (
              <FeatureCard key={f.index} {...f} />
            ))}
          </Box>
        </Box>

        {/* Judge spotlight */}
        <Box sx={{ mt: { xs: 12, md: 20 } }}>
          <Box sx={{ maxWidth: 720, mb: { xs: 4, md: 6 } }}>
            <SectionLabel>The judge speaks</SectionLabel>
            <Typography
              data-reveal
              component="h2"
              sx={{
                fontSize: { xs: '1.85rem', md: '2.5rem' },
                fontWeight: 650,
                letterSpacing: '-0.02em',
                lineHeight: 1.1,
                mb: 1.5,
              }}
            >
              No abstain. No mercy. Just a ruling.
            </Typography>
            <Typography
              data-reveal
              sx={{ color: 'text.secondary', fontSize: { xs: '1rem', md: '1.1rem' }, lineHeight: 1.55 }}
            >
              When the deadline hits, the arbiter reads every screenshot, PDF and caption in the case
              file and writes a verdict in under 120 words. The losing pool is split, the leaderboard
              updates, the group chat erupts.
            </Typography>
          </Box>
          <SampleVerdict />
        </Box>

        {/* Stats strip */}
        <Box
          data-reveal
          sx={{
            mt: { xs: 12, md: 20 },
            border: 1,
            borderColor: 'divider',
            borderRadius: 1.5,
            bgcolor: tokens.surface,
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
          }}
        >
          {STATS.map((s, i) => (
            <Box
              key={s.label}
              sx={{
                p: { xs: 3, md: 4 },
                borderRight: {
                  xs: i % 2 === 0 ? 1 : 0,
                  md: i < STATS.length - 1 ? 1 : 0,
                },
                borderBottom: { xs: i < 2 ? 1 : 0, md: 0 },
                borderColor: 'divider',
              }}
            >
              <Typography
                sx={{
                  fontSize: { xs: '2.25rem', md: '3rem' },
                  fontWeight: 650,
                  letterSpacing: '-0.03em',
                  lineHeight: 1,
                  color: tokens.ink,
                  mb: 1,
                }}
              >
                <CountUp to={s.value} suffix={s.suffix} duration={1.4} />
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: 'text.secondary',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                }}
              >
                {s.label}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* How it works */}
        <Box
          sx={{
            mt: { xs: 12, md: 20 },
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
            gap: { xs: 4, md: 6 },
            borderTop: 1,
            borderColor: 'divider',
            pt: { xs: 6, md: 8 },
          }}
        >
          {[
            { t: 'Make the bet', d: 'Yes/No, deadline, group. Done in 15 seconds, mid-conversation.' },
            {
              t: 'Stake & gather evidence',
              d: 'Pick a side, commit your points. Upload screenshots, receipts, anything that proves your case.',
            },
            {
              t: 'The judge rules',
              d: 'An AI arbiter reads the evidence and delivers a verdict — with reasoning. Winners split the losing pool.',
            },
          ].map((s, i) => (
            <Box key={s.t} data-reveal>
              <Typography
                className="tabular"
                sx={{ color: tokens.brand, fontWeight: 650, fontSize: '0.95rem', mb: 1 }}
              >
                0{i + 1}
              </Typography>
              <Typography sx={{ fontWeight: 600, mb: 0.75, fontSize: '1.05rem' }}>{s.t}</Typography>
              <Typography variant="body2" color="text.secondary">
                {s.d}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Closing CTA */}
        <Box
          sx={{
            mt: { xs: 12, md: 20 },
            mb: { xs: 6, md: 10 },
            textAlign: 'center',
            py: { xs: 6, md: 10 },
            px: 2,
            border: 1,
            borderColor: 'divider',
            borderRadius: 2,
            bgcolor: tokens.surface,
          }}
        >
          <Typography
            data-reveal
            variant="subtitle2"
            sx={{ color: 'text.secondary', mb: 2 }}
          >
            One last thing
          </Typography>
          <Typography
            data-reveal
            component="h2"
            sx={{
              fontSize: { xs: '2rem', md: '3.25rem' },
              fontWeight: 650,
              letterSpacing: '-0.025em',
              lineHeight: 1.05,
              maxWidth: 760,
              mx: 'auto',
              mb: 2.5,
            }}
          >
            Start a group. Pick a fight. Make it official.
          </Typography>
          <Typography
            data-reveal
            sx={{
              color: 'text.secondary',
              fontSize: { xs: '1rem', md: '1.15rem' },
              maxWidth: 560,
              mx: 'auto',
              mb: 4,
            }}
          >
            Free, points-only, no money involved. Build the receipts the group chat will never let
            anyone forget.
          </Typography>
          <Stack
            direction="row"
            spacing={1.5}
            sx={{ justifyContent: 'center' }}
            {...({ 'data-reveal': true } as Record<string, unknown>)}
          >
            <MagneticButton>
              <Button component={RouterLink} to="/signup" size="large" variant="contained">
                Get started
              </Button>
            </MagneticButton>
            <Button component={RouterLink} to="/login" size="large" variant="outlined">
              Log in
            </Button>
          </Stack>
        </Box>
      </Container>

      <Box component="footer" sx={{ borderTop: 1, borderColor: 'divider', py: 3 }}>
        <Container
          maxWidth={false}
          sx={{
            maxWidth: 1120,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Typography variant="caption" color="text.secondary">
            © Polymates
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Points only. Not real money.
          </Typography>
        </Container>
      </Box>
    </Box>
  )
}
