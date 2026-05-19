import { useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import type { BetPosition, BetSide } from '../types'

interface Props {
  betId: string
  groupId: string
  status: 'open' | 'closed'
  onWager: (position: BetPosition) => void
}

export function WageringPanel({ betId, groupId, status, onWager }: Props) {
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
        <CircularProgress size={24} />
      </Box>
    )
  }

  if (existingPosition) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Your position:
        </Typography>
        <Typography
          variant="body2"
          sx={{
            fontWeight: 700,
            color: existingPosition.side === 'yes' ? 'success.main' : 'error.main',
          }}
        >
          {existingPosition.side.toUpperCase()} — {existingPosition.amount} pts
        </Typography>
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

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
    >
      {error && <Alert severity="error">{error}</Alert>}

      <ToggleButtonGroup
        value={side}
        exclusive
        onChange={(_, v) => {
          if (v) setSide(v)
        }}
        size="small"
      >
        <ToggleButton
          value="yes"
          sx={{ px: 4, fontWeight: 700, '&.Mui-selected': { bgcolor: 'success.light' } }}
        >
          YES
        </ToggleButton>
        <ToggleButton
          value="no"
          sx={{ px: 4, fontWeight: 700, '&.Mui-selected': { bgcolor: 'error.light' } }}
        >
          NO
        </ToggleButton>
      </ToggleButtonGroup>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <TextField
          label="Points to stake"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          slotProps={{ htmlInput: { min: 1, max: points ?? undefined } }}
          size="small"
          sx={{ width: 180 }}
          required
        />
        {points !== null && (
          <Typography variant="caption" color="text.secondary">
            Balance: {points} pts
          </Typography>
        )}
      </Box>

      <Box>
        <Button type="submit" variant="contained" disabled={submitting || !isValid}>
          {submitting ? 'Placing…' : 'Place Bet'}
        </Button>
      </Box>
    </Box>
  )
}
