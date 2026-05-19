import { useEffect, useState } from 'react'
import { useNavigate, Link as RouterLink } from 'react-router-dom'
import {
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
  Alert,
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
  const navigate = useNavigate()
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [groupName, setGroupName] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

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

  async function handleCreateGroup(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    setCreating(true)
    setCreateError(null)

    const { data: groupId, error } = await supabase.rpc('create_group', { group_name: groupName })

    if (error) {
      setCreateError(error.message)
      setCreating(false)
      return
    }

    setDialogOpen(false)
    setGroupName('')
    setCreating(false)
    navigate(`/groups/${groupId}`)
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Your Groups
        </Typography>
        <Button variant="contained" onClick={() => setDialogOpen(true)}>
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

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="xs">
        <Box component="form" onSubmit={handleCreateGroup}>
          <DialogTitle>Create Group</DialogTitle>
          <DialogContent sx={{ pt: '8px !important' }}>
            {createError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {createError}
              </Alert>
            )}
            <TextField
              label="Group name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              required
              autoFocus
              fullWidth
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={creating}>
              {creating ? 'Creating…' : 'Create'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  )
}
