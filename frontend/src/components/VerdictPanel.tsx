import { Box, Chip, Divider, Paper, Typography } from '@mui/material'
import GavelIcon from '@mui/icons-material/Gavel'
import type { BetPosition, Verdict } from '../types'

function payout(userAmount: number, winningSide: 'yes' | 'no', positions: BetPosition[]): number {
  const winningTotal = positions
    .filter((p) => p.side === winningSide)
    .reduce((s, p) => s + p.amount, 0)
  const losingTotal = positions
    .filter((p) => p.side !== winningSide)
    .reduce((s, p) => s + p.amount, 0)

  if (losingTotal === 0) return 0
  return Math.floor(losingTotal * (userAmount / winningTotal))
}

export function VerdictPanel({
  verdict,
  positions,
}: {
  verdict: Verdict
  positions: BetPosition[]
}) {
  const winners = positions.filter((p) => p.side === verdict.outcome)
  const losers = positions.filter((p) => p.side !== verdict.outcome)
  const losingTotal = losers.reduce((s, p) => s + p.amount, 0)
  const winningTotal = winners.reduce((s, p) => s + p.amount, 0)
  const zeroPool = losingTotal === 0

  return (
    <Paper
      variant="outlined"
      sx={{ p: 3, borderColor: verdict.outcome === 'yes' ? 'success.main' : 'error.main' }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <GavelIcon fontSize="small" color="action" />
        <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
          The Honourable Judge rules…
        </Typography>
      </Box>

      <Chip
        label={verdict.outcome.toUpperCase()}
        color={verdict.outcome === 'yes' ? 'success' : 'error'}
        sx={{ fontWeight: 700, fontSize: '1rem', px: 1, mb: 2 }}
      />

      <Typography
        variant="body2"
        sx={{ fontStyle: 'italic', color: 'text.secondary', mb: 3, lineHeight: 1.7 }}
      >
        "{verdict.reasoning}"
      </Typography>

      <Divider sx={{ mb: 2 }} />

      <Box sx={{ display: 'flex', gap: 4 }}>
        <Box sx={{ flex: 1 }}>
          <Typography
            variant="caption"
            sx={{ fontWeight: 600, color: 'success.main', display: 'block', mb: 0.5 }}
          >
            WINNERS
          </Typography>
          {winners.length === 0 ? (
            <Typography variant="caption" color="text.secondary">
              None
            </Typography>
          ) : (
            winners.map((p) => {
              const winnings = zeroPool ? 0 : payout(p.amount, verdict.outcome, positions)
              return (
                <Box
                  key={p.user_id}
                  sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}
                >
                  <Typography variant="caption">{p.username}</Typography>
                  <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 600 }}>
                    +{winnings} pts
                  </Typography>
                </Box>
              )
            })
          )}
        </Box>

        <Box sx={{ flex: 1, textAlign: 'right' }}>
          <Typography
            variant="caption"
            sx={{ fontWeight: 600, color: 'error.main', display: 'block', mb: 0.5 }}
          >
            LOSERS
          </Typography>
          {losers.length === 0 ? (
            <Typography variant="caption" color="text.secondary">
              None
            </Typography>
          ) : (
            losers.map((p) => (
              <Box
                key={p.user_id}
                sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}
              >
                <Typography variant="caption" sx={{ color: 'error.main', fontWeight: 600 }}>
                  -{p.amount} pts
                </Typography>
                <Typography variant="caption">{p.username}</Typography>
              </Box>
            ))
          )}
        </Box>
      </Box>

      {zeroPool && winners.length > 0 && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
          All bets were on the winning side — stakes returned, no redistribution.
        </Typography>
      )}

      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
        {winningTotal} pts staked by winners · {losingTotal} pts redistributed
      </Typography>
    </Paper>
  )
}
