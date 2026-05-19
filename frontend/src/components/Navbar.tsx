import { Link as RouterLink } from 'react-router-dom'
import { AppBar, Button, Toolbar, Typography } from '@mui/material'
import { useAuth } from '../contexts/AuthContext'

export function Navbar() {
  const { signOut } = useAuth()

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
        <Button size="small" onClick={signOut}>
          Sign out
        </Button>
      </Toolbar>
    </AppBar>
  )
}
