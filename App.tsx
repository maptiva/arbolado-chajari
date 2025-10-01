
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import MapPage from './pages/MapPage';
import AddTreePage from './pages/AddTreePage';
import AuthPage from './pages/AuthPage';
import AdminPage from './pages/AdminPage'; // Import AdminPage
import Navbar from './components/Navbar';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Cargando...</div>;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};

const AuthRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Cargando...</div>;
  }
  
  if (user) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

// New component for protecting admin routes
const AdminProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const adminUid = import.meta.env.VITE_ADMIN_UID;

  if (!adminUid || user?.uid !== adminUid) {
    console.warn('Admin access denied. Ensure VITE_ADMIN_UID is set correctly.');
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};


function AppContent() {
  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Navbar />
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<MapPage />} />
          <Route path="/add-tree" element={
            <ProtectedRoute>
              <AddTreePage />
            </ProtectedRoute>
          } />
          <Route path="/auth" element={
            <AuthRoute>
              <AuthPage />
            </AuthRoute>
          }/>
          <Route path="/admin" element={
            <ProtectedRoute>
              <AdminProtectedRoute>
                <AdminPage />
              </AdminProtectedRoute>
            </ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <AppContent />
      </HashRouter>
    </AuthProvider>
  );
}
