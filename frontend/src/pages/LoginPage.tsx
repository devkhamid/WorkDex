import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || "Kirishda xatolik yuz berdi. Email yoki parolni tekshiring.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f7f9] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-[#e4e7ec] rounded-2xl shadow-xl p-5 sm:p-8 space-y-6">
        {/* Brand */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-[#ff7a16] text-white flex items-center justify-center font-extrabold text-2xl mx-auto shadow-md">
            W
          </div>
          <h1 className="text-xl font-extrabold text-[#171b25]">WorkDex</h1>
          <p className="text-xs text-[#7b8190]">Loyiha boshqaruvi tizimiga kirish</p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Email yoki Login *</label>
            <div className="relative">
              <Mail className="w-3.5 h-3.5 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                required
                placeholder="superadmin yoki admin@kompaniya.uz"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-9 pl-9 pr-3 border border-[#e4e7ec] rounded-lg text-xs outline-none focus:border-[#ff7a16]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Parol *</label>
            <div className="relative">
              <Lock className="w-3.5 h-3.5 absolute left-3 top-3 text-gray-400" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-9 pl-9 pr-3 border border-[#e4e7ec] rounded-lg text-xs outline-none focus:border-[#ff7a16]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-10 bg-[#ff7a16] hover:bg-[#e86807] text-white font-semibold text-xs rounded-lg flex items-center justify-center gap-1.5 shadow-sm transition-all disabled:opacity-50 mt-2"
          >
            <span>{loading ? "Kirilmoqda..." : "Tizimga kirish"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
