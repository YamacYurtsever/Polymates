import { useEffect, useRef, useState } from 'react'
import { Alert, Avatar, Box, Button, TextField, Typography } from '@mui/material'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { tokens } from '../theme'

interface Comment {
  id: string
  user_id: string
  username: string
  body: string
  created_at: string
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export function CommentsPanel({ betId, onCountChange }: { betId: string; onCountChange?: (n: number) => void }) {
  const { user } = useAuth()
  const [comments, setComments] = useState<Comment[]>([])
  const [body, setBody] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    type Row = { id: string; user_id: string; body: string; created_at: string; users: { username: string } | null }

    async function load() {
      const { data } = await supabase
        .from('comments')
        .select('id, user_id, body, created_at, users(username)')
        .eq('bet_id', betId)
        .order('created_at', { ascending: true })

      const mapped: Comment[] = ((data ?? []) as unknown as Row[]).map((r) => ({
        id: r.id,
        user_id: r.user_id,
        username: r.users?.username ?? 'Unknown',
        body: r.body,
        created_at: r.created_at,
      }))
      setComments(mapped)
      onCountChange?.(mapped.length)
    }
    load()

    const channel = supabase
      .channel(`comments-${betId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'comments', filter: `bet_id=eq.${betId}` },
        async (payload) => {
          const row = payload.new as { id: string; user_id: string; body: string; created_at: string }
          const { data: userData } = await supabase
            .from('users')
            .select('username')
            .eq('id', row.user_id)
            .single()
          const comment: Comment = {
            id: row.id,
            user_id: row.user_id,
            username: userData?.username ?? 'Unknown',
            body: row.body,
            created_at: row.created_at,
          }
          setComments((prev) => {
            if (prev.some((c) => c.id === comment.id)) return prev
            const next = [...prev, comment]
            onCountChange?.(next.length)
            return next
          })
          setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
        },
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [betId, onCountChange])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !body.trim()) return
    setSubmitting(true)
    setError(null)

    const optimistic: Comment = {
      id: crypto.randomUUID(),
      user_id: user.id,
      username: '',
      body: body.trim(),
      created_at: new Date().toISOString(),
    }
    setComments((prev) => [...prev, optimistic])
    onCountChange?.(comments.length + 1)
    setBody('')
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)

    const { error } = await supabase
      .from('comments')
      .insert({ bet_id: betId, user_id: user.id, body: optimistic.body })

    if (error) {
      setComments((prev) => prev.filter((c) => c.id !== optimistic.id))
      onCountChange?.(comments.length)
      setError(error.message)
    }
    setSubmitting(false)
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {user && (
        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', gap: 1.5, mb: 2.5, alignItems: 'flex-start' }}>
          <Avatar
            sx={{
              width: 30,
              height: 30,
              fontSize: '0.8rem',
              fontWeight: 600,
              flexShrink: 0,
              mt: 0.5,
              bgcolor: tokens.hairline,
              color: tokens.ink,
            }}
          >
            {user.email?.[0]?.toUpperCase() ?? '?'}
          </Avatar>
          <TextField
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Add a comment…"
            multiline
            maxRows={4}
            fullWidth
            size="small"
            slotProps={{ htmlInput: { maxLength: 500 } }}
          />
          <Button
            type="submit"
            variant="contained"
            size="small"
            disabled={submitting || !body.trim()}
            sx={{ height: tokens.controlHeightSm, flexShrink: 0 }}
          >
            Post
          </Button>
        </Box>
      )}

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {comments.map((c) => (
        <Box
          key={c.id}
          sx={{
            display: 'flex',
            gap: 1.5,
            py: 1.75,
            borderTop: 1,
            borderColor: 'divider',
          }}
        >
          <Avatar
            sx={{
              width: 30,
              height: 30,
              fontSize: '0.8rem',
              fontWeight: 600,
              flexShrink: 0,
              bgcolor: tokens.hairline,
              color: tokens.ink,
              mt: 0.25,
            }}
          >
            {c.username[0]?.toUpperCase() ?? '?'}
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 0.25 }}>
              <Typography sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
                {c.username || 'You'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {relativeTime(c.created_at)}
              </Typography>
            </Box>
            <Typography sx={{ fontSize: '0.9rem', lineHeight: 1.5 }}>{c.body}</Typography>
          </Box>
        </Box>
      ))}

      <div ref={bottomRef} />
    </Box>
  )
}
