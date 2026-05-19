import { useRef, useState } from 'react'
import { Box, Typography } from '@mui/material'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { tokens } from '../../theme'
import { useReducedMotion } from './useReducedMotion'

gsap.registerPlugin(useGSAP)

type Bet = {
  q: string
  yes: number
  bettors: number
  time: string
  names: string[]
}

const BETS: Bet[] = [
  {
    q: 'Will Sarah actually go to the gym this week?',
    yes: 32,
    bettors: 8,
    time: '2d 14h left',
    names: ['Alex', 'Mia', 'Jordan', 'Priya', 'Sam', 'Theo', 'Nora', 'Kai'],
  },
  {
    q: 'Does Yamac pull an all-nighter before the demo?',
    yes: 74,
    bettors: 5,
    time: '4h 32m left',
    names: ['Yamac', 'Lina', 'Devon', 'Ravi', 'Casey'],
  },
  {
    q: 'Will the group ski trip happen before March?',
    yes: 41,
    bettors: 11,
    time: '6d left',
    names: ['Eli', 'Mara', 'Jin', 'Owen', 'Sasha', 'Pia', 'Tom', 'Rae', 'Kit', 'Noa', 'Vee'],
  },
  {
    q: 'Does Marco finish his thesis before May?',
    yes: 58,
    bettors: 7,
    time: '1d 8h left',
    names: ['Marco', 'Bee', 'Dani', 'Jules', 'Iris', 'Wren', 'Tao'],
  },
]

const TICK_MS = 1800
const ROTATE_MS = 12000
const MAX_FEED = 3

function randomBetween(lo: number, hi: number) {
  return Math.floor(Math.random() * (hi - lo + 1)) + lo
}

function pickName(names: string[]) {
  return names[Math.floor(Math.random() * names.length)]
}

