import { forwardRef } from 'react'
import { Box, Typography } from '@mui/material'
import { tokens } from '../../theme'

interface Props {
  yesTotal: number
  noTotal: number
  initialFill?: boolean
}

export interface AnimatedExampleBarHandle {
  yesBar: HTMLDivElement | null
  noBar: HTMLDivElement | null
  yesPct: number
  noPct: number
}

export const AnimatedExampleBar = forwardRef<HTMLDivElement, Props>(function AnimatedExampleBar(
  { yesTotal, noTotal, initialFill = true },
  ref,
) {
  const total = yesTotal + noTotal
  const yesPct = total > 0 ? Math.round((yesTotal / total) * 100) : 50
  const noPct = 100 - yesPct

  return (
    <Box ref={ref} data-example-bar data-yes={yesPct} data-no={noPct}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          mb: 0.75,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.75 }}>
          <Typography
            className="tabular"
            sx={{
              color: tokens.yes,
              fontWeight: 650,
              fontSize: '0.875rem',
              letterSpacing: '-0.02em',
              lineHeight: 1,
            }}
          >
            {yesPct}%
          </Typography>
          <Typography sx={{ color: tokens.yes, fontWeight: 600, fontSize: '0.7rem', letterSpacing: '0.08em' }}>
            YES
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.75 }}>
          <Typography sx={{ color: tokens.no, fontWeight: 600, fontSize: '0.7rem', letterSpacing: '0.08em' }}>
            NO
          </Typography>
          <Typography
            className="tabular"
            sx={{
              color: tokens.no,
              fontWeight: 650,
              fontSize: '0.875rem',
              letterSpacing: '-0.02em',
              lineHeight: 1,
            }}
          >
            {noPct}%
          </Typography>
        </Box>
      </Box>
      <Box sx={{ display: 'flex', height: 6, borderRadius: 999, overflow: 'hidden', bgcolor: tokens.hairline }}>
        <Box
          data-fill="yes"
          sx={{
            width: initialFill ? `${yesPct}%` : '0%',
            bgcolor: tokens.yes,
            willChange: 'width',
          }}
        />
        <Box
          data-fill="no"
          sx={{
            width: initialFill ? `${noPct}%` : '0%',
            bgcolor: tokens.no,
            willChange: 'width',
          }}
        />
      </Box>
    </Box>
  )
})
