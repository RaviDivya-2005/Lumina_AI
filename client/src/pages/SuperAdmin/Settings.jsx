import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Save,
  User,
  Shield,
  Eye,
  EyeOff,
  CheckCircle2,
} from 'lucide-react';
import AdminLayout from '../../components/layout/AdminLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import useAuthStore from '../../store/authStore';

const settingsTabs = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'security', label: 'Security', icon: Shield },
];

export default function Settings() {
  const { user, updateProfile } = useAuthStore();
  const [activeTab, setActiveTab] = useState('profile');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const [profile, setProfile] = useState({
    name: user?.name || 'Super Admin',
    email: user?.email || 'superadmin@aiplatform.com',
  });

  const [password, setPassword] = useState({
    current: '',
    new: '',
    confirm: '',
  });
  const [showPw, setShowPw] = useState({ current: false, new: false, confirm: false });

  const handleSave = async () => {
    setSaving(true);
    setSuccess(false);
    setError('');
    try {
      if (!profile.name.trim() || !profile.email.trim()) {
        throw new Error('Name and email are required.');
      }
      if (activeTab === 'security') {
        if (!password.current || !password.new || !password.confirm) {
          throw new Error('Complete all password fields.');
        }
        if (password.new.length < 6) {
          throw new Error('Your new password must be at least 6 characters.');
        }
        if (password.new !== password.confirm) {
          throw new Error('New password and confirmation do not match.');
        }
        const { default: api } = await import('../../utils/api');
        await api.put('/auth/change-password', { password: password.new });
        setPassword({ current: '', new: '', confirm: '' });
      } else {
        await updateProfile({ name: profile.name.trim(), email: profile.email.trim() });
      }
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Unable to save changes.');
    } finally {
      setSaving(false);
    }
  };

  const renderTab = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="space-y-5">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-white flex items-center justify-center text-xl font-bold text-gray-900 dark:text-black">
                {profile.name.split(' ').map((n) => n[0]).join('').toUpperCase()}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{profile.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{profile.email}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Full Name" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
              <Input label="Email" type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} />
            </div>
          </div>
        );
      case 'security':
        return (
          <div className="space-y-5">
            {['current', 'new', 'confirm'].map((field) => (
              <div key={field}>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 capitalize">
                  {field === 'confirm' ? 'Confirm New Password' : field === 'current' ? 'Current Password' : 'New Password'}
                </label>
                <div className="relative">
                  <input
                    type={showPw[field] ? 'text' : 'password'}
                    value={password[field]}
                    onChange={(e) => setPassword({ ...password, [field]: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white dark:border-white/10 dark:bg-white/5 px-4 py-2.5 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-indigo-500 dark:focus:border-white/30 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-white/10 focus:outline-none transition-all pr-10 text-sm"
                    placeholder="••••••••"
                  />
                  <button type="button" onClick={() => setShowPw({ ...showPw, [field]: !showPw[field] })} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                    {showPw[field] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage your platform preferences</p>
            </div>
            <Button onClick={handleSave} loading={saving} icon={success ? CheckCircle2 : Save}>
              {success ? 'Saved!' : 'Save Changes'}
            </Button>
          </div>

          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {settingsTabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all border border-transparent ${
                    isActive
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-black shadow-sm'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-slate-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-white/5'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <Card>
            {error && <p role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 dark:border-red-500/30 dark:bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-300">{error}</p>}
            {renderTab()}
          </Card>
        </motion.div>
      </div>
    </AdminLayout>
  );
}
