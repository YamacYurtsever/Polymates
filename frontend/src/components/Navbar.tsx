import { useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { AppBar, Avatar, IconButton, Menu, MenuItem, Toolbar, Typography } from '@mui/material'
import { useAuth } from '../contexts/AuthContext'

function AccountMenu() {
  const { user, signOut } = useAuth()
  const [anchor, setAnchor] = useState<null | HTMLElement>(null)
  const initial = (user?.email?.[0] ?? '?').toUpperCase()

  return (
    <>
      <IconButton onClick={(e) => setAnchor(e.currentTarget)} size="small">
        <Avatar sx={{ width: 32, height: 32, fontSize: 14 }}>{initial}</Avatar>
      </IconButton>
      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}>
        <MenuItem onClick={signOut}>Sign out</MenuItem>
      </Menu>
    </>
  )
}

export function Navbar() {
  return (
    <AppBar
      position="static"
      elevation={0}
      color="default"
      sx={{ borderBottom: 1, borderColor: 'divider' }}
    >
      <Toolbar>
        <Typography
          variant="h6"
          component={RouterLink}
          to="/dashboard"
          sx={{ flexGrow: 1, fontWeight: 700, textDecoration: 'none', color: 'inherit' }}
        >
          Polymates
        </Typography>
        <AccountMenu />
      </Toolbar>
    </AppBar>
  )
}
