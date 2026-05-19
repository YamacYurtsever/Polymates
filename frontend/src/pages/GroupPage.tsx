import { useEffect, useState } from 'react'
import { useParams, Link as RouterLink, useNavigate } from 'react-router-dom'
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Snackbar,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import AddIcon from '@mui/icons-material/Add'
import { LoadingGavel } from '../components/LoadingGavel'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { ProbabilityBar } from '../components/ProbabilityBar'
import { useCountdown } from '../hooks/useCountdown'
import { tokens } from '../theme'

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
interface BetRow {
  id: string
  title: string
  closes_at: string
  status: 'open' | 'closed'
  yes_total: number
  no_total: number
  verdict_outcome: 'yes' | 'no' | null
}

const minDatetime = () => new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16)

function ActiveBetCard({ bet }: { bet: BetRow }) {
  const countdown = useCountdown(bet.closes_at)
  return (
    <Box
      component={RouterLink}
      to={`/bets/${bet.id}`}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 1.25,
        p: 2,
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Chip label="open" size="small" variant="outlined" sx={{ color: tokens.yes }} />
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
    </Box>
  )
}

function ResolvedBetCard({ bet }: { bet: BetRow }) {
  const isYes = bet.verdict_outcome === 'yes'
  const main = bet.verdict_outcome ? (isYes ? tokens.yes : tokens.no) : tokens.inkSecondary
  const chipLabel = bet.verdict_outcome ? bet.verdict_outcome.toUpperCase() : 'pending'
  return (
    <Box
      component={RouterLink}
      to={`/bets/${bet.id}`}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 1.25,
        p: 2,
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Chip label={chipLabel} size="small" variant="outlined" sx={{ color: main }} />
        <Typography variant="caption" color="text.secondary">
          {new Date(bet.closes_at).toLocaleDateString()}
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
    </Box>
  )
}

