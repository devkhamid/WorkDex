import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Lock, Mail, User, Phone, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api/services';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('admin@wordex.uz');
  const [password, setPassword] = useState('admin123');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        await authApi.register({
          firstName,
          lastName,
          email,
          phoneNumber: phone,
          password,
          role
        });
        await login(email, password);
      } else {
        await login(email, password);
      }
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || "Kirishda xatolik yuz berdi. Email yoki parolni tekshiring.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f7f9] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-[#e4e7ec] rounded-2xl shadow-xl p-8 space-y-6">
        {/* Brand */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-[#ff7a16] text-white flex items-center justify-center font-extrabold text-2xl mx-auto shadow-md">
            W
          </div>
          <h1 className="text-xl font-extrabold text-[#171b25]">WorkDex</h1>
          <p className="text-xs text-[#7b8190]">
            {isRegister ? "Yangi xodimni ro'yxatdan o'tkazish" : "Loyiha boshqaruvi tizimiga kirish"}
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {isRegister && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Ism *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ali"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full h-9 px-3 border border-[#e4e7ec] rounded-lg text-xs outline-none focus:border-[#ff7a16]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Familiya *</label>
                  <input
                    type="text"
                    required
                    placeholder="Valiyev"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full h-9 px-3 border border-[#e4e7ec] rounded-lg text-xs outline-none focus:border-[#ff7a16]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Telefon raqam *</label>
                <input
                  type="text"
                  required
                  placeholder="+998901234567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full h-9 px-3 border border-[#e4e7ec] rounded-lg text-xs outline-none focus:border-[#ff7a16]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Rol</label>
                <select
                  value={role}
                  onChange={(e) => setRole(Number(e.target.value))}
                  className="w-full h-9 px-3 border border-[#e4e7ec] rounded-lg text-xs bg-white outline-none focus:border-[#ff7a16]"
                >
                  <option value={1}>Admin (Boshqaruvchi)</option>
                  <option value={2}>ProjectManager (Prorab / Menejer)</option>
                  <option value={3}>FieldWorker (Saha xodimi)</option>
                  <option value={4}>Finance (Moliyachi / Buxgalter)</option>
                  <option value={5}>Customer (Mijoz)</option>
                </select>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Email manzil *</label>
            <div className="relative">
              <Mail className="w-3.5 h-3.5 absolute left-3 top-3 text-gray-400" />
              <input
                type="email"
                required
                placeholder="admin@wordex.uz"
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
            className="w-full h-10 bg-[#ff7a16] hover:bg-[#e86807] text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 mt-4 active:scale-95"
          >
            <span>{loading ? "Tekshirilmoqda..." : (isRegister ? "Ro'yxatdan o'tish" : "Tizimga kirish")}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        <div className="text-center pt-2 border-t border-gray-100">
          <button
            onClick={() => setIsRegister(!isRegister)}
            className="text-xs text-[#ff7a16] font-semibold hover:underline"
          >
            {isRegister ? "Akkauntingiz bormi? Tizimga kiring" : "Yangi xodim qo'shish (Ro'yxatdan o'tish)"}
          </button>
        </div>
      </div>
    </div>
  );
};
