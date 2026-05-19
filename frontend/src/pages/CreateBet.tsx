import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Alert, Box, Button, MenuItem, TextField, Typography } from '@mui/material'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

interface Group {
  id: string
  name: string
}

export function CreateBet() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const preselectedGroupId = searchParams.get('groupId') ?? ''

  const [groups, setGroups] = useState<Group[]>([])
  const [groupId, setGroupId] = useState(preselectedGroupId)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [closesAt, setClosesAt] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [minDatetime] = useState(() =>
    new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16),
  )

  useEffect(() => {
    if (!user) return
    type Row = { groups: { id: string; name: string } | null }
    async function fetchGroups() {
      const { data } = await supabase
        .from('group_members')
        .select('groups(id, name)')
        .eq('user_id', user!.id)
      const mapped = ((data ?? []) as unknown as Row[]).flatMap((row) =>
        row.groups ? [row.groups] : [],
      )
      setGroups(mapped)
      if (!preselectedGroupId && mapped.length > 0) setGroupId(mapped[0].id)
    }
    fetchGroups()
  }, [user, preselectedGroupId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!groupId) return
    setSubmitting(true)
    setError(null)

    const { data: betId, error } = await supabase.rpc('create_bet', {
      p_group_id: groupId,
      p_title: title,
      p_description: description,
      p_closes_at: new Date(closesAt).toISOString(),
    })

    if (error) {
      setError(error.message)
      setSubmitting(false)
      return
    }

    navigate(`/bets/${betId}`)
  }

  return (
    <Box sx={{ maxWidth: 600 }}>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>
        New Bet
      </Typography>
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}
      >
        {error && <Alert severity="error">{error}</Alert>}
        <TextField
          select
          label="Group"
          value={groupId}
          onChange={(e) => setGroupId(e.target.value)}
          required
          fullWidth
        >
          {groups.map((g) => (
            <MenuItem key={g.id} value={g.id}>
              {g.name}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          label="The question"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          fullWidth
          placeholder="Will it rain on Saturday?"
        />
        <TextField
          label="Context and conditions"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          fullWidth
          multiline
          rows={3}
          placeholder="Describe what counts as a win..."
        />
        <TextField
          label="Evidence deadline"
          type="datetime-local"
          value={closesAt}
          onChange={(e) => setClosesAt(e.target.value)}
          required
          fullWidth
          slotProps={{ htmlInput: { min: minDatetime } }}
        />
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button onClick={() => navigate(-1)}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={submitting || !groupId}>
            {submitting ? 'Creating…' : 'Create Bet'}
          </Button>
        </Box>
      </Box>
    </Box>
  )
}
