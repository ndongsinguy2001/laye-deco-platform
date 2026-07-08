import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { motion } from 'framer-motion';
import { 
  FiHome, FiUsers, FiCalendar, FiUserCheck, FiClock, 
  FiDollarSign, FiPackage, FiUser, FiLogOut, FiMenu, FiX,
  FiSun, FiMoon
} from 'react-icons/fi';

const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const getMenuItems = () => {
    const role = user?.role;
    
    const allMenus = [
      { path: '/dashboard', icon: FiHome, label: 'Dashboard', roles: ['director', 'admin', 'team_leader', 'accountant'] },
      { path: '/employees', icon: FiUsers, label: 'Employés', roles: ['director', 'admin'] },
      { path: '/events', icon: FiCalendar, label: 'Événements', roles: ['director', 'admin', 'team_leader'] },
      { path: '/assignments', icon: FiUserCheck, label: 'Affectations', roles: ['director', 'admin', 'team_leader'] },
      { path: '/attendance', icon: FiClock, label: 'Pointage', roles: ['director', 'admin', 'team_leader', 'daily_worker'] },
      { path: '/payments', icon: FiDollarSign, label: 'Paiements', roles: ['director', 'admin', 'accountant'] },
      { path: '/materials', icon: FiPackage, label: 'Matériels', roles: ['director', 'admin'] },
      { path: '/users', icon: FiUsers, label: 'Utilisateurs', roles: ['director'] },
      { path: '/profile', icon: FiUser, label: 'Profil', roles: ['director', 'admin', 'team_leader', 'accountant', 'daily_worker'] },
    ];

    return allMenus.filter(item => item.roles.includes(role));
  };

  const menuItems = getMenuItems();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex transition-colors">
      <div className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-navy-800 dark:bg-navy-950 text-white transition-all duration-300 flex flex-col shadow-xl`}>
        <div className="p-4 flex items-center gap-2 border-b border-navy-700 dark:border-navy-800">
          <img src="/logo_laye_deco.png" alt="Laye Déco" className="w-8 h-8 object-contain" />
          {sidebarOpen && <h1 className="text-xl font-bold">Laye Déco</h1>}
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)} 
            className="ml-auto text-white hover:text-gray-300"
          >
            {sidebarOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
        </div>
        <nav className="flex-1 mt-4">
          {menuItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="w-full flex items-center px-4 py-3 hover:bg-navy-700 dark:hover:bg-navy-900 transition-colors"
            >
              <item.icon size={20} />
              {sidebarOpen && <span className="ml-4">{item.label}</span>}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-navy-700 dark:border-navy-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-4 py-2 hover:bg-navy-700 dark:hover:bg-navy-900 rounded-lg transition-colors"
          >
            <FiLogOut size={20} />
            {sidebarOpen && <span className="ml-4">Déconnexion</span>}
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <header className="bg-white dark:bg-gray-800 shadow-sm px-6 py-4 flex justify-between items-center transition-colors">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
            Bienvenue, {user?.email?.split('@')[0] || user?.phone}
          </h2>
          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              {isDark ? <FiSun size={22} className="text-yellow-400" /> : <FiMoon size={22} className="text-gray-600" />}
            </button>
            <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm capitalize">
              {user?.role?.replace('_', ' ')}
            </span>
          </div>
        </header>
        <motion.main
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex-1 p-6"
        >
          <Outlet />
        </motion.main>
      </div>
    </div>
  );
};

export default MainLayout;