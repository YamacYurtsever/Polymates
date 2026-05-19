import { useEffect, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { ProbabilityBar } from '../components/ProbabilityBar'
import { tokens } from '../theme'
import { useCountdown } from '../hooks/useCountdown'

interface Group {
  id: string
  name: string
  member_count: number
  points: number
}

interface ActiveBet {
  id: string
  title: string
  closes_at: string
  group_id: string
  group_name: string
  yes_total: number
  no_total: number
}

function BetCard({ bet }: { bet: ActiveBet }) {
  const countdown = useCountdown(bet.closes_at)
  const total = bet.yes_total + bet.no_total
  return (
    <Box
      component={RouterLink}
      to={`/bets/${bet.id}`}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
        p: 2.25,
        border: 1,
        borderColor: 'divider',
        borderRadius: 1.25,
        bgcolor: '#fff',
        textDecoration: 'none',
        color: 'inherit',
        transition: 'border-color 150ms ease-out',
        '&:hover': { borderColor: '#C8C8CD' },
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
          {bet.group_name}
        </Typography>
        <Typography variant="caption" color="text.secondary" className="tabular">
          {countdown ?? 'closing'}
        </Typography>
      </Box>
      <Typography
        sx={{
          fontWeight: 600,
          fontSize: '0.975rem',
          lineHeight: 1.35,
          minHeight: 42,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {bet.title}
      </Typography>
      <ProbabilityBar yesTotal={bet.yes_total} noTotal={bet.no_total} size="sm" />
      <Typography variant="caption" color="text.secondary" className="tabular">
        {total} pts pool
      </Typography>
    </Box>
  )
}

export function Dashboard() {
  const { user } = useAuth()
  const [groups, setGroups] = useState<Group[]>([])
  const [activeBets, setActiveBets] = useState<ActiveBet[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [name, setName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    type Row = {
      points: number
      groups: {
        id: string
        name: string
        group_members: { count: number }[]
      } | null
    }
    async function fetchData() {
      setLoading(true)
      const { data, error } = await supabase
        .from('group_members')
        .select('points, groups(id, name, group_members(count))')
        .eq('user_id', user!.id)

      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }

      const mapped: Group[] = ((data ?? []) as unknown as Row[]).flatMap((row) => {
        const g = row.groups
        if (!g) return []
        return [
          {
            id: g.id,
            name: g.name,
            member_count: g.group_members?.[0]?.count ?? 0,
            points: row.points,
          },
        ]
      })
      setGroups(mapped)

      const groupIds = mapped.map((g) => g.id)
      if (groupIds.length > 0) {
        type BetRow = {
          id: string
          title: string
          closes_at: string
          group_id: string
          groups: { name: string } | null
          bet_positions: { side: 'yes' | 'no'; amount: number }[]
        }
        const { data: betData } = await supabase
          .from('bets')
          .select('id, title, closes_at, group_id, groups(name), bet_positions(side, amount)')
          .in('group_id', groupIds)
          .eq('status', 'open')
          .order('closes_at', { ascending: true })
          .limit(12)

        const bets: ActiveBet[] = ((betData ?? []) as unknown as BetRow[]).map((b) => ({
          id: b.id,
          title: b.title,
          closes_at: b.closes_at,
          group_id: b.group_id,
          group_name: b.groups?.name ?? 'Group',
          yes_total: b.bet_positions
            .filter((p) => p.side === 'yes')
            .reduce((s, p) => s + p.amount, 0),
          no_total: b.bet_positions
            .filter((p) => p.side === 'no')
            .reduce((s, p) => s + p.amount, 0),
        }))
        setActiveBets(bets)
      }

      setLoading(false)
    }
    fetchData()
  }, [user])

  function openModal() {
    setName('')
    setFormError(null)
    setModalOpen(true)
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setFormError(null)

    const { data: groupId, error } = await supabase.rpc('create_group', { group_name: name })

    if (error) {
      setFormError(error.message)
      setSubmitting(false)
      return
    }

    setGroups((prev) => [...prev, { id: groupId, name, member_count: 1, points: 1000 }])
    setModalOpen(false)
    setSubmitting(false)
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress size={28} />
      </Box>
    )
  }

  return (
    <Box>
      <Box sx={{ mb: 5 }}>
        <Typography variant="h3" sx={{ mb: 1 }}>
          Dashboard
        </Typography>
        <Typography color="text.secondary">
          {groups.length === 0
            ? 'Create your first group to start placing bets.'
            : `You're in ${groups.length} ${groups.length === 1 ? 'group' : 'groups'} · ${activeBets.length} active ${activeBets.length === 1 ? 'bet' : 'bets'}`}
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ mb: 6 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            mb: 2,
          }}
        >
          <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
            Your groups
          </Typography>
          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon fontSize="small" />}
            onClick={openModal}
          >
            New group
          </Button>
        </Box>

        {groups.length === 0 ? (
          <Box
            sx={{
              border: 1,
              borderColor: 'divider',
              borderStyle: 'dashed',
              borderRadius: 1.25,
              p: 5,
              textAlign: 'center',
            }}
          >
            <Typography color="text.secondary" variant="body2">
              No groups yet. Be the first.
            </Typography>
          </Box>
        ) : (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
              gap: 1.5,
            }}
          >
            {groups.map((g) => (
              <Box
                key={g.id}
                component={RouterLink}
                to={`/groups/${g.id}`}
                sx={{
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 1.25,
                  p: 2,
                  bgcolor: '#fff',
                  textDecoration: 'none',
                  color: 'inherit',
                  transition: 'border-color 150ms ease-out',
                  '&:hover': { borderColor: '#C8C8CD' },
                }}
              >
                <Typography sx={{ fontWeight: 600, fontSize: '1.05rem', mb: 0.5 }}>
                  {g.name}
                </Typography>
                <Box
                  sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}
                >
                  <Typography variant="caption" color="text.secondary">
                    {g.member_count} {g.member_count === 1 ? 'member' : 'members'}
                  </Typography>
                  <Typography
                    variant="caption"
                    className="tabular"
                    sx={{ fontWeight: 600, color: tokens.brand }}
                  >
                    {g.points.toLocaleString()} pts
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </Box>

      {groups.length > 0 && (
        <Box>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              mb: 2,
            }}
          >
            <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
              Active bets
            </Typography>
            {activeBets.length > 0 && (
              <Chip
                label={`${activeBets.length} live`}
                size="small"
                variant="outlined"
                sx={{ color: tokens.yes }}
              />
            )}
          </Box>
          {activeBets.length === 0 ? (
            <Box
              sx={{
                border: 1,
                borderColor: 'divider',
                borderStyle: 'dashed',
                borderRadius: 1.25,
                p: 5,
                textAlign: 'center',
              }}
            >
              <Typography color="text.secondary" variant="body2">
                No bets yet. Open a group and start one.
              </Typography>
            </Box>
          ) : (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
                gap: 1.5,
              }}
            >
              {activeBets.map((b) => (
                <BetCard key={b.id} bet={b} />
              ))}
            </Box>
          )}
        </Box>
      )}

      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} fullWidth maxWidth="xs">
        <Box component="form" onSubmit={handleCreate}>
          <DialogTitle sx={{ pb: 1, textAlign: 'center' }}>New group</DialogTitle>
          <DialogContent>
            {formError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {formError}
              </Alert>
            )}
            <TextField
              label="Group name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
              fullWidth
              sx={{ mt: 1 }}
              placeholder="The Tuesday Crew"
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2, justifyContent: 'center' }}>
            <Button onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={submitting}>
              {submitting ? 'Creating…' : 'Create group'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  )
}
