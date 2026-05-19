import { useState } from 'react'
import { Link as RouterLink, useNavigate, useSearchParams } from 'react-router-dom'
import { Alert, Box, Button, Link, TextField, Typography } from '@mui/material'
import { supabase } from '../../lib/supabase'
import { tokens } from '../../theme'
import logo from '../../assets/logo.png'

export function Login() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const next = searchParams.get('next') ?? '/dashboard'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) setError(error.message)
    else navigate(next)
    setLoading(false)
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2,
        bgcolor: tokens.bg,
      }}
    >
      <Box
        component={RouterLink}
        to="/"
        sx={{
          position: 'fixed',
          top: 20,
          left: 24,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          textDecoration: 'none',
          color: 'inherit',
        }}
      >
        <Box
          component="img"
          src={logo}
          alt="Polymates"
          sx={{ width: 24, height: 24, objectFit: 'contain' }}
        />
        <Typography sx={{ fontWeight: 650, fontSize: '1.05rem', letterSpacing: '-0.015em' }}>
          Polymates
        </Typography>
      </Box>

      <Box
        sx={{
          width: '100%',
          maxWidth: 380,
          p: { xs: 3, sm: 4 },
          border: 1,
          borderColor: 'divider',
          borderRadius: 1.5,
          bgcolor: '#fff',
        }}
      >
        <Typography
          variant="h4"
          sx={{ mb: 0.5, fontSize: '1.65rem', letterSpacing: '-0.02em' }}
        >
          Welcome back
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3, fontSize: '0.9rem' }}>
          Log in to continue.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}
        >
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            fullWidth
            autoComplete="email"
          />
          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            fullWidth
            autoComplete="current-password"
          />
          <Button type="submit" variant="contained" size="large" fullWidth disabled={loading} sx={{ mt: 1 }}>
            {loading ? 'Logging in…' : 'Log in'}
          </Button>
        </Box>

        <Typography variant="body2" sx={{ mt: 3, textAlign: 'center', color: 'text.secondary' }}>
          No account?{' '}
          <Link
            component={RouterLink}
            to={next !== '/dashboard' ? `/signup?next=${encodeURIComponent(next)}` : '/signup'}
            sx={{ color: tokens.brand, fontWeight: 600, textDecoration: 'none' }}
          >
            Sign up
          </Link>
        </Typography>
      </Box>
    </Box>
  )
}
