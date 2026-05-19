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
  invite_token: string
}

interface Member {
  user_id: string
  username: string
  points: number
}

interface Bet {
  id: string
  title: string
  closes_at: string
  status: 'open' | 'closed' | 'resolved' | 'refunded'
}

export function GroupPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const [group, setGroup] = useState<Group | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [bets, setBets] = useState<Bet[]>([])

  useEffect(() => {
    if (!id) return
    type MemberRow = { user_id: string; points: number; users: { username: string } | null }
    async function fetchGroup() {
      setLoading(true)

      const [groupRes, membersRes, betsRes] = await Promise.all([
        supabase.from('groups').select('id, name, invite_token').eq('id', id!).single(),
        supabase
          .from('group_members')
          .select('user_id, points, users(username)')
          .eq('group_id', id!),
        supabase
          .from('bets')
          .select('id, title, closes_at, status')
          .eq('group_id', id!)
          .order('created_at', { ascending: false }),
      ])

      if (groupRes.error) {
        setError(groupRes.error.message)
      } else {
        setGroup(groupRes.data)
      }

      if (!membersRes.error) {
        const mapped: Member[] = ((membersRes.data ?? []) as unknown as MemberRow[]).map((row) => ({
          user_id: row.user_id,
          username: row.users?.username ?? 'Unknown',
          points: row.points,
        }))
        setMembers(mapped)
      }

      if (!betsRes.error && betsRes.data) {
        setBets(betsRes.data as Bet[])
      }

      setLoading(false)
    }
    fetchGroup()
  }, [id])

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
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 4 }}>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            flexGrow: 1,
            fontFamily: 'monospace',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {inviteUrl()}
        </Typography>
        <Button
          size="small"
          startIcon={<ContentCopyIcon />}
          onClick={copyInvite}
          variant="outlined"
        >
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
                <Avatar sx={{ width: 36, height: 36 }}>{m.username[0]?.toUpperCase()}</Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <span>{m.username}</span>
                    {m.user_id === user?.id && (
                      <Typography variant="caption" color="text.secondary">
                        (you)
                      </Typography>
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
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Active Bets
          </Typography>
          <Button
            component={RouterLink}
            to={`/bets/new?groupId=${group.id}`}
            variant="contained"
            size="small"
          >
            New Bet
          </Button>
        </Box>
        {bets.filter((b) => b.status === 'open' || b.status === 'closed').length === 0 ? (
          <Typography color="text.secondary" variant="body2">
            No active bets yet.
          </Typography>
        ) : (
          bets
            .filter((b) => b.status === 'open' || b.status === 'closed')
            .map((b) => (
              <Box
                key={b.id}
                component={RouterLink}
                to={`/bets/${b.id}`}
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  py: 1.5,
                  borderBottom: 1,
                  borderColor: 'divider',
                  textDecoration: 'none',
                  color: 'inherit',
                  '&:hover': { bgcolor: 'action.hover' },
                  px: 1,
                }}
              >
                <Typography variant="body2">{b.title}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {new Date(b.closes_at).toLocaleDateString()}
                </Typography>
              </Box>
            ))
        )}
      </Box>

      <Box>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
          Resolved Bets
        </Typography>
        {bets.filter((b) => b.status === 'resolved' || b.status === 'refunded').length === 0 ? (
          <Typography color="text.secondary" variant="body2">
            No resolved bets yet.
          </Typography>
        ) : (
          bets
            .filter((b) => b.status === 'resolved' || b.status === 'refunded')
            .map((b) => (
              <Box
                key={b.id}
                component={RouterLink}
                to={`/bets/${b.id}`}
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  py: 1.5,
                  borderBottom: 1,
                  borderColor: 'divider',
                  textDecoration: 'none',
                  color: 'inherit',
                  '&:hover': { bgcolor: 'action.hover' },
                  px: 1,
                }}
              >
                <Typography variant="body2">{b.title}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {b.status}
                </Typography>
              </Box>
            ))
        )}
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