export function GroupPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [group, setGroup] = useState<Group | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [bets, setBets] = useState<BetRow[]>([])
  const [tab, setTab] = useState(0)

  const [betModalOpen, setBetModalOpen] = useState(false)
  const [betTitle, setBetTitle] = useState('')
  const [betDescription, setBetDescription] = useState('')
  const [betClosesAt, setBetClosesAt] = useState('')
  const [betSubmitting, setBetSubmitting] = useState(false)
  const [betError, setBetError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    type MemberRow = { user_id: string; points: number; users: { username: string } | null }
    type RawBetRow = {
      id: string
      title: string
      closes_at: string
      status: 'open' | 'closed'
      bet_positions: { side: 'yes' | 'no'; amount: number }[]
      verdicts: { outcome: 'yes' | 'no' } | null
    }
    async function fetchGroup() {
      setLoading(true)
      const [groupRes, membersRes, betsRes] = await Promise.all([
        supabase.from('groups').select('id, name, invite_token').eq('id', id!).single(),
        supabase
          .from('group_members')
          .select('user_id, points, users(username)')
          .eq('group_id', id!)
          .order('points', { ascending: false }),
        supabase
          .from('bets')
          .select(
            'id, title, closes_at, status, bet_positions(side, amount), verdicts(outcome)',
          )
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
        const mapped: BetRow[] = ((betsRes.data ?? []) as unknown as RawBetRow[]).map((b) => ({
          id: b.id,
          title: b.title,
          closes_at: b.closes_at,
          status: b.status,
          yes_total: b.bet_positions
            .filter((p) => p.side === 'yes')
            .reduce((s, p) => s + p.amount, 0),
          no_total: b.bet_positions
            .filter((p) => p.side === 'no')
            .reduce((s, p) => s + p.amount, 0),
          verdict_outcome: b.verdicts?.outcome ?? null,
        }))
        setBets(mapped)
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
  function openBetModal() {
    setBetTitle('')
    setBetDescription('')
    setBetClosesAt('')
    setBetError(null)
    setBetModalOpen(true)
  }

  async function handleCreateBet(e: React.FormEvent) {
    e.preventDefault()
    if (!id) return
    setBetSubmitting(true)
    setBetError(null)

    const { data: betId, error } = await supabase.rpc('create_bet', {
      p_group_id: id,
      p_title: betTitle,
      p_description: betDescription,
      p_closes_at: new Date(betClosesAt).toISOString(),
    })

    if (error) {
      setBetError(error.message)
      setBetSubmitting(false)
      return
    }
    navigate(`/bets/${betId}`)
  }

  if (loading) {
    return (
      <LoadingGavel centered size={28} />
    )
  }

  if (error || !group) {
    return <Alert severity="error">{error ?? 'Group not found.'}</Alert>
  }

  const now = new Date()
  const activeBets = bets.filter((b) => b.status === 'open' && new Date(b.closes_at) > now)
  const resolvedBets = bets.filter((b) => b.status === 'closed' || new Date(b.closes_at) <= now)
  const myBalance = members.find((m) => m.user_id === user?.id)?.points
  const rankedMembers = [...members].sort((a, b) => b.points - a.points)

  return (
    <Box sx={{ maxWidth: 960, mx: 'auto' }}>
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, flexWrap: 'wrap' }}>
          <Typography variant="h3" sx={{ flexGrow: 1 }}>{group.name}</Typography>
          <Button
            size="small"
            variant="contained"
            startIcon={<AddIcon />}
            onClick={openBetModal}
            sx={{ height: tokens.controlHeightSm }}
          >
            New bet
          </Button>
          <Button
            size="small"
            variant="outlined"
            startIcon={<ContentCopyIcon fontSize="small" />}
            onClick={copyInvite}
            sx={{ height: tokens.controlHeightSm }}
          >
            Copy invite
          </Button>
        </Box>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            flexWrap: 'wrap',
            color: 'text.secondary',
            fontSize: '0.875rem',
          }}
        >
          <Box>
            {members.length} {members.length === 1 ? 'member' : 'members'}
          </Box>
          {myBalance !== undefined && (
            <Box>
              Your balance:{' '}
              <span className="tabular" style={{ fontWeight: 650, color: tokens.brand }}>
                {myBalance.toLocaleString()}
              </span>{' '}
              pts
            </Box>
          )}
        </Box>
      </Box>

      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        sx={{
          mb: 3,
          minHeight: 40,
          borderBottom: 1,
          borderColor: 'divider',
          '& .MuiTab-root': {
            textTransform: 'none',
            fontWeight: 550,
            minHeight: 40,
            py: 1,
            px: 0,
            mr: 3,
            fontSize: '0.9rem',
            color: 'text.secondary',
            '&.Mui-selected': { color: tokens.ink },
          },
          '& .MuiTabs-indicator': { backgroundColor: tokens.ink, height: 2 },
        }}
      >
        <Tab label={`Active · ${activeBets.length}`} />
        <Tab label={`Resolved · ${resolvedBets.length}`} />
        <Tab label={`Members · ${members.length}`} />
      </Tabs>

      {tab === 0 &&
        (activeBets.length === 0 ? (
          <Box
            sx={{
              border: 1,
              borderStyle: 'dashed',
              borderColor: 'divider',
              borderRadius: 1.25,
              p: 5,
              textAlign: 'center',
            }}
          >
            <Typography variant="body2" color="text.secondary">
              No active bets. Be the first.
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
              <ActiveBetCard key={b.id} bet={b} />
            ))}
          </Box>
        ))}

      {tab === 1 &&
        (resolvedBets.length === 0 ? (
          <Box
            sx={{
              border: 1,
              borderStyle: 'dashed',
              borderColor: 'divider',
              borderRadius: 1.25,
              p: 5,
              textAlign: 'center',
            }}
          >
            <Typography variant="body2" color="text.secondary">
              No resolved bets yet.
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
            {resolvedBets.map((b) => (
              <ResolvedBetCard key={b.id} bet={b} />
            ))}
          </Box>
        ))}

      {tab === 2 && (
        <Box
          sx={{
            border: 1,
            borderColor: 'divider',
            borderRadius: 1.25,
            bgcolor: '#fff',
            overflow: 'hidden',
          }}
        >
          {rankedMembers.map((m, i) => (
            <Box
              key={m.user_id}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                px: 2,
                py: 1.5,
                borderBottom: i === rankedMembers.length - 1 ? 0 : 1,
                borderColor: 'divider',
                bgcolor: i < 3 ? 'rgba(45,91,255,0.02)' : 'transparent',
              }}
            >
              <Typography
                className="tabular"
                sx={{
                  width: 28,
                  fontWeight: 650,
                  fontSize: '0.95rem',
                  color: i < 3 ? tokens.brand : tokens.inkSecondary,
                }}
              >
                {i + 1}
              </Typography>
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  bgcolor: tokens.hairline,
                  color: tokens.ink,
                }}
              >
                {m.username[0]?.toUpperCase() ?? '?'}
              </Avatar>
              <Typography sx={{ fontWeight: 550, fontSize: '0.95rem', flexGrow: 1 }}>
                {m.username}
                {i === 0 && ' 🏆'}
                {m.user_id === user?.id && (
                  <Typography
                    component="span"
                    variant="caption"
                    color="text.secondary"
                    sx={{ ml: 0.75 }}
                  >
                    (you)
                  </Typography>
                )}
              </Typography>
              <Typography className="tabular" sx={{ fontWeight: 650, color: tokens.brand }}>
                {m.points.toLocaleString()} pts
              </Typography>
            </Box>
          ))}
        </Box>
      )}

      <Snackbar
        open={copied}
        autoHideDuration={2000}
        onClose={() => setCopied(false)}
        message="Link copied"
      />

      <Dialog open={betModalOpen} onClose={() => setBetModalOpen(false)} fullWidth maxWidth="sm">
        <Box component="form" onSubmit={handleCreateBet}>
          <DialogTitle sx={{ pb: 1, textAlign: 'center' }}>New bet</DialogTitle>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            {betError && <Alert severity="error">{betError}</Alert>}
            <TextField
              label="The question"
              value={betTitle}
              onChange={(e) => setBetTitle(e.target.value)}
              required
              autoFocus
              fullWidth
              placeholder="Will it rain on Saturday?"
            />
            <TextField
              label="Context & conditions"
              value={betDescription}
              onChange={(e) => setBetDescription(e.target.value)}
              fullWidth
              multiline
              rows={3}
              placeholder="Describe what counts as a win..."
            />
            <TextField
              label="Deadline"
              type="datetime-local"
              value={betClosesAt}
              onChange={(e) => setBetClosesAt(e.target.value)}
              required
              fullWidth
              slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: minDatetime() } }}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2, justifyContent: 'center' }}>
            <Button onClick={() => setBetModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={betSubmitting}>
              {betSubmitting ? 'Creating…' : 'Create bet'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  )
}
