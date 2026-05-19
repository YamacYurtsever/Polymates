import { useEffect, useState } from 'react'
import { useParams, Link as RouterLink } from 'react-router-dom'
import { Alert, Box, Chip, CircularProgress, Divider, Typography } from '@mui/material'
import { supabase } from '../lib/supabase'
import { useCountdown } from '../hooks/useCountdown'
import { EvidencePanel } from '../components/EvidencePanel'
import { PositionsBreakdown } from '../components/PositionsBreakdown'
import { VerdictPanel } from '../components/VerdictPanel'
import { WageringPanel } from '../components/WageringPanel'
import type { Bet, BetPosition, Verdict } from '../types'

export function BetPage() {
  const { id } = useParams<{ id: string }>()
  const [bet, setBet] = useState<Bet | null>(null)
  const [positions, setPositions] = useState<BetPosition[]>([])
  const [verdict, setVerdict] = useState<Verdict | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return

    type BetRow = {
      id: string
      title: string
      description: string
      closes_at: string
      status: 'open' | 'closed'
      created_at: string
      group_id: string
      users: { username: string } | null
      groups: { name: string } | null
    }
    type PositionRow = {
      user_id: string
      side: 'yes' | 'no'
      amount: number
      users: { username: string } | null
    }

    async function fetchBet() {
      const [betRes, posRes, verdictRes] = await Promise.all([
        supabase
          .from('bets')
          .select(
            'id, title, description, closes_at, status, created_at, group_id, users(username), groups(name)',
          )
          .eq('id', id!)
          .single(),
        supabase
          .from('bet_positions')
          .select('user_id, side, amount, users(username)')
          .eq('bet_id', id!),
        supabase.from('verdicts').select('outcome, reasoning').eq('bet_id', id!).maybeSingle(),
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
          group_name: row.groups?.name ?? 'Group',
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

      if (!verdictRes.error && verdictRes.data) {
        setVerdict(verdictRes.data as Verdict)
      }

      setLoading(false)
    }

    fetchBet()

    // Realtime: re-fetch verdict when it's inserted
    const channel = supabase
      .channel(`verdict-${id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'verdicts', filter: `bet_id=eq.${id}` },
        (payload) => {
          const v = payload.new as { outcome: string; reasoning: string }
          setVerdict({ outcome: v.outcome as Verdict['outcome'], reasoning: v.reasoning })
          setBet((prev) => (prev ? { ...prev, status: 'closed' } : prev))
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [id])

  function handleWager(position: BetPosition) {
    setPositions((prev) => [...prev, position])
  }

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
    <Box sx={{ maxWidth: 720, mx: 'auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
        <Chip label={bet.status.toUpperCase()} color={statusColor[bet.status]} size="small" />
        <Typography variant="caption" color="text.secondary">
          by {bet.creator_username} ·{' '}
          <RouterLink
            to={`/groups/${bet.group_id}`}
            style={{ color: 'inherit', textDecoration: 'underline' }}
          >
            {bet.group_name}
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
          Deadline:
        </Typography>
        <Typography variant="body2">{new Date(bet.closes_at).toLocaleString()}</Typography>
        {countdown && bet.status === 'open' && (
          <Chip label={`⏱ ${countdown}`} size="small" variant="outlined" />
        )}
      </Box>

      <Divider sx={{ mb: 3 }} />

      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
        Place Your Bet
      </Typography>
      <WageringPanel
        betId={bet.id}
        groupId={bet.group_id}
        status={bet.status}
        onWager={handleWager}
      />

      <Divider sx={{ my: 3 }} />

      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
        Positions
      </Typography>
      <PositionsBreakdown positions={positions} />

      <Divider sx={{ my: 3 }} />

      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
        Evidence
      </Typography>
      <EvidencePanel betId={bet.id} closesAt={bet.closes_at} status={bet.status} />

      <Divider sx={{ my: 3 }} />

      {verdict ? (
        <>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            Verdict
          </Typography>
          <VerdictPanel verdict={verdict} positions={positions} />
        </>
      ) : bet.status === 'closed' ? (
        <Typography variant="body2" color="text.secondary">
          The judge is deliberating…
        </Typography>
      ) : null}
    </Box>
  )
}
