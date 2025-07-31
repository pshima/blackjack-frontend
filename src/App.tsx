import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { MainGamePage } from './pages/MainGamePage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainGamePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;