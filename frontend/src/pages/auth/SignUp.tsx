import { useState } from 'react'
import { Link as RouterLink, useNavigate, useSearchParams } from 'react-router-dom'
import { Alert, Box, Button, Link, TextField, Typography } from '@mui/material'
import { supabase } from '../../lib/supabase'
import { tokens } from '../../theme'

export function SignUp() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const next = searchParams.get('next') ?? '/dashboard'
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    })

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
        py: 6,
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
          sx={{
            width: 22,
            height: 22,
            borderRadius: '6px',
            background: `linear-gradient(135deg, ${tokens.brand}, #5B3FFF)`,
          }}
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
        <Typography variant="h4" sx={{ mb: 0.5, fontSize: '1.65rem', letterSpacing: '-0.02em' }}>
          Create your account
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3, fontSize: '0.9rem' }}>
          Start with 1,000 points in every group you join.
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
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            fullWidth
            autoComplete="username"
          />
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
            autoComplete="new-password"
            slotProps={{ htmlInput: { minLength: 6 } }}
          />
          <Button
            type="submit"
            variant="contained"
            size="large"
            fullWidth
            disabled={loading}
            sx={{ mt: 1 }}
          >
            {loading ? 'Creating account…' : 'Sign up'}
          </Button>
        </Box>

        <Typography variant="body2" sx={{ mt: 3, textAlign: 'center', color: 'text.secondary' }}>
          Already have an account?{' '}
          <Link
            component={RouterLink}
            to={next !== '/dashboard' ? `/login?next=${encodeURIComponent(next)}` : '/login'}
            sx={{ color: tokens.brand, fontWeight: 600, textDecoration: 'none' }}
          >
            Log in
          </Link>
        </Typography>
      </Box>
    </Box>
  )
}
