import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import LandingPage from './components/LandingPage'
import CreateBet from './pages/CreateBet'
import BetDetails from './pages/BetDetails';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/create-bet" element={<CreateBet />} />
        <Route path="/bet/:id" element={<BetDetails />} />
      </Routes>
    </Router>
  )
}

export default App