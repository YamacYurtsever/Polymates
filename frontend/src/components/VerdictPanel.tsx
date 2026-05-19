import { Avatar, Box, Typography } from '@mui/material'
import GavelIcon from '@mui/icons-material/Gavel'
import { tokens } from '../theme'
import type { BetPosition, Verdict } from '../types'

function payout(userAmount: number, winningSide: 'yes' | 'no', positions: BetPosition[]): number {
  const winningTotal = positions
    .filter((p) => p.side === winningSide)
    .reduce((s, p) => s + p.amount, 0)
  const losingTotal = positions
    .filter((p) => p.side !== winningSide)
    .reduce((s, p) => s + p.amount, 0)

  if (losingTotal === 0 || winningTotal === 0) return 0
  return Math.floor(losingTotal * (userAmount / winningTotal))
}

export function VerdictPanel({
  verdict,
  positions,
}: {
  verdict: Verdict
  positions: BetPosition[]
}) {
  const isYes = verdict.outcome === 'yes'
  const main = isYes ? tokens.yes : tokens.no
  const tint = isYes ? tokens.yesTint : tokens.noTint
  const winners = positions.filter((p) => p.side === verdict.outcome)
  const losers = positions.filter((p) => p.side !== verdict.outcome)
  const losingTotal = losers.reduce((s, p) => s + p.amount, 0)
  const zeroPool = losingTotal === 0       // everyone bet the winning side
  const zeroWinners = winners.length === 0 // everyone bet the losing side
  const stakesReturned = zeroPool || zeroWinners

  return (
    <Box
      sx={{
        border: 1.5,
        borderColor: main,
        borderRadius: 1.5,
        bgcolor: '#fff',
        overflow: 'hidden',
      }}
    >
      <Box sx={{ bgcolor: tint, px: { xs: 2.5, sm: 3 }, py: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <GavelIcon sx={{ fontSize: 16, color: main }} />
          <Typography
            sx={{
              fontSize: '0.7rem',
              fontWeight: 650,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: main,
            }}
          >
            The honourable judge rules
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 2, mb: 2 }}>
          <Typography
            className="tabular"
            sx={{
              fontWeight: 650,
              fontSize: { xs: '2rem', sm: '2.5rem' },
              letterSpacing: '-0.03em',
              lineHeight: 1,
              color: main,
            }}
          >
            {verdict.outcome.toUpperCase()}
          </Typography>
        </Box>
        <Typography
          sx={{
            fontStyle: 'italic',
            color: tokens.ink,
            lineHeight: 1.6,
            fontSize: '0.975rem',
          }}
        >
          "{verdict.reasoning}"
        </Typography>
      </Box>

      <Box sx={{ px: { xs: 2.5, sm: 3 }, py: 2.5 }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
            gap: { xs: 3, md: 4 },
          }}
        >
          <Box>
            <Typography
              sx={{
                fontSize: '0.7rem',
                fontWeight: 650,
                letterSpacing: '0.12em',
                color: tokens.inkSecondary,
                mb: 1,
              }}
            >
              WINNERS · {winners.length}
            </Typography>
            {winners.length === 0 ? (
              <Typography variant="caption" color="text.secondary">
                None
              </Typography>
            ) : (
              winners.map((p) => {
                const winnings = stakesReturned ? 0 : payout(p.amount, verdict.outcome, positions)
                return (
                  <Box
                    key={p.user_id}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.25,
                      py: 0.75,
                      borderBottom: 1,
                      borderColor: 'divider',
                      '&:last-child': { borderBottom: 0 },
                    }}
                  >
                    <Avatar
                      sx={{
                        width: 22,
                        height: 22,
                        fontSize: '0.65rem',
                        fontWeight: 600,
                        bgcolor: tokens.hairline,
                        color: tokens.ink,
                      }}
                    >
                      {p.username[0]?.toUpperCase() ?? '?'}
                    </Avatar>
                    <Typography sx={{ fontSize: '0.875rem' }}>{p.username}</Typography>
                    <Typography
                      className="tabular"
                      sx={{ color: tokens.yes, fontWeight: 650, fontSize: '0.875rem' }}
                    >
                      +{winnings}
                    </Typography>
                  </Box>
                )
              })
            )}
          </Box>

          <Box>
            <Typography
              sx={{
                fontSize: '0.7rem',
                fontWeight: 650,
                letterSpacing: '0.12em',
                color: tokens.inkSecondary,
                mb: 1,
              }}
            >
              LOSERS · {losers.length}
            </Typography>
            {losers.length === 0 ? (
              <Typography variant="caption" color="text.secondary">
                None
              </Typography>
            ) : (
              losers.map((p) => (
                <Box
                  key={p.user_id}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.25,
                    py: 0.75,
                    borderBottom: 1,
                    borderColor: 'divider',
                    '&:last-child': { borderBottom: 0 },
                  }}
                >
                  <Avatar
                    sx={{
                      width: 22,
                      height: 22,
                      fontSize: '0.65rem',
                      fontWeight: 600,
                      bgcolor: tokens.hairline,
                      color: tokens.ink,
                    }}
                  >
                    {p.username[0]?.toUpperCase() ?? '?'}
                  </Avatar>
                  <Typography sx={{ fontSize: '0.875rem' }}>{p.username}</Typography>
                  <Typography
                    className="tabular"
                    sx={{ color: zeroWinners ? tokens.yes : tokens.no, fontWeight: 650, fontSize: '0.875rem' }}
                  >
                    {zeroWinners ? `+${p.amount}` : `−${p.amount}`}
                  </Typography>
                </Box>
              ))
            )}
          </Box>
        </Box>

        {stakesReturned && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: 'block', mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}
          >
            Everyone bet the same side — stakes returned, no redistribution.
          </Typography>
        )}
      </Box>
    </Box>
  )
}
