
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { signOut } from 'firebase/auth';
import { auth } from '../services/firebase';

const Navbar: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  return (
    <nav className="bg-green-700 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="font-bold text-xl flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z"/><path d="m14 9-2 2-2-2"/><path d="M12 12v7"/></svg>
              Arbolado Chajarí
            </Link>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <Link to="/" className="text-gray-200 hover:bg-green-600 hover:text-white px-3 py-2 rounded-md text-sm font-medium">Mapa</Link>
                {user && (
                  <Link to="/add-tree" className="text-gray-200 hover:bg-green-600 hover:text-white px-3 py-2 rounded-md text-sm font-medium">Añadir Árbol</Link>
                )}
              </div>
            </div>
          </div>
          <div className="hidden md:block">
            {user ? (
              <button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-md text-sm">
                Cerrar Sesión
              </button>
            ) : (
              <Link to="/auth" className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-md text-sm">
                Iniciar Sesión
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
