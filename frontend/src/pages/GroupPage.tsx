import { useEffect, useState } from 'react'
import { useParams, Link as RouterLink } from 'react-router-dom'
import {
  Alert,
  Avatar,
  Box,
  Button,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Snackbar,
  Typography,
} from '@mui/material'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

interface Group {
  id: string
  name: string
  description: string
  invite_token: string
}

interface Member {
  user_id: string
  role: string
  display_name: string
  avatar_url: string | null
  points: number
}

export function GroupPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const [group, setGroup] = useState<Group | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!id) return
    fetchGroup()
  }, [id])

  async function fetchGroup() {
    setLoading(true)

    const [groupRes, membersRes] = await Promise.all([
      supabase.from('groups').select('id, name, description, invite_token').eq('id', id!).single(),
      supabase
        .from('group_members')
        .select('user_id, role, users(display_name, avatar_url, points)')
        .eq('group_id', id!),
    ])

    if (groupRes.error) {
      setError(groupRes.error.message)
    } else {
      setGroup(groupRes.data)
    }

    if (!membersRes.error) {
      const mapped: Member[] = (membersRes.data ?? []).map((row: any) => ({
        user_id: row.user_id,
        role: row.role,
        display_name: row.users?.display_name ?? 'Unknown',
        avatar_url: row.users?.avatar_url ?? null,
        points: row.users?.points ?? 0,
      }))
      setMembers(mapped)
    }

    setLoading(false)
  }

  function inviteUrl() {
    return `${window.location.origin}/invite/${group?.invite_token}`
  }

  async function copyInvite() {
    await navigator.clipboard.writeText(inviteUrl())
    setCopied(true)
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error || !group) {
    return <Alert severity="error">{error ?? 'Group not found.'}</Alert>
  }

  return (
    <Box sx={{ maxWidth: 720 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          {group.name}
        </Typography>
        {group.description && (
          <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
            {group.description}
          </Typography>
        )}
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 4 }}>
        <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1, fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {inviteUrl()}
        </Typography>
        <Button size="small" startIcon={<ContentCopyIcon />} onClick={copyInvite} variant="outlined">
          Copy invite
        </Button>
      </Box>

      <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
        Members
      </Typography>
      <List disablePadding>
        {members.map((m, i) => (
          <Box key={m.user_id}>
            {i > 0 && <Divider component="li" />}
            <ListItem disableGutters>
              <ListItemAvatar>
                <Avatar src={m.avatar_url ?? undefined} sx={{ width: 36, height: 36 }}>
                  {m.display_name[0]?.toUpperCase()}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <span>{m.display_name}</span>
                    {m.user_id === user?.id && (
                      <Typography variant="caption" color="text.secondary">(you)</Typography>
                    )}
                    {m.role === 'admin' && (
                      <Typography variant="caption" color="primary">admin</Typography>
                    )}
                  </Box>
                }
                secondary={`${m.points} pts`}
              />
            </ListItem>
          </Box>
        ))}
      </List>

      <Divider sx={{ my: 4 }} />

      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>Active Bets</Typography>
          <Button component={RouterLink} to={`/bets/new?groupId=${group.id}`} variant="contained" size="small">
            New Bet
          </Button>
        </Box>
        <Typography color="text.secondary" variant="body2">No active bets yet.</Typography>
      </Box>

      <Box>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>Resolved Bets</Typography>
        <Typography color="text.secondary" variant="body2">No resolved bets yet.</Typography>
      </Box>

      <Snackbar
        open={copied}
        autoHideDuration={2000}
        onClose={() => setCopied(false)}
        message="Invite link copied!"
      />
    </Box>
  )
}
