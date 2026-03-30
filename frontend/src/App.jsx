import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Layout from './components/common/Layout.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import ForgotPasswordPage from './pages/ForgotPasswordPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import ExamSelectionPage from './pages/ExamSelectionPage.jsx';
import ExamPage from './pages/ExamPage.jsx';
import ResultPage from './pages/ResultPage.jsx';
import AnalysisPage from './pages/AnalysisPage.jsx';
import AdminPage from './pages/AdminPage.jsx';
import LandingPage from './pages/LandingPage.jsx';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, token } = useSelector((state) => state.auth);
  if (!token) return <Navigate to="/login" />;
  if (adminOnly && user?.role !== 'admin') return <Navigate to="/dashboard" />;
  return children;
};

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      <Route element={
        <ProtectedRoute><Layout /></ProtectedRoute>
      }>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/exam-selection" element={<ExamSelectionPage />} />
        <Route path="/results/:id" element={<ResultPage />} />
        <Route path="/analysis/:id" element={<AnalysisPage />} />
        <Route path="/admin" element={
          <ProtectedRoute adminOnly><AdminPage /></ProtectedRoute>
        } />
      </Route>

      <Route path="/exam/:examId" element={
        <ProtectedRoute><ExamPage /></ProtectedRoute>
      } />
    </Routes>
  );
}

export default App;
