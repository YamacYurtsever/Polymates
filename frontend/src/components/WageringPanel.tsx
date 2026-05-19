import { useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  ButtonBase,
  CircularProgress,
  TextField,
  Typography,
} from '@mui/material'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { tokens } from '../theme'
import type { BetPosition, BetSide } from '../types'

interface Props {
  betId: string
  groupId: string
  status: 'open' | 'closed'
  yesTotal: number
  noTotal: number
  onWager: (position: BetPosition) => void
}

const QUICK_AMOUNTS = [10, 50, 100] as const

function SideButton({
  side,
  pct,
  selected,
  onClick,
}: {
  side: BetSide
  pct: number
  selected: boolean
  onClick: () => void
}) {
  const isYes = side === 'yes'
  const main = isYes ? tokens.yes : tokens.no
  const tint = isYes ? tokens.yesTint : tokens.noTint
  return (
    <ButtonBase
      onClick={onClick}
      sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 0.5,
        p: 1.75,
        borderRadius: 1.25,
        border: 1.5,
        borderColor: selected ? main : 'divider',
        bgcolor: selected ? tint : '#fff',
        transition: 'border-color 150ms ease-out, background-color 150ms ease-out',
        textAlign: 'left',
        '&:hover': { borderColor: selected ? main : '#C8C8CD' },
      }}
    >
      <Typography
        sx={{ fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.1em', color: main }}
      >
        {side.toUpperCase()}
      </Typography>
      <Typography
        className="tabular"
        sx={{
          fontWeight: 650,
          fontSize: '1.4rem',
          letterSpacing: '-0.02em',
          color: main,
          lineHeight: 1,
        }}
      >
        {pct}%
      </Typography>
    </ButtonBase>
  )
}

