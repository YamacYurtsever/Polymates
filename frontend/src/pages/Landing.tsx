import { Link as RouterLink, Navigate } from 'react-router-dom'
import { Box, Button, Chip, Container, Stack, Typography } from '@mui/material'
import { useAuth } from '../contexts/AuthContext'
import { ProbabilityBar } from '../components/ProbabilityBar'
import { tokens } from '../theme'
import logo from '../assets/logo.png'

const EXAMPLE_BETS = [
  { q: 'Will Sarah actually go to the gym this week?', yes: 320, no: 680, pool: 1000, in: '2d 14h' },
  { q: 'Does Yamac pull an all-nighter before the demo?', yes: 740, no: 260, pool: 1000, in: '4h 32m' },
  { q: 'Will the group ski trip happen before March?', yes: 410, no: 590, pool: 850, in: '6d' },
]

function ExampleCard({ q, yes, no, pool, in: closes }: (typeof EXAMPLE_BETS)[number]) {
  return (
    <Box
      sx={{
        border: 1,
        borderColor: 'divider',
        borderRadius: 1.25,
        bgcolor: '#fff',
        p: 2.25,
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
        transition: 'border-color 150ms ease-out',
        '&:hover': { borderColor: '#C8C8CD' },
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1 }}>
        <Chip label="open" size="small" variant="outlined" sx={{ color: tokens.yes }} />
        <Typography variant="caption" color="text.secondary" className="tabular">
          closes {closes}
        </Typography>
      </Box>
      <Typography sx={{ fontWeight: 600, fontSize: '0.975rem', lineHeight: 1.35, minHeight: 42 }}>
        {q}
      </Typography>
      <ProbabilityBar yesTotal={yes} noTotal={no} size="sm" />
      <Typography variant="caption" color="text.secondary" className="tabular">
        {pool} pts pool
      </Typography>
    </Box>
  )
}

export function Landing() {
  const { user, loading } = useAuth()
  if (!loading && user) return <Navigate to="/dashboard" replace />

  return (
    <Box sx={{ bgcolor: tokens.bg, minHeight: '100vh' }}>
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
              src={logo}
              alt="Polymates"
              sx={{ width: 24, height: 24, objectFit: 'contain' }}
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

      <Container maxWidth={false} sx={{ maxWidth: 1120, pt: { xs: 8, md: 14 }, pb: { xs: 8, md: 12 } }}>
        <Box sx={{ maxWidth: 760 }}>
          <Chip
            label="parimutuel · AI judge · per-group economy"
            size="small"
            variant="outlined"
            sx={{ mb: 3, color: 'text.secondary' }}
          />
          <Typography
            component="h1"
            sx={{
              fontSize: { xs: '2.5rem', sm: '3.5rem', md: '4.5rem' },
              fontWeight: 650,
              letterSpacing: '-0.03em',
              lineHeight: 1.02,
              mb: 2.5,
            }}
          >
            Polymarket
            <br />
            for friend groups.
          </Typography>
          <Typography
            sx={{
              fontSize: { xs: '1.05rem', md: '1.2rem' },
              color: 'text.secondary',
              lineHeight: 1.5,
              mb: 4,
              maxWidth: 620,
            }}
          >
            Binary bets, parimutuel payouts, and an AI judge that delivers the verdict. One economy
            per group. No money — just points and bragging rights.
          </Typography>
          <Stack direction="row" spacing={1.5}>
            <Button component={RouterLink} to="/signup" size="large" variant="contained">
              Get started
            </Button>
            <Button component={RouterLink} to="/login" size="large" variant="outlined">
              Log in
            </Button>
          </Stack>
        </Box>

        <Box sx={{ mt: { xs: 8, md: 12 } }}>
          <Typography
            variant="subtitle2"
            sx={{ color: 'text.secondary', mb: 2.5 }}
          >
            A taste of what bets look like
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
              gap: 2,
            }}
          >
            {EXAMPLE_BETS.map((b) => (
              <ExampleCard key={b.q} {...b} />
            ))}
          </Box>
        </Box>

        <Box
          sx={{
            mt: { xs: 8, md: 12 },
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
            gap: { xs: 4, md: 6 },
            borderTop: 1,
            borderColor: 'divider',
            pt: { xs: 6, md: 8 },
          }}
        >
          {[
            {
              t: 'Make the bet',
              d: 'Yes/No, deadline, group. Done in 15 seconds, mid-conversation.',
            },
            {
              t: 'Stake & gather evidence',
              d: 'Pick a side, commit your points. Upload screenshots, receipts, anything that proves your case.',
            },
            {
              t: 'The judge rules',
              d: 'An AI arbiter reads the evidence and delivers a verdict — with reasoning. Winners split the losing pool.',
            },
          ].map((s, i) => (
            <Box key={s.t}>
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
