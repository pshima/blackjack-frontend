import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { MainGamePage } from './pages/MainGamePage';
import { AdminPage } from './pages/AdminPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainGamePage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;