import { Routes, Route, Navigate, Link as RouterLink } from 'react-router-dom'
import { Button, AppBar, Toolbar, Typography, Box } from '@mui/material'
import { useAuth } from './contexts/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Login } from './pages/auth/Login'
import { SignUp } from './pages/auth/SignUp'
import { Profile } from './pages/Profile'

function Navbar() {
  const { signOut } = useAuth()
  return (
    <AppBar
      position="static"
      elevation={0}
      color="default"
      sx={{ borderBottom: 1, borderColor: 'divider' }}
    >
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700 }}>
          Polymates
        </Typography>
        <Button component={RouterLink} to="/profile" size="small">
          Profile
        </Button>
        <Button onClick={signOut} size="small">
          Sign out
        </Button>
      </Toolbar>
    </AppBar>
  )
}

function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <Navbar />
      <Box component="main" sx={{ p: 3 }}>
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
            <div>Dashboard</div>
          </ProtectedLayout>
        }
      />
      <Route
        path="/groups/:id"
        element={
          <ProtectedLayout>
            <div>Group</div>
          </ProtectedLayout>
        }
      />
      <Route
        path="/bets/new"
        element={
          <ProtectedLayout>
            <div>Create Bet</div>
          </ProtectedLayout>
        }
      />
      <Route
        path="/bets/:id"
        element={
          <ProtectedLayout>
            <div>Bet</div>
          </ProtectedLayout>
        }
      />
      <Route
        path="/invite/:token"
        element={
          <ProtectedLayout>
            <div>Join Group</div>
          </ProtectedLayout>
        }
      />
      <Route
        path="/leaderboard/:groupId"
        element={
          <ProtectedLayout>
            <div>Leaderboard</div>
          </ProtectedLayout>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedLayout>
            <Profile />
          </ProtectedLayout>
        }
      />

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default App
