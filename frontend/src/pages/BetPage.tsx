import { useEffect, useRef, useState } from 'react'
import { useParams, Link as RouterLink } from 'react-router-dom'
import { Alert, Box, Chip, CircularProgress, Tab, Tabs, Typography } from '@mui/material'
import { supabase } from '../lib/supabase'
import { useCountdownState } from '../hooks/useCountdown'
import { EvidencePanel } from '../components/EvidencePanel'
import { PositionsBreakdown } from '../components/PositionsBreakdown'
import { ProbabilityBar } from '../components/ProbabilityBar'
import { VerdictPanel } from '../components/VerdictPanel'
import { WageringPanel } from '../components/WageringPanel'
import { tokens } from '../theme'
import type { Bet, BetPosition, Verdict } from '../types'

export function BetPage() {
  const { id } = useParams<{ id: string }>()
  const [bet, setBet] = useState<Bet | null>(null)
  const [positions, setPositions] = useState<BetPosition[]>([])
  const [verdict, setVerdict] = useState<Verdict | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState(0)
  const tabSetByVerdict = useRef(false)

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
      } else if (betRes.data) {
        const row = betRes.data as unknown as BetRow
        if (new Date(row.closes_at) < new Date()) {
          supabase.functions.invoke('resolve-bet', { body: { bet_id: id } })
        }
      }

      setLoading(false)
    }

    fetchBet()

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

  useEffect(() => {
    if (verdict && !tabSetByVerdict.current) {
      tabSetByVerdict.current = true
      setTab(1)
    }
  }, [verdict])

  function handleWager(position: BetPosition) {
    setPositions((prev) => [...prev, position])
  }

  const countdown = useCountdownState(bet?.closes_at ?? new Date().toISOString())

  // Invoke resolve-bet when the countdown reaches zero while the user is on the page
  const resolveInvokedRef = useRef(false)
  useEffect(() => {
    if (!id || !bet || verdict || resolveInvokedRef.current) return
    if (countdown === null && new Date(bet.closes_at) < new Date()) {
      resolveInvokedRef.current = true
      supabase.functions.invoke('resolve-bet', { body: { bet_id: id } })
    }
  }, [countdown, bet, verdict, id])

  // Poll for verdict every 3s after deadline as realtime fallback.
  // countdown is a dependency so this re-runs the moment it transitions to null.
  useEffect(() => {
    if (!id || !bet || verdict || countdown !== null) return
    const interval = setInterval(async () => {
      const { data } = await supabase
        .from('verdicts')
        .select('outcome, reasoning')
        .eq('bet_id', id)
        .maybeSingle()
      if (data) {
        setVerdict(data as Verdict)
        setBet((prev) => (prev ? { ...prev, status: 'closed' } : prev))
      }
    }, 3000)
    return () => clearInterval(interval)
  }, [id, bet, verdict, countdown])

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress size={28} />
      </Box>
    )
  }

  if (error || !bet) {
    return <Alert severity="error">{error ?? 'Bet not found.'}</Alert>
  }

  const yesTotal = positions.filter((p) => p.side === 'yes').reduce((s, p) => s + p.amount, 0)
  const noTotal = positions.filter((p) => p.side === 'no').reduce((s, p) => s + p.amount, 0)
  const pool = yesTotal + noTotal
  const isPastDeadline = new Date(bet.closes_at) < new Date()

  return (
    <Box sx={{ maxWidth: 880, mx: 'auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5, flexWrap: 'wrap' }}>
        <Typography variant="caption" color="text.secondary">
          <RouterLink
            to={`/groups/${bet.group_id}`}
            style={{ color: 'inherit', textDecoration: 'none', fontWeight: 600 }}
          >
            {bet.group_name}
          </RouterLink>
          {' · '}by {bet.creator_username}
        </Typography>
        <Box sx={{ flexGrow: 1 }} />
        <Chip
          label={verdict ? 'resolved' : bet.status === 'open' ? 'open' : 'resolving'}
          size="small"
          variant="outlined"
          sx={{
            color: verdict ? tokens.brand : bet.status === 'open' ? tokens.yes : tokens.no,
          }}
        />
      </Box>

      <Typography
        component="h1"
        sx={{
          fontWeight: 650,
          fontSize: { xs: '1.75rem', sm: '2.25rem' },
          letterSpacing: '-0.02em',
          lineHeight: 1.15,
          mb: bet.description ? 1.5 : 3,
        }}
      >
        {bet.title}
      </Typography>

      {bet.description && (
        <Typography color="text.secondary" sx={{ mb: 3, fontSize: '1rem', maxWidth: 680 }}>
          {bet.description}
        </Typography>
      )}

      <Box
        sx={{
          border: 1,
          borderColor: 'divider',
          borderRadius: 1.25,
          bgcolor: '#fff',
          p: { xs: 2.5, sm: 3 },
          mb: 3,
        }}
      >
        <ProbabilityBar yesTotal={yesTotal} noTotal={noTotal} size="lg" />
        <Box
          sx={{
            mt: 2.5,
            pt: 2,
            borderTop: 1,
            borderColor: 'divider',
            display: 'flex',
            columnGap: 4,
            rowGap: 1,
            flexWrap: 'wrap',
          }}
        >
          {[
            { label: 'Pool', value: `${pool.toLocaleString()} pts` },
            { label: 'Bettors', value: String(positions.length) },
          ].map(({ label, value }) => (
            <Box key={label} sx={{ display: 'flex', alignItems: 'baseline', gap: 0.75 }}>
              <Typography variant="caption" color="text.secondary">
                {label}
              </Typography>
              <Typography className="tabular" sx={{ fontWeight: 650, fontSize: '0.9rem' }}>
                {value}
              </Typography>
            </Box>
          ))}
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.75 }}>
            <Typography variant="caption" color="text.secondary">
              Closes
            </Typography>
            <Typography className="tabular" sx={{ fontWeight: 650, fontSize: '0.9rem' }}>
              {new Date(bet.closes_at).toLocaleString([], {
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
              })}
            </Typography>
            {bet.status === 'open' && countdown && (
              <Typography
                className="tabular"
                variant="caption"
                sx={{ fontWeight: 600, color: 'text.secondary' }}
              >
                ({countdown.text})
              </Typography>
            )}
            {bet.status === 'open' && !countdown && (
              <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                (closing)
              </Typography>
            )}
          </Box>
        </Box>
      </Box>

      {verdict && (
        <Box sx={{ mb: 4 }}>
          <VerdictPanel verdict={verdict} positions={positions} />
        </Box>
      )}

      {!verdict && (bet.status === 'closed' || isPastDeadline) && (
        <Box
          sx={{
            mb: 4,
            border: 1,
            borderColor: 'divider',
            borderRadius: 1.25,
            p: 2.5,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            bgcolor: '#fff',
          }}
        >
          <CircularProgress size={14} thickness={5} sx={{ animationDuration: '2.5s' }} />
          <Typography variant="body2" color="text.secondary">
            The judge is deliberating…
          </Typography>
        </Box>
      )}

      {!verdict && !isPastDeadline && bet.status === 'open' && (
        <Box
          sx={{
            border: 1,
            borderColor: 'divider',
            borderRadius: 1.25,
            bgcolor: '#fff',
            p: { xs: 2.5, sm: 3 },
            mb: 4,
          }}
        >
          <WageringPanel
            betId={bet.id}
            groupId={bet.group_id}
            status={bet.status}
            onWager={handleWager}
          />
        </Box>
      )}

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
        <Tab label={`Positions · ${positions.length}`} />
        <Tab label="Evidence" />
      </Tabs>

      {tab === 0 && <PositionsBreakdown positions={positions} />}
      {tab === 1 && (
        <EvidencePanel betId={bet.id} closesAt={bet.closes_at} status={bet.status} />
      )}

    </Box>
  )
}
