import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  MessageSquare,
  Film,
  Brain,
  Settings,
  Sliders,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
} from 'lucide-react';
import useAuthStore from '../../store/authStore';
import useSettingsStore from '../../store/settingsStore';
import useAppStore from '../../store/appStore';

const navLinks = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/super-admin' },
  { label: 'AI Chat', icon: MessageSquare, href: '/super-admin/chat' },
  { label: 'Video Analysis', icon: Film, href: '/super-admin/video-analysis' },
  { label: 'Quiz Practice', icon: Brain, href: '/super-admin/quiz-practice' },
  { label: 'Quiz Manage', icon: Settings, href: '/super-admin/quiz' },
  { label: 'Settings', icon: Sliders, href: '/super-admin/settings' },
];

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

export default function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('sidebar-collapsed') === 'true';
  });

  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useAppStore();
  const { settings, loadSettings } = useSettingsStore();
  const location = useLocation();
  const siteName = settings?.siteName || 'AI Learning Platform';

  useEffect(() => {
    if (!settings) loadSettings();
  }, []);

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('sidebar-collapsed', String(next));
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      <aside
        className={`
          fixed top-0 left-0 z-50 h-screen transition-all duration-300 ease-in-out
          bg-white dark:bg-gray-900/95 backdrop-blur-xl border-r border-slate-200 dark:border-white/10
          transform lg:translate-x-0
          ${isCollapsed ? 'w-20' : 'w-64'}
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className={`flex items-center h-16 px-4 border-b border-slate-200 dark:border-white/10 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
          <Link to="/super-admin" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 dark:bg-white flex-shrink-0 flex items-center justify-center">
              <span className="text-white dark:text-black font-bold text-sm">AI</span>
            </div>
            {!isCollapsed && (
              <span className="text-sm font-semibold text-gray-900 dark:text-white truncate max-w-[140px]">
                {siteName}
              </span>
            )}
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 rounded-lg text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="p-3 space-y-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 8rem)' }}>
          {navLinks.map((link) => {
            const isActive = location.pathname === link.href;
            return (
              <Link
                key={link.label}
                to={link.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-600 border border-indigo-100 dark:bg-white/10 dark:text-white dark:border-white/20'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-slate-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-white/5 border border-transparent'
                } ${isCollapsed ? 'justify-center' : ''}`}
                title={isCollapsed ? link.label : ''}
              >
                <link.icon className="w-4 h-4 flex-shrink-0" />
                {!isCollapsed && <span>{link.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-4 left-0 w-full px-3">
          <button
            onClick={toggleCollapse}
            className={`hidden lg:flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-gray-500 hover:text-gray-900 hover:bg-slate-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-white/5 transition-all duration-200 ${isCollapsed ? 'justify-center' : ''}`}
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            {!isCollapsed && <span>Collapse Sidebar</span>}
          </button>
        </div>
      </aside>

      <div className={`transition-all duration-300 ease-in-out ${isCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
        <header className="sticky top-0 z-30 h-16 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-white/10">
          <div className="flex items-center justify-between h-full px-4 lg:px-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 ml-auto">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-xl text-gray-500 hover:text-gray-955 dark:text-gray-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <div className="flex items-center gap-3 border-l border-slate-200 dark:border-white/10 pl-3">
                <div className="w-8 h-8 rounded-full bg-indigo-600 dark:bg-white flex items-center justify-center text-xs font-bold text-white dark:text-black">
                  {user?.name?.split(' ').map((n) => n[0]).join('').toUpperCase() || 'SA'}
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{user?.name || 'Admin'}</p>
                  <p className="text-xs text-gray-500 capitalize">{user?.role || 'superadmin'}</p>
                </div>
                <button
                  onClick={logout}
                  className="p-2 rounded-lg text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </header>

        <motion.main
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.2 }}
          className="p-4 lg:p-6"
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
}
