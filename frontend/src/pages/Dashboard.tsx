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

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Your Groups
        </Typography>
        <Button variant="contained" component={RouterLink} to="/groups/new">
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
    </Box>
  )
}
