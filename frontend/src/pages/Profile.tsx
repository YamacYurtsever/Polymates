import { useEffect, useState } from 'react'
import {
  Avatar,
  Box,
  Button,
  CircularProgress,
  Container,
  TextField,
  Typography,
  Alert,
} from '@mui/material'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

interface UserProfile {
  display_name: string
  avatar_url: string | null
  points: number
}

export function Profile() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [displayName, setDisplayName] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!user) return
    supabase
      .from('users')
      .select('display_name, avatar_url, points')
      .eq('id', user.id)
      .single()
      .then(({ data, error }) => {
        if (error) {
          setError(error.message)
        } else {
          setProfile(data)
          setDisplayName(data.display_name ?? '')
        }
        setLoading(false)
      })
  }, [user])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    setSaving(true)
    setError(null)
    setSuccess(false)

    const { error } = await supabase
      .from('users')
      .update({ display_name: displayName })
      .eq('id', user.id)

    if (error) {
      setError(error.message)
    } else {
      setProfile((prev) => prev && { ...prev, display_name: displayName })
      setSuccess(true)
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 4, display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Profile
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar
            src={profile?.avatar_url ?? undefined}
            sx={{ width: 72, height: 72, fontSize: 32 }}
          >
            {profile?.display_name?.[0]?.toUpperCase() ?? user?.email?.[0]?.toUpperCase()}
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {profile?.display_name || user?.email}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {user?.email}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2, display: 'inline-flex', gap: 1, alignItems: 'baseline' }}>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            {profile?.points ?? '—'}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            points
          </Typography>
        </Box>

        {error && <Alert severity="error">{error}</Alert>}
        {success && <Alert severity="success">Display name updated.</Alert>}

        <Box component="form" onSubmit={handleSave} sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
          <TextField
            label="Display name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            size="small"
            required
            sx={{ flexGrow: 1 }}
          />
          <Button type="submit" variant="contained" disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </Box>
      </Box>
    </Container>
  )
}
