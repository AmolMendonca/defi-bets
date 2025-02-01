import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import LandingPage from './components/LandingPage'
import Search from "./pages/Search";
import CreateBet from './pages/CreateBet'
import BetDetails from './pages/BetDetails';
import Documentation from './pages/Documentation'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/search" element={<Search />} />
        <Route path="/create-bet" element={<CreateBet />} />
        <Route path="/bet/:id" element={<BetDetails />} />
        <Route path="/documentation" element={<Documentation/>}/>
      </Routes>
    </Router>
  );
}

export default App