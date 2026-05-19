import { Box } from '@mui/material'
import GavelIcon from '@mui/icons-material/Gavel'

const gavelSx = {
  transformOrigin: 'bottom left',
  animation: 'gavel 1.8s ease-in-out infinite',
  color: 'text.disabled',
  '@keyframes gavel': {
    '0%':   { transform: 'rotate(0deg)' },
    '30%':  { transform: 'rotate(-40deg)' },
    '60%':  { transform: 'rotate(0deg)' },
    '100%': { transform: 'rotate(0deg)' },
  },
}

export function LoadingGavel({ centered = false, size = 22 }: { centered?: boolean; size?: number }) {
  const icon = <GavelIcon sx={{ ...gavelSx, fontSize: size }} />
  if (!centered) return icon
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
      {icon}
    </Box>
  )
}