export function LiveOddsCard() {
  const reduced = useReducedMotion()
  const [betIdx, setBetIdx] = useState(0)
  const bet = BETS[betIdx]

  const rootRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const yesBarRef = useRef<HTMLDivElement>(null)
  const noBarRef = useRef<HTMLDivElement>(null)
  const yesPctRef = useRef<HTMLSpanElement>(null)
  const noPctRef = useRef<HTMLSpanElement>(null)
  const feedRef = useRef<HTMLDivElement>(null)
  const badgeLayerRef = useRef<HTMLDivElement>(null)

  // mutable runtime state, decoupled from React renders
  const yesValueRef = useRef(bet.yes)
  const pausedRef = useRef(false)
  const offscreenRef = useRef(false)
  const rotatingRef = useRef(false)
  const hoverRef = useRef(false)
  const tickTimerRef = useRef<number | null>(null)
  const rotateTimerRef = useRef<number | null>(null)

  useGSAP(
    (_ctx, contextSafe) => {
      if (reduced) return

      const writeBar = (v: number) => {
        if (yesBarRef.current) yesBarRef.current.style.width = `${v}%`
        if (noBarRef.current) noBarRef.current.style.width = `${100 - v}%`
        if (yesPctRef.current) yesPctRef.current.textContent = `${Math.round(v)}%`
        if (noPctRef.current) noPctRef.current.textContent = `${100 - Math.round(v)}%`
      }

      // initial fill from 0 → target
      yesValueRef.current = bet.yes
      gsap.set([yesBarRef.current, noBarRef.current], { width: '0%' })
      const initial = { v: 0 }
      gsap.to(initial, {
        v: bet.yes,
        duration: 0.9,
        ease: 'power2.out',
        overwrite: 'auto',
        onUpdate: () => writeBar(initial.v),
      })

      const pushFeedEntry = (name: string, side: 'YES' | 'NO', amount: number) => {
        const layer = feedRef.current
        if (!layer) return
        const row = document.createElement('div')
        row.style.cssText = `
          display:flex;align-items:center;justify-content:space-between;
          padding:6px 10px;border:1px solid ${tokens.hairline};border-radius:6px;
          background:${tokens.surface};font-size:0.78rem;color:${tokens.inkSecondary};
          font-feature-settings:"tnum";
        `
        const left = document.createElement('span')
        left.textContent = `${name} placed ${amount} on `
        const tag = document.createElement('span')
        tag.textContent = side
        tag.style.cssText = `color:${side === 'YES' ? tokens.yes : tokens.no};font-weight:650;letter-spacing:0.04em;margin-left:2px;`
        left.appendChild(tag)
        const right = document.createElement('span')
        right.textContent = 'just now'
        right.style.cssText = 'opacity:0.6;font-size:0.7rem;'
        row.appendChild(left)
        row.appendChild(right)
        layer.prepend(row)
        gsap.fromTo(row, { y: -8, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35, ease: 'power2.out' })

        while (layer.children.length > MAX_FEED) {
          const last = layer.lastElementChild as HTMLElement | null
          if (!last) break
          gsap.to(last, {
            opacity: 0,
            y: 6,
            duration: 0.3,
            ease: 'power1.in',
            onComplete: () => last.remove(),
          })
        }
      }

      const spawnBadge = (name: string, side: 'YES' | 'NO', amount: number) => {
        const layer = badgeLayerRef.current
        if (!layer) return
        const el = document.createElement('div')
        const color = side === 'YES' ? tokens.yes : tokens.no
        el.textContent = `${name} +${amount} on ${side}`
        el.style.cssText = `
          position:absolute;left:${randomBetween(10, 80)}%;bottom:0;
          transform:translateX(-50%);
          padding:3px 8px;border-radius:999px;border:1px solid ${color};
          background:${tokens.surface};color:${color};
          font-size:0.7rem;font-weight:600;white-space:nowrap;letter-spacing:0.02em;
          pointer-events:none;
        `
        layer.appendChild(el)
        gsap.fromTo(
          el,
          { y: 0, opacity: 0, scale: 0.92 },
          {
            y: -48,
            opacity: 1,
            scale: 1,
            duration: 0.45,
            ease: 'power2.out',
            onComplete: () => {
              gsap.to(el, {
                opacity: 0,
                y: -64,
                duration: 0.45,
                ease: 'power1.in',
                onComplete: () => el.remove(),
              })
            },
          },
        )
      }

      const tick = () => {
        if (pausedRef.current || rotatingRef.current || offscreenRef.current) return
        const current = BETS[currentIdxRef.current]
        const name = pickName(current.names)
        const side: 'YES' | 'NO' = Math.random() < yesValueRef.current / 100 ? 'YES' : 'NO'
        const amount = randomBetween(8, 84)
        const delta = randomBetween(-4, 4)
        const next = Math.max(8, Math.min(92, yesValueRef.current + delta))

        const proxy = { v: yesValueRef.current }
        gsap.to(proxy, {
          v: next,
          duration: 0.8,
          ease: 'power2.out',
          overwrite: 'auto',
          onUpdate: () => writeBar(proxy.v),
          onComplete: () => {
            yesValueRef.current = next
          },
        })

        pushFeedEntry(name, side, amount)
        spawnBadge(name, side, amount)
      }

      const currentIdxRef = { current: 0 }

      const rotate = () => {
        if (pausedRef.current || rotatingRef.current || offscreenRef.current) return
        rotatingRef.current = true
        const nextIdx = (currentIdxRef.current + 1) % BETS.length
        const content = contentRef.current
        const feed = feedRef.current
        if (!content) {
          rotatingRef.current = false
          return
        }

        gsap.to([content, feed], {
          opacity: 0,
          y: -6,
          duration: 0.35,
          ease: 'power2.in',
          overwrite: 'auto',
          onComplete: contextSafe!(() => {
            currentIdxRef.current = nextIdx
            setBetIdx(nextIdx)
            const nextBet = BETS[nextIdx]
            yesValueRef.current = nextBet.yes
            writeBar(0)
            if (feed) feed.innerHTML = ''
            if (badgeLayerRef.current) badgeLayerRef.current.innerHTML = ''

            gsap.fromTo(
              [content, feed],
              { opacity: 0, y: 6 },
              { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out', overwrite: 'auto' },
            )
            const fill = { v: 0 }
            gsap.to(fill, {
              v: nextBet.yes,
              duration: 0.9,
              ease: 'power2.out',
              overwrite: 'auto',
              onUpdate: () => writeBar(fill.v),
              onComplete: () => {
                rotatingRef.current = false
              },
            })
          }),
        })
      }

      const recomputePaused = () => {
        pausedRef.current = document.hidden || hoverRef.current || offscreenRef.current
      }

      tickTimerRef.current = window.setInterval(tick, TICK_MS)
      rotateTimerRef.current = window.setInterval(rotate, ROTATE_MS)

      const onVisibility = () => recomputePaused()
      document.addEventListener('visibilitychange', onVisibility)

      const onEnter = () => {
        hoverRef.current = true
        recomputePaused()
      }
      const onLeave = () => {
        hoverRef.current = false
        recomputePaused()
      }
      const root = rootRef.current
      root?.addEventListener('mouseenter', onEnter)
      root?.addEventListener('mouseleave', onLeave)

      // Pause when scrolled off-screen — the real fix for runaway tweens
      let observer: IntersectionObserver | null = null
      if (root && 'IntersectionObserver' in window) {
        observer = new IntersectionObserver(
          (entries) => {
            const entry = entries[0]
            if (!entry) return
            offscreenRef.current = !entry.isIntersecting
            recomputePaused()
          },
          { threshold: 0, rootMargin: '100px' },
        )
        observer.observe(root)
      }

      return () => {
        if (tickTimerRef.current) window.clearInterval(tickTimerRef.current)
        if (rotateTimerRef.current) window.clearInterval(rotateTimerRef.current)
        document.removeEventListener('visibilitychange', onVisibility)
        root?.removeEventListener('mouseenter', onEnter)
        root?.removeEventListener('mouseleave', onLeave)
        observer?.disconnect()
        if (badgeLayerRef.current) badgeLayerRef.current.innerHTML = ''
        if (feedRef.current) feedRef.current.innerHTML = ''
      }
    },
    { scope: rootRef, dependencies: [reduced], revertOnUpdate: true },
  )

  // static fallback values for reduced-motion render
  const yesDisplay = reduced ? BETS[0].yes : bet.yes
  const noDisplay = 100 - yesDisplay

  return (
    <Box
      ref={rootRef}
      sx={{
        border: 1,
        borderColor: 'divider',
        borderRadius: 1.25,
        bgcolor: '#fff',
        p: 2.25,
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
        position: 'relative',
        minHeight: 320,
        overflow: 'hidden',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography
          className="tabular"
          sx={{
            fontSize: '0.62rem',
            letterSpacing: '0.12em',
            fontWeight: 650,
            color: tokens.brand,
            textTransform: 'uppercase',
          }}
        >
          Live bet
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <Box
            sx={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              bgcolor: tokens.yes,
              animation: reduced ? 'none' : 'liveDot 1.4s ease-in-out infinite',
              '@keyframes liveDot': {
                '0%, 100%': { opacity: 1, transform: 'scale(1)' },
                '50%': { opacity: 0.4, transform: 'scale(0.85)' },
              },
            }}
          />
          <Typography
            sx={{
              fontSize: '0.68rem',
              color: tokens.inkSecondary,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              fontWeight: 600,
            }}
          >
            Live
          </Typography>
        </Box>
      </Box>

      <Box ref={contentRef} sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
        <Typography
          component="h3"
          sx={{ fontWeight: 650, fontSize: '1.15rem', lineHeight: 1.3, letterSpacing: '-0.01em' }}
        >
          {bet.q}
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="caption" color="text.secondary">
            {bet.bettors} bettors
          </Typography>
          <Typography variant="caption" color="text.secondary" className="tabular">
            {bet.time}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ position: 'relative', mt: 0.5 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            mb: 0.75,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.75 }}>
            <Typography
              component="span"
              ref={yesPctRef}
              className="tabular"
              sx={{
                color: tokens.yes,
                fontWeight: 650,
                fontSize: '1.5rem',
                letterSpacing: '-0.02em',
                lineHeight: 1,
              }}
            >
              {yesDisplay}%
            </Typography>
            <Typography
              sx={{ color: tokens.yes, fontWeight: 600, fontSize: '0.72rem', letterSpacing: '0.08em' }}
            >
              YES
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.75 }}>
            <Typography
              sx={{ color: tokens.no, fontWeight: 600, fontSize: '0.72rem', letterSpacing: '0.08em' }}
            >
              NO
            </Typography>
            <Typography
              component="span"
              ref={noPctRef}
              className="tabular"
              sx={{
                color: tokens.no,
                fontWeight: 650,
                fontSize: '1.5rem',
                letterSpacing: '-0.02em',
                lineHeight: 1,
              }}
            >
              {noDisplay}%
            </Typography>
          </Box>
        </Box>
        <Box
          sx={{
            display: 'flex',
            height: 10,
            borderRadius: 999,
            overflow: 'hidden',
            bgcolor: tokens.hairline,
          }}
        >
          <Box
            ref={yesBarRef}
            sx={{
              width: reduced ? `${yesDisplay}%` : '0%',
              bgcolor: tokens.yes,
              willChange: 'width',
            }}
          />
          <Box
            ref={noBarRef}
            sx={{
              width: reduced ? `${noDisplay}%` : '0%',
              bgcolor: tokens.no,
              willChange: 'width',
            }}
          />
        </Box>
        <Box
          ref={badgeLayerRef}
          aria-hidden
          sx={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
          }}
        />
      </Box>

      <Box
        ref={feedRef}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 0.5,
          mt: 0.5,
          minHeight: 92,
        }}
      />
    </Box>
  )
}
