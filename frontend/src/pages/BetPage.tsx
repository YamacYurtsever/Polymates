import { useEffect, useRef, useState } from 'react'
import { useParams, Link as RouterLink } from 'react-router-dom'
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Divider,
  LinearProgress,
  Paper,
  Typography,
} from '@mui/material'
import { supabase } from '../lib/supabase'

interface Bet {
  id: string
  title: string
  description: string
  closes_at: string
  status: 'open' | 'closed'
  created_at: string
  group_id: string
  creator_username: string
}

interface Position {
  user_id: string
  username: string
  side: 'yes' | 'no'
  amount: number
}

function useCountdown(target: string) {
  const [remaining, setRemaining] = useState(() => new Date(target).getTime() - Date.now())

  useEffect(() => {
    const id = setInterval(() => {
      setRemaining(new Date(target).getTime() - Date.now())
    }, 1000)
    return () => clearInterval(id)
  }, [target])

  if (remaining <= 0) return null

  const totalSeconds = Math.floor(remaining / 1000)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (days > 0) return `${days}d ${hours}h ${minutes}m`
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`
  return `${minutes}m ${seconds}s`
}

function PositionsBreakdown({ positions }: { positions: Position[] }) {
  const yesTotal = positions.filter((p) => p.side === 'yes').reduce((s, p) => s + p.amount, 0)
  const noTotal = positions.filter((p) => p.side === 'no').reduce((s, p) => s + p.amount, 0)
  const total = yesTotal + noTotal

  const yesPct = total > 0 ? Math.round((yesTotal / total) * 100) : 50

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.main' }}>
          YES — {yesTotal} pts ({positions.filter((p) => p.side === 'yes').length} bettors)
        </Typography>
        <Typography variant="body2" sx={{ fontWeight: 600, color: 'error.main' }}>
          NO — {noTotal} pts ({positions.filter((p) => p.side === 'no').length} bettors)
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={yesPct}
        sx={{
          height: 10,
          borderRadius: 5,
          bgcolor: 'error.light',
          '& .MuiLinearProgress-bar': { bgcolor: 'success.main' },
        }}
      />
      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
        {total} pts total at stake
      </Typography>
    </Box>
  )
}

export function BetPage() {
  const { id } = useParams<{ id: string }>()
  const [bet, setBet] = useState<Bet | null>(null)
  const [positions, setPositions] = useState<Position[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const fetchedRef = useRef(false)

  useEffect(() => {
    if (!id || fetchedRef.current) return
    fetchedRef.current = true

    type BetRow = {
      id: string
      title: string
      description: string
      closes_at: string
      status: 'open' | 'closed'
      created_at: string
      group_id: string
      users: { username: string } | null
    }
    type PositionRow = {
      user_id: string
      side: 'yes' | 'no'
      amount: number
      users: { username: string } | null
    }

    async function fetchBet() {
      const [betRes, posRes] = await Promise.all([
        supabase
          .from('bets')
          .select(
            'id, title, description, closes_at, status, created_at, group_id, users(username)',
          )
          .eq('id', id!)
          .single(),
        supabase
          .from('bet_positions')
          .select('user_id, side, amount, users(username)')
          .eq('bet_id', id!),
      ])

      if (betRes.error || !betRes.data) {
        setError(betRes.error?.message ?? 'Bet not found.')
      } else {
        const row = betRes.data as unknown as BetRow
        setBet({
          id: row.id,
          title: row.title,
          description: row.description,
          closes_at: row.closes_at,
          status: row.status,
          created_at: row.created_at,
          group_id: row.group_id,
          creator_username: row.users?.username ?? 'Unknown',
        })
      }

      if (!posRes.error && posRes.data) {
        setPositions(
          ((posRes.data ?? []) as unknown as PositionRow[]).map((row) => ({
            user_id: row.user_id,
            username: row.users?.username ?? 'Unknown',
            side: row.side,
            amount: row.amount,
          })),
        )
      }

      setLoading(false)
    }

    fetchBet()
  }, [id])

  const countdown = useCountdown(bet?.closes_at ?? new Date().toISOString())

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error || !bet) {
    return <Alert severity="error">{error ?? 'Bet not found.'}</Alert>
  }

  const statusColor: Record<string, 'default' | 'success' | 'warning' | 'error'> = {
    open: 'success',
    closed: 'default',
  }

  return (
    <Box sx={{ maxWidth: 720 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
        <Chip label={bet.status.toUpperCase()} color={statusColor[bet.status]} size="small" />
        <Typography variant="caption" color="text.secondary">
          by {bet.creator_username} ·{' '}
          <RouterLink
            to={`/groups/${bet.group_id}`}
            style={{ color: 'inherit', textDecoration: 'underline' }}
          >
            group
          </RouterLink>
        </Typography>
      </Box>

      <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
        {bet.title}
      </Typography>

      {bet.description && (
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          {bet.description}
        </Typography>
      )}

      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 3 }}>
        <Typography variant="body2" color="text.secondary">
          Evidence deadline:
        </Typography>
        <Typography variant="body2">{new Date(bet.closes_at).toLocaleString()}</Typography>
        {countdown && bet.status === 'open' && (
          <Chip label={`⏱ ${countdown}`} size="small" variant="outlined" />
        )}
      </Box>

      <Divider sx={{ mb: 3 }} />

      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
        Positions
      </Typography>
      <PositionsBreakdown positions={positions} />

      <Divider sx={{ my: 3 }} />

      <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: 'action.hover' }}>
        <Typography variant="body2" color="text.secondary">
          Wagering panel — coming in M4
        </Typography>
      </Paper>

      <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: 'action.hover' }}>
        <Typography variant="body2" color="text.secondary">
          Evidence panel — coming in M5
        </Typography>
      </Paper>

      <Paper variant="outlined" sx={{ p: 2, bgcolor: 'action.hover' }}>
        <Typography variant="body2" color="text.secondary">
          Verdict panel — coming in M6
        </Typography>
      </Paper>
    </Box>
  )
}
