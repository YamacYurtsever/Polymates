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

function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <Navbar />
      <Box component="main" sx={{ maxWidth: 800, width: '100%', mx: 'auto', px: 3, py: 4 }}>
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
