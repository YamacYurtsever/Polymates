import { Avatar, Box, Typography } from '@mui/material'
import { tokens } from '../theme'
import type { BetPosition } from '../types'

function PositionRow({ position }: { position: BetPosition }) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        py: 1.25,
        borderBottom: 1,
        borderColor: 'divider',
        '&:last-child': { borderBottom: 0 },
      }}
    >
      <Avatar
        sx={{
          width: 28,
          height: 28,
          fontSize: '0.75rem',
          fontWeight: 600,
          bgcolor: tokens.hairline,
          color: tokens.ink,
        }}
      >
        {position.username[0]?.toUpperCase() ?? '?'}
      </Avatar>
      <Typography sx={{ fontWeight: 550, fontSize: '0.9rem', flexGrow: 1 }}>
        {position.username}
      </Typography>
      <Typography
        className="tabular"
        sx={{ fontWeight: 600, fontSize: '0.9rem', minWidth: 70, textAlign: 'right' }}
      >
        {position.amount} pts
      </Typography>
    </Box>
  )
}

export function PositionsBreakdown({ positions }: { positions: BetPosition[] }) {
  const yes = positions.filter((p) => p.side === 'yes')
  const no = positions.filter((p) => p.side === 'no')
  const yesTotal = yes.reduce((s, p) => s + p.amount, 0)
  const noTotal = no.reduce((s, p) => s + p.amount, 0)

  if (positions.length === 0) {
    return (
      <Box
        sx={{
          border: 1,
          borderStyle: 'dashed',
          borderColor: 'divider',
          borderRadius: 1.25,
          p: 5,
          textAlign: 'center',
        }}
      >
        <Typography variant="body2" color="text.secondary">
          No bets yet. Be the first.
        </Typography>
      </Box>
    )
  }

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
        gap: 2,
      }}
    >
      {(['yes', 'no'] as const).map((s) => {
        const list = s === 'yes' ? yes : no
        const total = s === 'yes' ? yesTotal : noTotal
        const main = s === 'yes' ? tokens.yes : tokens.no
        return (
          <Box
            key={s}
            sx={{
              border: 1,
              borderColor: 'divider',
              borderRadius: 1.25,
              bgcolor: '#fff',
              overflow: 'hidden',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                px: 2,
                py: 1.25,
                borderBottom: 1,
                borderColor: 'divider',
              }}
            >
              <Typography
                sx={{
                  fontSize: '0.75rem',
                  fontWeight: 650,
                  letterSpacing: '0.1em',
                  color: main,
                }}
              >
                {s.toUpperCase()} · {list.length}
              </Typography>
              <Typography className="tabular" sx={{ fontWeight: 600, fontSize: '0.85rem' }}>
                {total} pts
              </Typography>
            </Box>
            <Box sx={{ px: 2 }}>
              {list.length === 0 ? (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: 'block', py: 2, textAlign: 'center' }}
                >
                  No bettors yet
                </Typography>
              ) : (
                list.map((p) => <PositionRow key={p.user_id} position={p} />)
              )}
            </Box>
          </Box>
        )
      })}
    </Box>
  )
}
