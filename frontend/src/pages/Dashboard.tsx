import { useEffect, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import {
  Alert,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from '@mui/material'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

interface Group {
  id: string
  name: string
  member_count: number
}

export function Dashboard() {
  const { user } = useAuth()
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [name, setName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    type Row = { groups: { id: string; name: string; group_members: { count: number }[] } | null }
    async function fetchGroups() {
      setLoading(true)
      const { data, error } = await supabase
        .from('group_members')
        .select('groups(id, name, group_members(count))')
        .eq('user_id', user!.id)

      if (error) {
        setError(error.message)
      } else {
        const mapped: Group[] = ((data ?? []) as unknown as Row[]).flatMap((row) => {
          const g = row.groups
          if (!g) return []
          return [{ id: g.id, name: g.name, member_count: g.group_members?.[0]?.count ?? 0 }]
        })
        setGroups(mapped)
      }
      setLoading(false)
    }
    fetchGroups()
  }, [user])

  function openModal() {
    setName('')
    setFormError(null)
    setModalOpen(true)
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setFormError(null)

    const { data: groupId, error } = await supabase.rpc('create_group', { group_name: name })

    if (error) {
      setFormError(error.message)
      setSubmitting(false)
      return
    }

    setGroups((prev) => [...prev, { id: groupId, name, member_count: 1 }])
    setModalOpen(false)
    setSubmitting(false)
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Your Groups
        </Typography>
        <Button variant="contained" onClick={openModal}>
          Create Group
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
          <CircularProgress />
        </Box>
      ) : groups.length === 0 ? (
        <Typography color="text.secondary">
          You're not in any groups yet. Create one to get started.
        </Typography>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: 2,
          }}
        >
          {groups.map((g) => (
            <Card key={g.id} variant="outlined">
              <CardActionArea component={RouterLink} to={`/groups/${g.id}`}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {g.name}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mt: 0.5, display: 'block' }}
                  >
                    {g.member_count} {g.member_count === 1 ? 'member' : 'members'}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          ))}
        </Box>
      )}

      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} fullWidth maxWidth="xs">
        <Box component="form" onSubmit={handleCreate}>
          <DialogTitle sx={{ textAlign: 'center' }}>New Group</DialogTitle>
          <DialogContent>
            {formError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {formError}
              </Alert>
            )}
            <TextField
              label="Group name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
              fullWidth
              sx={{ mt: 1 }}
            />
          </DialogContent>
          <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
            <Button onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={submitting}>
              {submitting ? 'Creating…' : 'Create Group'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  )
}
