import { useEffect, useRef, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogContent,
  IconButton,
  LinearProgress,
  TextField,
  Typography,
} from '@mui/material'
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew'
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos'
import CloseIcon from '@mui/icons-material/Close'
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

const MAX_FILE_SIZE = 10 * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const CARD_WIDTH = 160
const CARD_HEIGHT = 192

function isImage(path: string) {
  return /\.(jpe?g|png|gif|webp)$/i.test(path)
}

function relativeTime(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

function EvidenceCard({ item, onClick }: { item: EvidenceItem; onClick: () => void }) {
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
    <Card
      variant="outlined"
      onClick={onClick}
      sx={{
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        flexShrink: 0,
        cursor: 'pointer',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        '&:hover': { borderColor: 'text.secondary' },
      }}
    >
      {isImage(item.storage_path) && (
        <Box sx={{ width: '100%', height: 120, bgcolor: 'divider', overflow: 'hidden' }}>
          {url && (
            <Box
              component="img"
              src={url}
              alt={item.caption ?? filename}
              sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          )}
        </Box>
      )}
      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 }, flexGrow: 1, overflow: 'hidden' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            {item.username}
          </Typography>
          <Typography variant="caption" color="text.disabled">
            {relativeTime(item.created_at)}
          </Typography>
        </Box>
        {item.caption && (
          <Typography
            variant="caption"
            sx={{
              mt: 0.5,
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
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
            PDF
          </Typography>
        )}
      </CardContent>
    </Card>
  )
}

function EvidenceModal({
  evidence,
  index,
  onClose,
  onPrev,
  onNext,
}: {
  evidence: EvidenceItem[]
  index: number | null
  onClose: () => void
  onPrev: () => void
  onNext: () => void
}) {
  const item = index !== null ? evidence[index] : null
  const urlCache = useRef<Map<string, string>>(new Map())
  const [url, setUrl] = useState<string | null>(null)

  async function fetchUrl(path: string): Promise<string | null> {
    if (urlCache.current.has(path)) return urlCache.current.get(path)!
    const { data } = await supabase.storage.from('evidence').createSignedUrl(path, 3600)
    if (data) urlCache.current.set(path, data.signedUrl)
    return data?.signedUrl ?? null
  }

  useEffect(() => {
    if (!item) return
    // Show cached URL immediately if available, then prefetch neighbours
    const cached = urlCache.current.get(item.storage_path)
    if (cached) {
      setUrl(cached)
    } else {
      setUrl(null)
      fetchUrl(item.storage_path).then((u) => setUrl(u))
    }
    // Prefetch prev/next in the background
    if (index !== null && index > 0) fetchUrl(evidence[index - 1].storage_path)
    if (index !== null && index < evidence.length - 1) fetchUrl(evidence[index + 1].storage_path)
  }, [item]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!item) return null

  const filename = item.storage_path.split('/').pop() ?? 'file'
  const hasPrev = index !== null && index > 0
  const hasNext = index !== null && index < evidence.length - 1

  return (
    <Dialog open={index !== null} onClose={onClose} maxWidth="lg">
      <DialogContent sx={{ position: 'relative', p: 2 }}>
        <Box sx={{ position: 'relative' }}>
          {url && isImage(item.storage_path) && (
            <Box
              component="img"
              src={url}
              alt={item.caption ?? filename}
              sx={{
                display: 'block',
                maxWidth: '80vw',
                maxHeight: '65vh',
                objectFit: 'contain',
                mx: 'auto',
                mb: 2,
              }}
            />
          )}
          {hasPrev && (
            <IconButton
              onClick={onPrev}
              size="small"
              sx={{
                position: 'absolute',
                left: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                bgcolor: 'rgba(255,255,255,0.85)',
                backdropFilter: 'blur(4px)',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.95)' },
              }}
            >
              <ArrowBackIosNewIcon fontSize="small" />
            </IconButton>
          )}
          {hasNext && (
            <IconButton
              onClick={onNext}
              size="small"
              sx={{
                position: 'absolute',
                right: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                bgcolor: 'rgba(255,255,255,0.85)',
                backdropFilter: 'blur(4px)',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.95)' },
              }}
            >
              <ArrowForwardIosIcon fontSize="small" />
            </IconButton>
          )}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: item.caption ? 1 : 0 }}>
          <Typography variant="body2">{item.username}</Typography>
          <Typography variant="caption" color="text.secondary">
            {relativeTime(item.created_at)}
          </Typography>
        </Box>
        {item.caption && <Typography variant="body2">{item.caption}</Typography>}
        {url && !isImage(item.storage_path) && (
          <Button
            component="a"
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            size="small"
            variant="outlined"
            sx={{ mt: 1 }}
          >
            {filename}
          </Button>
        )}

        {evidence.length > 1 && (
          <Typography
            variant="caption"
            color="text.disabled"
            sx={{ display: 'block', textAlign: 'center', mt: 1 }}
          >
            {(index ?? 0) + 1} / {evidence.length}
          </Typography>
        )}
      </DialogContent>
    </Dialog>
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
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
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
        onProgress: (p) => setUploadProgress(Math.round(p * 0.6)),
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
        username: (user.user_metadata.username as string | undefined) ?? 'You',
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
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {evidence.length === 0 && !canSubmit && (
        <Typography variant="body2" color="text.secondary">
          No evidence submitted yet.
        </Typography>
      )}

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'flex-start' }}>
        {canSubmit && (
          <Box
            component="form"
            onSubmit={handleUpload}
            sx={{ width: CARD_WIDTH, flexShrink: 0 }}
          >
            {!file ? (
              <Box
                onClick={() => fileInputRef.current?.click()}
                sx={{
                  width: CARD_WIDTH,
                  height: CARD_HEIGHT,
                  border: '1.5px dashed',
                  borderColor: 'divider',
                  borderRadius: 1.25,
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 0.75,
                  '&:hover': { borderColor: 'text.secondary' },
                }}
              >
                <UploadFileIcon sx={{ color: 'text.disabled', fontSize: 28 }} />
                <Typography variant="caption" color="text.secondary">
                  Add evidence
                </Typography>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ALLOWED_TYPES.join(',')}
                  hidden
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
              </Box>
            ) : (
              <Box
                sx={{
                  width: CARD_WIDTH,
                  height: CARD_HEIGHT,
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 1.25,
                  p: 1.5,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1,
                  overflow: 'hidden',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Typography
                    variant="caption"
                    sx={{
                      flexGrow: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {file.name}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => setFile(null)}
                    sx={{ p: 0.25, flexShrink: 0 }}
                  >
                    <CloseIcon sx={{ fontSize: 14 }} />
                  </IconButton>
                </Box>
                <TextField
                  placeholder="Caption"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  size="small"
                  multiline
                  slotProps={{ htmlInput: { maxLength: 80 } }}
                  sx={{
                    flexGrow: 1,
                    '& .MuiInputBase-root': { height: '100%', alignItems: 'flex-start' },
                    '& .MuiInputBase-input': { fontSize: '0.75rem', py: 0.75 },
                  }}
                />
                {uploading && (
                  <LinearProgress
                    variant="determinate"
                    value={uploadProgress}
                    sx={{ borderRadius: 1 }}
                  />
                )}
                <Button
                  type="submit"
                  variant="contained"
                  size="small"
                  disabled={uploading}
                  sx={{ fontSize: '0.75rem', py: 0.5 }}
                >
                  {uploading ? 'Uploading…' : 'Submit'}
                </Button>
              </Box>
            )}
          </Box>
        )}

        {evidence.map((item, i) => (
          <EvidenceCard key={item.id} item={item} onClick={() => setSelectedIndex(i)} />
        ))}
      </Box>

      <EvidenceModal
        evidence={evidence}
        index={selectedIndex}
        onClose={() => setSelectedIndex(null)}
        onPrev={() => setSelectedIndex((i) => (i !== null ? i - 1 : i))}
        onNext={() => setSelectedIndex((i) => (i !== null ? i + 1 : i))}
      />
    </Box>
  )
}
