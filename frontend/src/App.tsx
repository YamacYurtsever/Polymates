import { useState } from 'react'
import { Routes, Route, Navigate, Link as RouterLink } from 'react-router-dom'
import { AppBar, Toolbar, Typography, Box, Menu, MenuItem, Avatar, IconButton } from '@mui/material'
import { useAuth } from './contexts/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Login } from './pages/auth/Login'
import { SignUp } from './pages/auth/SignUp'
import { Dashboard } from './pages/Dashboard'
import { GroupPage } from './pages/GroupPage'
import { InvitePage } from './pages/InvitePage'
import { CreateBet } from './pages/CreateBet'
import { CreateGroup } from './pages/CreateGroup'
import { BetPage } from './pages/BetPage'

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

function Navbar() {
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

function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <Navbar />
      <Box component="main" sx={{ maxWidth: 1200, width: '100%', mx: 'auto', px: 3, py: 4 }}>
        {children}
      </Box>
    </ProtectedRoute>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<SignUp />} />

      <Route
        path="/"
        element={
          <ProtectedLayout>
            <div>Landing</div>
          </ProtectedLayout>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedLayout>
            <Dashboard />
          </ProtectedLayout>
        }
      />
      <Route
        path="/groups/:id"
        element={
          <ProtectedLayout>
            <GroupPage />
          </ProtectedLayout>
        }
      />
      <Route
        path="/groups/new"
        element={
          <ProtectedLayout>
            <CreateGroup />
          </ProtectedLayout>
        }
      />
      <Route
        path="/bets/new"
        element={
          <ProtectedLayout>
            <CreateBet />
          </ProtectedLayout>
        }
      />
      <Route
        path="/bets/:id"
        element={
          <ProtectedLayout>
            <BetPage />
          </ProtectedLayout>
        }
      />
      <Route path="/invite/:token" element={<InvitePage />} />
      <Route
        path="/leaderboard/:groupId"
        element={
          <ProtectedLayout>
            <div>Leaderboard</div>
          </ProtectedLayout>
        }
      />

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default App
