import { Box, LinearProgress, Typography } from '@mui/material'
import type { BetPosition } from '../types'

export function PositionsBreakdown({ positions }: { positions: BetPosition[] }) {
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
