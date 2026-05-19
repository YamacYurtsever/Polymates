import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom'
import { Alert, Box, Button, Chip, Stack, Typography } from '@mui/material'
import { LoadingGavel } from '../components/LoadingGavel'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { tokens } from '../theme'
import logo from '../assets/logo.png'

interface BetPreview {
  id: string
  title: string
  description: string
  closes_at: string
  status: 'open' | 'closed'
  group_id: string
  group_name: string
}

export function BetSharePage() {
  const { token } = useParams<{ token: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [bet, setBet] = useState<BetPreview | null>(null)
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    async function load() {
      const { data, error } = await supabase.rpc('get_bet_by_share_token', { p_token: token })
      if (error || !data?.length) {
        setError('This bet link is invalid or expired.')
        setLoading(false)
        return
      }
      const row = data[0]
      setBet(row)

      if (user) {
        const { data: membership } = await supabase
          .from('group_members')
          .select('user_id')
          .eq('group_id', row.group_id)
          .eq('user_id', user.id)
          .maybeSingle()
        if (membership) {
          navigate(`/bets/${row.id}`, { replace: true })
          return
        }
      }
      setLoading(false)
    }
    load()
  }, [token, user, navigate])

  async function handleJoin() {
    if (!user || !bet) return
    setJoining(true)
    setError(null)
    const { error } = await supabase
      .from('group_members')
      .insert({ group_id: bet.group_id, user_id: user.id })
    if (error) {
      setError(error.message)
      setJoining(false)
    } else {
      navigate(`/bets/${bet.id}`)
    }
  }

  const shareUrl = window.location.pathname

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2,
        bgcolor: tokens.bg,
      }}
    >
      <Box
        component={RouterLink}
        to="/"
        sx={{
          position: 'fixed',
          top: 20,
          left: 24,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          textDecoration: 'none',
          color: 'inherit',
        }}
      >
        <Box component="img" src={logo} alt="Polymates" sx={{ width: 22, height: 22, objectFit: 'contain' }} />
        <Typography sx={{ fontWeight: 650, fontSize: '1.05rem', letterSpacing: '-0.015em' }}>
          Polymates
        </Typography>
      </Box>

      <Box
        sx={{
          width: '100%',
          maxWidth: 440,
          p: { xs: 3, sm: 4 },
          border: 1,
          borderColor: 'divider',
          borderRadius: 1.5,
          bgcolor: '#fff',
          textAlign: 'center',
        }}
      >
        {loading ? (
          <LoadingGavel size={24} />
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : bet ? (
          <>
            <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: '0.08em' }}>
              {bet.group_name.toUpperCase()}
            </Typography>
            <Typography
              variant="h3"
              sx={{ mt: 1, mb: 1.5, letterSpacing: '-0.02em', fontSize: { xs: '1.5rem', sm: '1.85rem' } }}
            >
              {bet.title}
            </Typography>
            {bet.description && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                {bet.description}
              </Typography>
            )}
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 3 }}>
              <Chip
                label={bet.status === 'open' ? 'open' : 'closed'}
                size="small"
                variant="outlined"
                sx={{ color: bet.status === 'open' ? tokens.yes : tokens.inkSecondary }}
              />
              <Chip
                label={new Date(bet.closes_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                size="small"
                variant="outlined"
              />
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            {!user ? (
              <Stack spacing={1}>
                <Typography color="text.secondary" variant="body2" sx={{ mb: 0.5 }}>
                  Sign in to join the bet.
                </Typography>
                <Button
                  component={RouterLink}
                  to={`/signup?next=${encodeURIComponent(shareUrl)}`}
                  variant="contained"
                  size="large"
                  fullWidth
                >
                  Sign up & join
                </Button>
                <Button
                  component={RouterLink}
                  to={`/login?next=${encodeURIComponent(shareUrl)}`}
                  variant="outlined"
                  size="large"
                  fullWidth
                >
                  Log in
                </Button>
              </Stack>
            ) : (
              <Button
                variant="contained"
                size="large"
                fullWidth
                onClick={handleJoin}
                disabled={joining}
              >
                {joining ? 'Joining…' : `Join ${bet.group_name} & View Bet`}
              </Button>
            )}
          </>
        ) : null}
      </Box>
    </Box>
  )
}
