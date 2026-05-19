import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom'
import { Alert, Box, Button, Stack, Typography } from '@mui/material'
import { LoadingGavel } from '../components/LoadingGavel'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { tokens } from '../theme'

interface GroupPreview {
  id: string
  name: string
  member_count: number
}

export function InvitePage() {
  const { token } = useParams<{ token: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [group, setGroup] = useState<GroupPreview | null>(null)
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [alreadyMember, setAlreadyMember] = useState(false)

  useEffect(() => {
    if (!token) return
    async function fetchGroup() {
      const { data, error } = await supabase.rpc('get_group_by_invite_token', { token })

      if (error || !data?.length) {
        setError('Invite link is invalid or expired.')
      } else {
        const g = data[0]
        setGroup({ id: g.id, name: g.name, member_count: Number(g.member_count) })

        if (user) {
          const { data: existing } = await supabase
            .from('group_members')
            .select('user_id')
            .eq('group_id', g.id)
            .eq('user_id', user.id)
            .maybeSingle()
          if (existing) setAlreadyMember(true)
        }
      }
      setLoading(false)
    }
    fetchGroup()
  }, [token, user])

  async function handleJoin() {
    if (!user || !group) return
    setJoining(true)
    setError(null)

    const { error } = await supabase
      .from('group_members')
      .insert({ group_id: group.id, user_id: user.id })

    if (error) {
      setError(error.message)
      setJoining(false)
    } else {
      navigate(`/groups/${group.id}`)
    }
  }

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
        <Box
          sx={{
            width: 22,
            height: 22,
            borderRadius: '6px',
            background: `linear-gradient(135deg, ${tokens.brand}, #5B3FFF)`,
          }}
        />
        <Typography sx={{ fontWeight: 650, fontSize: '1.05rem', letterSpacing: '-0.015em' }}>
          Polymates
        </Typography>
      </Box>

      <Box
        sx={{
          width: '100%',
          maxWidth: 420,
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
        ) : error && !group ? (
          <Alert severity="error">{error}</Alert>
        ) : group ? (
          <>
            <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: '0.08em' }}>
              YOU'RE INVITED TO
            </Typography>
            <Typography
              variant="h3"
              sx={{ mt: 1, mb: 0.5, letterSpacing: '-0.02em' }}
            >
              {group.name}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {group.member_count} {group.member_count === 1 ? 'member' : 'members'} · You'll start
              with{' '}
              <span className="tabular" style={{ fontWeight: 600, color: tokens.brand }}>
                1,000 pts
              </span>
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {!user ? (
              <Stack spacing={1}>
                <Typography color="text.secondary" variant="body2" sx={{ mb: 0.5 }}>
                  Sign in to accept this invite.
                </Typography>
                <Button
                  component={RouterLink}
                  to={`/signup?next=${encodeURIComponent(window.location.pathname)}`}
                  variant="contained"
                  size="large"
                  fullWidth
                >
                  Sign up
                </Button>
                <Button
                  component={RouterLink}
                  to={`/login?next=${encodeURIComponent(window.location.pathname)}`}
                  variant="outlined"
                  size="large"
                  fullWidth
                >
                  Log in
                </Button>
              </Stack>
            ) : alreadyMember ? (
              <>
                <Typography color="text.secondary" variant="body2" sx={{ mb: 2 }}>
                  You're already a member.
                </Typography>
                <Button
                  variant="contained"
                  size="large"
                  fullWidth
                  onClick={() => navigate(`/groups/${group.id}`)}
                >
                  Go to group
                </Button>
              </>
            ) : (
              <Button
                variant="contained"
                size="large"
                fullWidth
                onClick={handleJoin}
                disabled={joining}
              >
                {joining ? 'Joining…' : 'Accept invite'}
              </Button>
            )}
          </>
        ) : null}
      </Box>
    </Box>
  )
}
