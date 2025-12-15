import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AdminPanel from './pages/AdminPanel';
import Events from './pages/Events';
import EventManagement from './pages/EventManagement';
import ExerciseTypeManagement from './pages/ExerciseTypeManagement';
import MyRegistrations from './pages/MyRegistrations';
import WellnessForm from './pages/WellnessForm';
import WellnessImpact from './pages/WellnessImpact';
import WellnessEvaluations from './pages/WellnessEvaluations';
import AttendanceCheck from './pages/AttendanceCheck';
import QRScanner from './pages/QRScanner';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/events" element={<Events />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={['USER', 'ADMIN']}>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-registrations"
            element={
              <ProtectedRoute allowedRoles={['USER', 'ADMIN']}>
                <MyRegistrations />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-registrations/:id"
            element={
              <ProtectedRoute allowedRoles={['USER', 'ADMIN']}>
                <MyRegistrations />
              </ProtectedRoute>
            }
          />
          <Route
            path="/wellness-evaluations"
            element={
              <ProtectedRoute allowedRoles={['USER', 'ADMIN']}>
                <WellnessEvaluations />
              </ProtectedRoute>
            }
          />
          <Route
            path="/wellness/:id"
            element={
              <ProtectedRoute allowedRoles={['USER', 'ADMIN']}>
                <WellnessForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/wellness/impact/:registrationId"
            element={
              <ProtectedRoute allowedRoles={['USER', 'ADMIN']}>
                <WellnessImpact />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminPanel />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/events"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <EventManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/exercise-types"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <ExerciseTypeManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/attendance/:eventId"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AttendanceCheck />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/scan-qr"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <QRScanner />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;

