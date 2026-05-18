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
  description: string
  invite_token: string
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
  const [groupDesc, setGroupDesc] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    fetchGroups()
  }, [user])

  async function fetchGroups() {
    setLoading(true)
    const { data, error } = await supabase
      .from('group_members')
      .select('groups(id, name, description, invite_token, group_members(count))')
      .eq('user_id', user!.id)

    if (error) {
      setError(error.message)
    } else {
      const mapped: Group[] = (data ?? []).flatMap((row: any) => {
        const g = row.groups
        if (!g) return []
        return [{
          id: g.id,
          name: g.name,
          description: g.description,
          invite_token: g.invite_token,
          member_count: g.group_members?.[0]?.count ?? 0,
        }]
      })
      setGroups(mapped)
    }
    setLoading(false)
  }

  async function handleCreateGroup(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    setCreating(true)
    setCreateError(null)

    const { data: group, error: groupErr } = await supabase
      .from('groups')
      .insert({
        name: groupName,
        description: groupDesc,
        invite_token: crypto.randomUUID(),
        created_by: user.id,
      })
      .select()
      .single()

    if (groupErr) {
      setCreateError(groupErr.message)
      setCreating(false)
      return
    }

    const { error: memberErr } = await supabase
      .from('group_members')
      .insert({ group_id: group.id, user_id: user.id, role: 'admin' })

    if (memberErr) {
      setCreateError(memberErr.message)
      setCreating(false)
      return
    }

    setDialogOpen(false)
    setGroupName('')
    setGroupDesc('')
    setCreating(false)
    navigate(`/groups/${group.id}`)
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

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
          <CircularProgress />
        </Box>
      ) : groups.length === 0 ? (
        <Typography color="text.secondary">
          You're not in any groups yet. Create one to get started.
        </Typography>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 2 }}>
          {groups.map((g) => (
            <Card key={g.id} variant="outlined">
              <CardActionArea component={RouterLink} to={`/groups/${g.id}`}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {g.name}
                  </Typography>
                  {g.description && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      {g.description}
                    </Typography>
                  )}
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
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
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
            {createError && <Alert severity="error">{createError}</Alert>}
            <TextField
              label="Group name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              required
              autoFocus
              fullWidth
            />
            <TextField
              label="Description"
              value={groupDesc}
              onChange={(e) => setGroupDesc(e.target.value)}
              fullWidth
              multiline
              rows={2}
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
