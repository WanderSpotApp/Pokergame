import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Marketplace from './pages/Marketplace';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/marketplace" element={<Marketplace />} />
        {/* other routes */}
      </Routes>
    </Router>
  );
}

export default App; 