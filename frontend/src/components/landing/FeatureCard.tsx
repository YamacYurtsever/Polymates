import type { ReactNode } from 'react'
import { Box, Typography } from '@mui/material'
import { tokens } from '../../theme'

interface Props {
  index: string
  title: string
  body: string
  icon?: ReactNode
}

export function FeatureCard({ index, title, body, icon }: Props) {
  return (
    <Box
      data-reveal
      sx={{
        border: 1,
        borderColor: 'divider',
        borderRadius: 1.25,
        bgcolor: tokens.surface,
        p: { xs: 2.5, md: 3 },
        display: 'flex',
        flexDirection: 'column',
        gap: 1.25,
        height: '100%',
        transition: 'border-color 180ms ease-out, transform 180ms ease-out',
        '&:hover': { borderColor: '#C8C8CD', transform: 'translateY(-2px)' },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography
          className="tabular"
          sx={{
            color: tokens.brand,
            fontWeight: 650,
            fontSize: '0.78rem',
            letterSpacing: '0.08em',
          }}
        >
          {index}
        </Typography>
        {icon && (
          <Box sx={{ color: tokens.inkSecondary, display: 'flex', alignItems: 'center' }}>{icon}</Box>
        )}
      </Box>
      <Typography sx={{ fontWeight: 650, fontSize: '1.1rem', letterSpacing: '-0.01em' }}>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.55 }}>
        {body}
      </Typography>
    </Box>
  )
}
