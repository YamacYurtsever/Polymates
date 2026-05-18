import { Routes, Route } from 'react-router-dom'

function App() {
  return (
    <Routes>
      <Route path="/" element={<div>Landing</div>} />
      <Route path="/dashboard" element={<div>Dashboard</div>} />
      <Route path="/groups/:id" element={<div>Group</div>} />
      <Route path="/bets/new" element={<div>Create Bet</div>} />
      <Route path="/bets/:id" element={<div>Bet</div>} />
      <Route path="/invite/:token" element={<div>Join Group</div>} />
      <Route path="/leaderboard/:groupId" element={<div>Leaderboard</div>} />
      <Route path="/profile" element={<div>Profile</div>} />
    </Routes>
  )
}

export default App
