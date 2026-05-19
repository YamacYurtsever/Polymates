import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Alert, Box, Button, CircularProgress, Container, Typography } from '@mui/material'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

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

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Container maxWidth="xs">
      <Box
        sx={{
          mt: 8,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        {error && !group ? (
          <Alert severity="error" sx={{ width: '100%' }}>
            {error}
          </Alert>
        ) : group ? (
          <>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              You're invited to
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              {group.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {group.member_count} {group.member_count === 1 ? 'member' : 'members'}
            </Typography>

            {error && (
              <Alert severity="error" sx={{ width: '100%' }}>
                {error}
              </Alert>
            )}

            {alreadyMember ? (
              <>
                <Typography color="text.secondary">
                  You're already a member of this group.
                </Typography>
                <Button variant="contained" onClick={() => navigate(`/groups/${group.id}`)}>
                  Go to Group
                </Button>
              </>
            ) : (
              <Button
                variant="contained"
                size="large"
                onClick={handleJoin}
                disabled={joining}
                sx={{ mt: 1 }}
              >
                {joining ? 'Joining…' : 'Accept Invite'}
              </Button>
            )}
          </>
        ) : null}
      </Box>
    </Container>
  )
}
