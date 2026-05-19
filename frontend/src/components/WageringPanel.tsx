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
  onWager: (position: BetPosition) => void
}

const QUICK_AMOUNTS = [10, 50, 100] as const

export function WageringPanel({ betId, groupId, status, onWager }: Props) {
  const { user } = useAuth()
  const [points, setPoints] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  const [side, setSide] = useState<BetSide>('yes')
  const [amount, setAmount] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    async function fetchState() {
      const { data } = await supabase
        .from('group_members')
        .select('points')
        .eq('group_id', groupId)
        .eq('user_id', user!.id)
        .single()

      if (data) setPoints(data.points)
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
    setPoints((p) => (p !== null ? p - parsed : null))
    setAmount('')
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

  if (status === 'closed') {
    return (
      <Typography variant="body2" color="text.secondary">
        Betting is closed.
      </Typography>
    )
  }

  const parsedAmount = parseInt(amount) || 0
  const isValid = parsedAmount > 0 && points !== null && parsedAmount <= points

  const accentColor = side === 'yes' ? tokens.yes : tokens.no
  const accentHover = side === 'yes' ? '#1f9b51' : '#cf3a48'

  return (
    <Box component="form" onSubmit={handleSubmit}>
      {error && (
        <Alert severity="error" sx={{ mb: 1.5 }}>
          {error}
        </Alert>
      )}

      <Box
        sx={{
          display: { xs: 'grid', sm: 'flex' },
          gridTemplateAreas: { xs: '"yes no submit" "amount amount quick"' },
          gridTemplateColumns: { xs: '1fr 1fr 1fr' },
          alignItems: 'center',
          gap: 1,
          width: '100%',
        }}
      >
        <ButtonBase
          onClick={() => setSide('yes')}
          sx={{
            gridArea: { xs: 'yes' },
            flex: { sm: 1 },
            py: 1,
            borderRadius: 1,
            border: 1.5,
            borderColor: side === 'yes' ? tokens.yes : 'divider',
            bgcolor: side === 'yes' ? tokens.yesTint : '#fff',
            fontSize: '0.85rem',
            fontWeight: 650,
            letterSpacing: '0.08em',
            color: side === 'yes' ? tokens.yes : 'text.secondary',
            transition: 'all 150ms ease-out',
            '&:hover': { borderColor: tokens.yes },
          }}
        >
          YES
        </ButtonBase>

        <ButtonBase
          onClick={() => setSide('no')}
          sx={{
            gridArea: { xs: 'no' },
            flex: { sm: 1 },
            py: 1,
            borderRadius: 1,
            border: 1.5,
            borderColor: side === 'no' ? tokens.no : 'divider',
            bgcolor: side === 'no' ? tokens.noTint : '#fff',
            fontSize: '0.85rem',
            fontWeight: 650,
            letterSpacing: '0.08em',
            color: side === 'no' ? tokens.no : 'text.secondary',
            transition: 'all 150ms ease-out',
            '&:hover': { borderColor: tokens.no },
          }}
        >
          NO
        </ButtonBase>

        <TextField
          type="number"
          value={amount}
          onChange={(e) => {
            const v = e.target.value
            if (points !== null && parseInt(v) > points) setAmount(String(points))
            else setAmount(v)
          }}
          slotProps={{ htmlInput: { min: 1, max: points ?? undefined, inputMode: 'numeric' } }}
          placeholder={points !== null ? `Max ${points.toLocaleString()}` : 'Amount'}
          size="small"
          sx={{ gridArea: { xs: 'amount' }, flex: { sm: 2 } }}
          required
        />

        <Box sx={{ gridArea: { xs: 'quick' }, display: 'flex', gap: 0.5 }}>
          {QUICK_AMOUNTS.map((n) => (
            <Button
              key={n}
              size="small"
              variant="outlined"
              onClick={() => setAmount(String(Math.min(n, points ?? n)))}
              disabled={points !== null && n > points}
              sx={{ minWidth: 0, width: 36, height: 36, p: 0, fontSize: '0.75rem' }}
            >
              {n}
            </Button>
          ))}
          <Button
            size="small"
            variant="outlined"
            onClick={() => points !== null && setAmount(String(points))}
            disabled={points === null || points === 0}
            sx={{ minWidth: 0, width: 36, height: 36, p: 0, fontSize: '0.75rem' }}
          >
            Max
          </Button>
        </Box>

        <Button
          type="submit"
          variant="contained"
          size="small"
          disabled={submitting || !isValid}
          sx={{
            gridArea: { xs: 'submit' },
            flex: { sm: 1 },
            bgcolor: accentColor,
            '&:hover': { bgcolor: accentHover },
            '&.Mui-disabled': { bgcolor: tokens.hairline, color: tokens.inkSecondary },
            whiteSpace: 'nowrap',
          }}
        >
          {submitting ? 'Placing…' : 'Place bet'}
        </Button>
      </Box>

    </Box>
  )
}
