import { Routes, Route, Navigate } from 'react-router-dom'
import { Box } from '@mui/material'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Navbar } from './components/Navbar'
import { Login } from './pages/auth/Login'
import { SignUp } from './pages/auth/SignUp'
import { Dashboard } from './pages/Dashboard'
import { GroupPage } from './pages/GroupPage'
import { InvitePage } from './pages/InvitePage'
import { BetPage } from './pages/BetPage'
import { BetSharePage } from './pages/BetSharePage'
import { Landing } from './pages/Landing'

function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <Navbar />
      <Box
        component="main"
        sx={{
          maxWidth: 1120,
          width: '100%',
          mx: 'auto',
          px: { xs: 2, sm: 3 },
          py: { xs: 3, sm: 5 },
        }}
      >
        {children}
      </Box>
    </ProtectedRoute>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<SignUp />} />

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
        path="/bets/:id"
        element={
          <ProtectedLayout>
            <BetPage />
          </ProtectedLayout>
        }
      />
      <Route path="/invite/:token" element={<InvitePage />} />
      <Route path="/share/:token" element={<BetSharePage />} />
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
