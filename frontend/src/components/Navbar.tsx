import { useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import {
  AppBar,
  Avatar,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Toolbar,
  Typography,
} from '@mui/material'
import { useAuth } from '../contexts/AuthContext'
import { tokens } from '../theme'

export function Navbar() {
  const { user, signOut } = useAuth()
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const username = (user?.user_metadata?.username as string | undefined) ?? user?.email ?? '?'
  const initial = username[0]?.toUpperCase() ?? '?'

  return (
    <AppBar
      position="sticky"
      color="default"
      elevation={0}
      sx={{
        bgcolor: 'rgba(250,250,250,0.85)',
        backdropFilter: 'saturate(180%) blur(10px)',
        borderBottom: 1,
        borderColor: 'divider',
      }}
    >
      <Toolbar
        sx={{ maxWidth: 1120, width: '100%', mx: 'auto', px: { xs: 2, sm: 3 }, minHeight: 56 }}
      >
        <Box
          component={RouterLink}
          to="/dashboard"
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            textDecoration: 'none',
            color: 'inherit',
            flexGrow: 1,
          }}
        >
          <Box
            sx={{
              width: 22,
              height: 22,
              borderRadius: '6px',
              background: `linear-gradient(135deg, ${tokens.brand}, #5B3FFF)`,
            }}
          />
          <Typography
            sx={{
              fontWeight: 650,
              fontSize: '1.05rem',
              letterSpacing: '-0.015em',
              color: tokens.ink,
            }}
          >
            Polymates
          </Typography>
        </Box>

        <IconButton
          aria-label="Account menu"
          size="small"
          onClick={(e) => setAnchorEl(e.currentTarget)}
          sx={{ p: 0.5 }}
        >
          <Avatar
            sx={{
              width: 30,
              height: 30,
              bgcolor: tokens.ink,
              color: '#fff',
              fontSize: '0.8rem',
              fontWeight: 600,
            }}
          >
            {initial}
          </Avatar>
        </IconButton>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => setAnchorEl(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          slotProps={{
            paper: {
              variant: 'outlined',
              sx: { mt: 1, minWidth: 180, borderRadius: 1.25 },
            },
          }}
        >
          <MenuItem
            disabled
            sx={{
              opacity: '1 !important',
              flexDirection: 'column',
              alignItems: 'flex-start',
              py: 1,
            }}
          >
            <Typography variant="caption" color="text.secondary">
              Signed in as
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {username}
            </Typography>
          </MenuItem>
          <MenuItem
            onClick={() => {
              setAnchorEl(null)
              signOut()
            }}
          >
            Sign out
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  )
}