export function WageringPanel({ betId, groupId, status, yesTotal, noTotal, onWager }: Props) {
  const { user } = useAuth()
  const [points, setPoints] = useState<number | null>(null)
  const [existingPosition, setExistingPosition] = useState<BetPosition | null>(null)
  const [loading, setLoading] = useState(true)

  const [side, setSide] = useState<BetSide>('yes')
  const [amount, setAmount] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    async function fetchState() {
      const [pointsRes, positionRes] = await Promise.all([
        supabase
          .from('group_members')
          .select('points')
          .eq('group_id', groupId)
          .eq('user_id', user!.id)
          .single(),
        supabase
          .from('bet_positions')
          .select('user_id, side, amount, users(username)')
          .eq('bet_id', betId)
          .eq('user_id', user!.id)
          .maybeSingle(),
      ])

      if (pointsRes.data) setPoints(pointsRes.data.points)

      if (positionRes.data) {
        type Row = {
          user_id: string
          side: BetSide
          amount: number
          users: { username: string } | null
        }
        const row = positionRes.data as unknown as Row
        setExistingPosition({
          user_id: row.user_id,
          side: row.side,
          amount: row.amount,
          username: row.users?.username ?? 'You',
        })
      }

      setLoading(false)
    }
    fetchState()
  }, [user, betId, groupId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const parsed = parseInt(amount)
    if (!parsed || parsed <= 0) return
    setSubmitting(true)
    setError(null)

    const { error } = await supabase.rpc('place_bet', {
      p_bet_id: betId,
      p_side: side,
      p_amount: parsed,
    })

    if (error) {
      setError(error.message)
      setSubmitting(false)
      return
    }

    const newPosition: BetPosition = {
      user_id: user!.id,
      username: 'You',
      side,
      amount: parsed,
    }
    setExistingPosition(newPosition)
    setPoints((p) => (p !== null ? p - parsed : null))
    onWager(newPosition)
    setSubmitting(false)
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
        <CircularProgress size={20} />
      </Box>
    )
  }

  if (existingPosition) {
    const main = existingPosition.side === 'yes' ? tokens.yes : tokens.no
    const tint = existingPosition.side === 'yes' ? tokens.yesTint : tokens.noTint
    return (
      <Box>
        <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 1.5 }}>
          Your position
        </Typography>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            p: 2,
            border: 1.5,
            borderColor: main,
            bgcolor: tint,
            borderRadius: 1.25,
          }}
        >
          <Typography
            sx={{ fontWeight: 650, color: main, fontSize: '0.85rem', letterSpacing: '0.08em' }}
          >
            {existingPosition.side.toUpperCase()}
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          <Typography
            className="tabular"
            sx={{ fontWeight: 650, color: main, fontSize: '1.1rem' }}
          >
            {existingPosition.amount} pts
          </Typography>
        </Box>
        {points !== null && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            Balance: <span className="tabular">{points}</span> pts in this group
          </Typography>
        )}
      </Box>
    )
  }

  if (status === 'closed') {
    return (
      <Typography variant="body2" color="text.secondary">
        Betting is closed.
      </Typography>
    )
  }

  const parsedAmount = parseInt(amount) || 0
  const isValid = parsedAmount > 0 && points !== null && parsedAmount <= points

  const winningTotal = side === 'yes' ? yesTotal : noTotal
  const losingTotal = side === 'yes' ? noTotal : yesTotal
  const projectedShare =
    parsedAmount > 0 && winningTotal + parsedAmount > 0
      ? parsedAmount / (winningTotal + parsedAmount)
      : 0
  const projectedPayout =
    parsedAmount > 0 ? parsedAmount + Math.floor(losingTotal * projectedShare) : 0

  const total = yesTotal + noTotal
  const yesPct = total > 0 ? Math.round((yesTotal / total) * 100) : 50
  const noPct = 100 - yesPct

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 1.5 }}>
        Place a bet
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
        <SideButton
          side="yes"
          pct={total > 0 ? yesPct : 50}
          selected={side === 'yes'}
          onClick={() => setSide('yes')}
        />
        <SideButton
          side="no"
          pct={total > 0 ? noPct : 50}
          selected={side === 'no'}
          onClick={() => setSide('no')}
        />
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5, flexWrap: 'wrap' }}>
        <TextField
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          slotProps={{ htmlInput: { min: 1, max: points ?? undefined, inputMode: 'numeric' } }}
          placeholder="Amount"
          sx={{ flex: '1 1 140px', minWidth: 140 }}
          required
        />
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          {QUICK_AMOUNTS.map((n) => (
            <Button
              key={n}
              size="small"
              variant="outlined"
              onClick={() => setAmount(String(Math.min(n, points ?? n)))}
              disabled={points !== null && n > points}
              sx={{ minWidth: 44, px: 1 }}
            >
              {n}
            </Button>
          ))}
          <Button
            size="small"
            variant="outlined"
            onClick={() => points !== null && setAmount(String(points))}
            disabled={points === null || points === 0}
            sx={{ minWidth: 44, px: 1 }}
          >
            Max
          </Button>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="caption" color="text.secondary">
          Balance:{' '}
          <span className="tabular">
            {points !== null ? points.toLocaleString() : '—'}
          </span>{' '}
          pts
        </Typography>
        {parsedAmount > 0 && (
          <Typography variant="caption">
            If you win:{' '}
            <span
              className="tabular"
              style={{ fontWeight: 650, color: tokens.yes }}
            >
              +{projectedPayout.toLocaleString()}
            </span>{' '}
            pts
          </Typography>
        )}
      </Box>

      <Button
        type="submit"
        variant="contained"
        size="large"
        fullWidth
        disabled={submitting || !isValid}
        sx={{
          bgcolor: side === 'yes' ? tokens.yes : tokens.no,
          '&:hover': {
            bgcolor: side === 'yes' ? '#1f9b51' : '#cf3a48',
          },
          '&.Mui-disabled': {
            bgcolor: tokens.hairline,
            color: tokens.inkSecondary,
          },
        }}
      >
        {submitting
          ? 'Placing…'
          : isValid
            ? `Place ${parsedAmount} on ${side.toUpperCase()}`
            : `Place bet on ${side.toUpperCase()}`}
      </Button>

      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
        Bets are locked once placed. Choose your side carefully.
      </Typography>
    </Box>
  )
}
