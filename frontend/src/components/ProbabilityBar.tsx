import { Box, Typography } from '@mui/material'
import { tokens } from '../theme'

interface Props {
  yesTotal: number
  noTotal: number
  size?: 'sm' | 'md' | 'lg'
  showLabels?: boolean
}

export function ProbabilityBar({ yesTotal, noTotal, size = 'md', showLabels = true }: Props) {
  const total = yesTotal + noTotal
  const yesPct = total > 0 ? (yesTotal / total) * 100 : 50
  const noPct = 100 - yesPct

  const yesDisplay = total > 0 ? Math.round(yesPct) : 50
  const noDisplay = 100 - yesDisplay

  const heights = { sm: 6, md: 10, lg: 14 }
  const pctSize = { sm: '0.875rem', md: '1.5rem', lg: '2.25rem' }
  const labelSize = { sm: '0.7rem', md: '0.72rem', lg: '0.78rem' }

  return (
    <Box>
      {showLabels && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            mb: size === 'lg' ? 1 : 0.75,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.75 }}>
            <Typography
              className="tabular"
              sx={{
                color: tokens.yes,
                fontWeight: 650,
                fontSize: pctSize[size],
                letterSpacing: '-0.02em',
                lineHeight: 1,
              }}
            >
              {yesDisplay}%
            </Typography>
            <Typography
              sx={{
                color: tokens.yes,
                fontWeight: 600,
                fontSize: labelSize[size],
                letterSpacing: '0.08em',
              }}
            >
              YES
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.75 }}>
            <Typography
              sx={{
                color: tokens.no,
                fontWeight: 600,
                fontSize: labelSize[size],
                letterSpacing: '0.08em',
              }}
            >
              NO
            </Typography>
            <Typography
              className="tabular"
              sx={{
                color: tokens.no,
                fontWeight: 650,
                fontSize: pctSize[size],
                letterSpacing: '-0.02em',
                lineHeight: 1,
              }}
            >
              {noDisplay}%
            </Typography>
          </Box>
        </Box>
      )}
      <Box
        sx={{
          display: 'flex',
          height: heights[size],
          borderRadius: 999,
          overflow: 'hidden',
          bgcolor: tokens.hairline,
        }}
      >
        <Box
          sx={{
            width: `${yesPct}%`,
            bgcolor: tokens.yes,
            transition: 'width 250ms ease-out',
          }}
        />
        <Box
          sx={{
            width: `${noPct}%`,
            bgcolor: tokens.no,
            transition: 'width 250ms ease-out',
          }}
        />
      </Box>
    </Box>
  )
}
