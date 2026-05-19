import { Box, LinearProgress, Typography } from '@mui/material'
import type { BetPosition } from '../types'

function SideList({
  positions,
  color,
  align = 'left',
}: {
  positions: BetPosition[]
  color: string
  align?: 'left' | 'right'
}) {
  if (positions.length === 0) {
    return (
      <Typography variant="caption" color="text.secondary" sx={{ textAlign: align }}>
        No bets yet
      </Typography>
    )
  }
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
      {positions.map((p) => (
        <Box
          key={p.user_id}
          sx={{ display: 'flex', gap: 0.5, justifyContent: align === 'right' ? 'flex-end' : 'flex-start' }}
        >
          <Typography variant="caption">{p.username}</Typography>
          <Typography variant="caption" sx={{ fontWeight: 600, color }}>
            — {p.amount} pts
          </Typography>
        </Box>
      ))}
    </Box>
  )
}

export function PositionsBreakdown({ positions }: { positions: BetPosition[] }) {
  const yes = positions.filter((p) => p.side === 'yes')
  const no = positions.filter((p) => p.side === 'no')
  const yesTotal = yes.reduce((s, p) => s + p.amount, 0)
  const noTotal = no.reduce((s, p) => s + p.amount, 0)
  const total = yesTotal + noTotal
  const yesPct = total > 0 ? Math.round((yesTotal / total) * 100) : 50

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.main' }}>
          YES — {yesTotal} pts ({yes.length} bettors)
        </Typography>
        <Typography variant="body2" sx={{ fontWeight: 600, color: 'error.main' }}>
          NO — {noTotal} pts ({no.length} bettors)
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
      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, mb: 2, display: 'block' }}>
        {total} pts total at stake
      </Typography>

      <Box sx={{ display: 'flex', gap: 4 }}>
        <Box sx={{ flex: 1 }}>
          <SideList positions={yes} color="success.main" />
        </Box>
        <Box sx={{ flex: 1 }}>
          <SideList positions={no} color="error.main" align="right" />
        </Box>
      </Box>
    </Box>
  )
}
