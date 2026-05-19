import { useEffect, useRef, useState } from 'react'
import { Alert, Box, Button, Divider, LinearProgress, TextField, Typography } from '@mui/material'
import UploadFileIcon from '@mui/icons-material/UploadFile'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

interface EvidenceItem {
  id: string
  user_id: string
  username: string
  storage_path: string
  caption: string | null
  created_at: string
}

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']

function isImage(path: string) {
  return /\.(jpe?g|png|gif|webp)$/i.test(path)
}

function EvidenceItem({ item }: { item: EvidenceItem }) {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const { data } = await supabase.storage
        .from('evidence')
        .createSignedUrl(item.storage_path, 3600)
      if (data) setUrl(data.signedUrl)
    }
    load()
  }, [item.storage_path])

  const filename = item.storage_path.split('/').pop() ?? 'file'

  return (
    <Box sx={{ py: 1.5, borderBottom: 1, borderColor: 'divider' }}>
      <Typography variant="caption" color="text.secondary">
        {item.username}
      </Typography>
      {item.caption && (
        <Typography variant="body2" sx={{ mt: 0.25, mb: 1 }}>
          {item.caption}
        </Typography>
      )}
      {url && isImage(item.storage_path) ? (
        <Box
          component="img"
          src={url}
          alt={item.caption ?? filename}
          sx={{ maxWidth: '100%', maxHeight: 300, borderRadius: 1, display: 'block', mt: 0.5 }}
        />
      ) : url ? (
        <Button
          component="a"
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          size="small"
          variant="outlined"
          sx={{ mt: 0.5 }}
        >
          {filename}
        </Button>
      ) : null}
    </Box>
  )
}

export function EvidencePanel({
  betId,
  closesAt,
  status,
}: {
  betId: string
  closesAt: string
  status: 'open' | 'closed'
}) {
  const { user } = useAuth()
  const [evidence, setEvidence] = useState<EvidenceItem[]>([])
  const [file, setFile] = useState<File | null>(null)
  const [caption, setCaption] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const fetchedRef = useRef(false)

  const isPastDeadline = new Date() > new Date(closesAt)
  const canSubmit = status === 'open' && !isPastDeadline

  useEffect(() => {
    if (fetchedRef.current) return
    fetchedRef.current = true

    type EvidenceRow = {
      id: string
      user_id: string
      storage_path: string
      caption: string | null
      created_at: string
      users: { username: string } | null
    }

    async function fetchEvidence() {
      const { data } = await supabase
        .from('evidence')
        .select('id, user_id, storage_path, caption, created_at, users(username)')
        .eq('bet_id', betId)
        .order('created_at', { ascending: true })

      if (data) {
        setEvidence(
          ((data ?? []) as unknown as EvidenceRow[]).map((row) => ({
            id: row.id,
            user_id: row.user_id,
            username: row.users?.username ?? 'Unknown',
            storage_path: row.storage_path,
            caption: row.caption,
            created_at: row.created_at,
          })),
        )
      }
    }

    fetchEvidence()
  }, [betId])

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    if (!file || !user) return
    setError(null)

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Only images (JPEG, PNG, GIF, WebP) and PDFs are allowed.')
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      setError('File must be under 10 MB.')
      return
    }

    setUploading(true)
    setUploadProgress(0)

    const ext = file.name.split('.').pop()
    const storagePath = `${user.id}/${betId}/${Date.now()}.${ext}`

    // Simulate progress since Supabase JS doesn't expose upload progress
    const progressInterval = setInterval(() => {
      setUploadProgress((p) => Math.min(p + 20, 80))
    }, 200)

    const { error: uploadError } = await supabase.storage.from('evidence').upload(storagePath, file)

    clearInterval(progressInterval)

    if (uploadError) {
      setError(uploadError.message)
      setUploading(false)
      return
    }

    setUploadProgress(100)

    const { data: inserted, error: insertError } = await supabase
      .from('evidence')
      .insert({
        bet_id: betId,
        user_id: user.id,
        storage_path: storagePath,
        caption: caption || null,
      })
      .select('id, user_id, storage_path, caption, created_at')
      .single()

    if (insertError || !inserted) {
      setError(insertError?.message ?? 'Failed to save evidence.')
      setUploading(false)
      return
    }

    setEvidence((prev) => [
      ...prev,
      {
        id: inserted.id,
        user_id: inserted.user_id,
        username: 'You',
        storage_path: inserted.storage_path,
        caption: inserted.caption,
        created_at: inserted.created_at,
      },
    ])

    setFile(null)
    setCaption('')
    setUploadProgress(0)
    if (fileInputRef.current) fileInputRef.current.value = ''
    setUploading(false)
  }

  return (
    <Box>
      {canSubmit && (
        <Box component="form" onSubmit={handleUpload} sx={{ mb: 3 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Box
            sx={{
              border: 1,
              borderColor: 'divider',
              borderRadius: 1,
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
            }}
          >
            <Button
              component="label"
              variant="outlined"
              startIcon={<UploadFileIcon />}
              size="small"
            >
              {file ? file.name : 'Choose file'}
              <input
                ref={fileInputRef}
                type="file"
                accept={ALLOWED_TYPES.join(',')}
                hidden
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </Button>
            <TextField
              label="Caption (optional)"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              size="small"
              fullWidth
            />
            {uploading && (
              <LinearProgress
                variant="determinate"
                value={uploadProgress}
                sx={{ borderRadius: 1 }}
              />
            )}
            <Button type="submit" variant="contained" size="small" disabled={!file || uploading}>
              {uploading ? 'Uploading…' : 'Submit Evidence'}
            </Button>
          </Box>
        </Box>
      )}

      {evidence.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No evidence submitted yet.
        </Typography>
      ) : (
        <Box>
          {canSubmit && <Divider sx={{ mb: 2 }} />}
          {evidence.map((item) => (
            <EvidenceItem key={item.id} item={item} />
          ))}
        </Box>
      )}
    </Box>
  )
}
