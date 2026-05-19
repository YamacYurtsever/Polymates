export type BetStatus = 'open' | 'closed'
export type BetSide = 'yes' | 'no'

export interface Bet {
  id: string
  title: string
  description: string
  closes_at: string
  status: BetStatus
  created_at: string
  group_id: string
  group_name: string
  creator_username: string
}

export interface BetPosition {
  user_id: string
  username: string
  side: BetSide
  amount: number
}

export interface Group {
  id: string
  name: string
  invite_token?: string
}

export interface Member {
  user_id: string
  username: string
  points: number
}

export interface Verdict {
  outcome: BetSide
  reasoning: string
}
