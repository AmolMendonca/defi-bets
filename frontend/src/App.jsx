import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import LandingPage from './components/LandingPage'
import CreateBet from './pages/CreateBet'
import BetDetails from './pages/BetDetails';
import Documentation from './pages/Documentation'
import BetListingPage from './pages/BetListing'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/create-bet" element={<CreateBet />} />
        <Route path="/bet/:id" element={<BetDetails />} />
        <Route path="/documentation" element={<Documentation/>}/>
        <Route path="/listing" element={<BetListingPage/>}/>
      </Routes>
    </Router>
  )
}

export default App