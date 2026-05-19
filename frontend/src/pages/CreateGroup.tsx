import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Alert, Box, Button, TextField, Typography } from '@mui/material'
import { supabase } from '../lib/supabase'

export function CreateGroup() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    const { data: groupId, error } = await supabase.rpc('create_group', { group_name: name })

    if (error) {
      setError(error.message)
      setSubmitting(false)
      return
    }

    navigate(`/groups/${groupId}`)
  }

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>
        New Group
      </Typography>
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}
      >
        {error && <Alert severity="error">{error}</Alert>}
        <TextField
          label="Group name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoFocus
          fullWidth
        />
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button onClick={() => navigate('/dashboard')}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={submitting}>
            {submitting ? 'Creating…' : 'Create Group'}
          </Button>
        </Box>
      </Box>
    </Box>
  )
}
