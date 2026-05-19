import { useEffect, useRef, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  LinearProgress,
  TextField,
  Typography,
} from '@mui/material'
import UploadFileIcon from '@mui/icons-material/UploadFile'
import imageCompression from 'browser-image-compression'
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

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB before compression
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

function isImage(path: string) {
  return /\.(jpe?g|png|gif|webp)$/i.test(path)
}

function EvidenceCard({ item }: { item: EvidenceItem }) {
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
    <Card variant="outlined" sx={{ width: 160, flexShrink: 0 }}>
      {url && isImage(item.storage_path) ? (
        <Box
          component="a"
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          sx={{ display: 'block' }}
        >
          <Box
            component="img"
            src={url}
            alt={item.caption ?? filename}
            sx={{
              width: '100%',
              height: 120,
              objectFit: 'cover',
              display: 'block',
              cursor: 'pointer',
              transition: 'opacity 0.15s',
              '&:hover': { opacity: 0.85 },
            }}
          />
        </Box>
      ) : null}
      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Typography variant="caption" color="text.secondary" display="block">
          {item.username}
        </Typography>
        {item.caption && (
          <Typography
            variant="caption"
            sx={{
              mt: 0.25,
              display: 'block',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {item.caption}
          </Typography>
        )}
        {url && !isImage(item.storage_path) && (
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
        )}
      </CardContent>
    </Card>
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
    setUploadProgress(10)

    let fileToUpload: File = file
    if (IMAGE_TYPES.includes(file.type)) {
      fileToUpload = await imageCompression(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        onProgress: (p) => setUploadProgress(Math.round(p * 0.6)), // 0–60% for compression
      })
    }

    setUploadProgress(65)

    const ext = fileToUpload.name.split('.').pop() ?? file.name.split('.').pop()
    const storagePath = `${user.id}/${betId}/${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('evidence')
      .upload(storagePath, fileToUpload)

    if (uploadError) {
      setError(uploadError.message)
      setUploading(false)
      return
    }

    setUploadProgress(90)

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

    setUploadProgress(100)

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
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
            {evidence.map((item) => (
              <EvidenceCard key={item.id} item={item} />
            ))}
          </Box>
        </Box>
      )}
    </Box>
  )
}
