import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import LandingPage from './components/LandingPage'
import CreateBet from './pages/CreateBet'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/create-bet" element={<CreateBet />} />
      </Routes>
    </Router>
  )
}

export default App