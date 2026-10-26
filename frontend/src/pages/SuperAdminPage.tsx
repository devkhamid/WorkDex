import React, { useEffect, useState } from 'react';
import { ShieldCheck, Plus, Building2, UserCheck, UserX, Mail, Phone, Lock, Search, Trash2 } from 'lucide-react';
import { usersApi } from '../api/services';
import { User, UserRole } from '../types';

export const SuperAdminPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<number>(UserRole.Admin);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await usersApi.getAll();
      setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await usersApi.createAdmin({
        firstName: newFirstName,
        lastName: newLastName,
        email: newEmail,
        phoneNumber: newPhone || undefined,
        companyName: newCompanyName,
        password: newPassword,
        role: Number(newRole)
      });
      setIsModalOpen(false);
      setNewFirstName('');
      setNewLastName('');
      setNewEmail('');
      setNewPhone('');
      setNewCompanyName('');
      setNewPassword('');
      loadUsers();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Xatolik yuz berdi');
    }
  };

  const handleToggleActive = async (userId: string) => {
    try {
      await usersApi.toggleActive(userId);
      loadUsers();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Xatolik yuz berdi');
    }
  };

  const handleDeleteUser = async (userId: string, name: string) => {
    if (!window.confirm(`${name} hisobini butunlay o'chirishni tasdiqlaysizmi?`)) {
      return;
    }
    try {
      await usersApi.deleteUser(userId);
      loadUsers();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Xatolik yuz berdi');
    }
  };

  const filteredUsers = users.filter(u =>
    u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.companyName && u.companyName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const adminsCount = users.filter(u => u.role === UserRole.Admin || u.role === UserRole.SuperAdmin).length;
  const activeCount = users.filter(u => u.isActive).length;

  return (
    <div className="p-4 sm:p-6 space-y-5 bg-white">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-gray-100">
        <div className="min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <ShieldCheck className="w-6 h-6 text-[#ff7a16]" />
            <h2 className="text-xl font-bold text-[#171b25] break-words">Super Admin — Kompaniyalar & Adminlar Boshqaruvi</h2>
          </div>
          <p className="text-xs text-[#7b8190] mt-0.5">
            WorkDex platformasidagi barcha korxonalar, adminlar va xodimlarni markaziy boshqarish
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-[#ff7a16] hover:bg-[#e86807] text-white font-semibold text-xs min-h-9 px-4 py-2 rounded-lg flex items-center gap-1.5 shadow-xs transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Yangi Kompaniya & Admin qo'shish</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white border border-[#e4e7ec] rounded-xl p-4 sm:p-5 shadow-xs flex items-center gap-3 sm:gap-4 min-w-0">
          <div className="w-12 h-12 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-[#ff7a16]">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <small className="block text-[11px] font-medium text-gray-500">Jami Ro'yxatdan O'tgan Adminlar</small>
            <strong className="text-2xl font-bold text-gray-900">{adminsCount} ta</strong>
          </div>
        </div>

        <div className="bg-white border border-[#e4e7ec] rounded-xl p-4 sm:p-5 shadow-xs flex items-center gap-3 sm:gap-4 min-w-0">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <small className="block text-[11px] font-medium text-gray-500">Faol Foydalanuvchilar</small>
            <strong className="text-2xl font-bold text-emerald-600">{activeCount} ta</strong>
          </div>
        </div>

        <div className="bg-white border border-[#e4e7ec] rounded-xl p-4 sm:p-5 shadow-xs flex items-center gap-3 sm:gap-4 min-w-0">
          <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <small className="block text-[11px] font-medium text-gray-500">Platforma Holati</small>
            <strong className="text-2xl font-bold text-purple-700">100% Xavfsiz</strong>
          </div>
        </div>
      </div>

      <div className="bg-white border border-[#e4e7ec] rounded-xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-[#e4e7ec] flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 border border-[#e4e7ec] rounded-lg px-3 h-9 w-full sm:w-72 bg-gray-50/50">
            <Search className="w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Admin yoki kompaniyani qidirish..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs bg-transparent outline-none"
            />
          </div>
          <span className="text-xs text-gray-500 font-medium">{filteredUsers.length} ta foydalanuvchi</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-xs">
            <thead>
              <tr className="border-b border-[#e4e7ec] bg-gray-50/50">
                <th className="py-3 px-5 font-bold text-gray-500 text-[10px] uppercase">KOMPANIYA / KORXONA</th>
                <th className="py-3 px-5 font-bold text-gray-500 text-[10px] uppercase">ADMIN / MAS'UL</th>
                <th className="py-3 px-5 font-bold text-gray-500 text-[10px] uppercase">EMAIL & TELEFON</th>
                <th className="py-3 px-5 font-bold text-gray-500 text-[10px] uppercase">ROLI</th>
                <th className="py-3 px-5 font-bold text-gray-500 text-[10px] uppercase">HOLATI</th>
                <th className="py-3 px-5 font-bold text-gray-500 text-[10px] uppercase text-right">AMAL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-3.5 px-5">
                    <div className="font-bold text-gray-900 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-gray-400" />
                      <span>{u.companyName || 'Bosh Kompaniya'}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-5 font-semibold text-gray-800">
                    {u.fullName}
                  </td>
                  <td className="py-3.5 px-5">
                    <div className="text-gray-700 flex items-center gap-1"><Mail className="w-3 h-3 text-gray-400" /> {u.email}</div>
                    <div className="text-[10px] text-gray-400 mt-0.5">{u.phoneNumber || '-'}</div>
                  </td>
                  <td className="py-3.5 px-5">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      u.role === UserRole.SuperAdmin
                        ? 'bg-purple-100 text-purple-800 border border-purple-200'
                        : u.role === UserRole.Admin
                        ? 'bg-orange-100 text-orange-800 border border-orange-200'
                        : 'bg-blue-100 text-blue-800 border border-blue-200'
                    }`}>
                      {u.roleName}
                    </span>
                  </td>
                  <td className="py-3.5 px-5">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      u.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${u.isActive ? 'bg-emerald-600' : 'bg-red-600'}`} />
                      {u.isActive ? 'Faol' : 'O\'chirilgan'}
                    </span>
                  </td>
                  <td className="py-3.5 px-5 text-right">
                    {u.role !== UserRole.SuperAdmin && (
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleToggleActive(u.id)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors border ${
                            u.isActive
                              ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                          }`}
                        >
                          {u.isActive ? "To'xtatish" : 'Faollashtirish'}
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u.id, u.companyName || u.fullName)}
                          title="Butunlay o'chirish"
                          className="min-w-8 min-h-8 p-1 rounded-lg text-red-600 hover:bg-red-50 border border-red-200 transition-colors inline-flex items-center justify-center"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-xs text-gray-400">
                    Foydalanuvchilar topilmadi
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-xl p-4 sm:p-6 w-full sm:max-w-md max-h-[92vh] overflow-y-auto shadow-xl border border-gray-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-sm text-[#171b25] flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-[#ff7a16]" />
                <span>Yangi Kompaniya & Admin Qo'shish</span>
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-sm">✕</button>
            </div>

            <form onSubmit={handleCreateAdmin} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Kompaniya Nomi *</label>
                <input
                  type="text"
                  required
                  placeholder="Grand Stroy MCHJ"
                  value={newCompanyName}
                  onChange={(e) => setNewCompanyName(e.target.value)}
                  className="w-full h-9 px-3 border border-gray-300 rounded-lg text-xs outline-none focus:border-[#ff7a16]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Ism *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ali"
                    value={newFirstName}
                    onChange={(e) => setNewFirstName(e.target.value)}
                    className="w-full h-9 px-3 border border-gray-300 rounded-lg text-xs outline-none focus:border-[#ff7a16]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Familiya *</label>
                  <input
                    type="text"
                    required
                    placeholder="Valiyev"
                    value={newLastName}
                    onChange={(e) => setNewLastName(e.target.value)}
                    className="w-full h-9 px-3 border border-gray-300 rounded-lg text-xs outline-none focus:border-[#ff7a16]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  required
                  placeholder="admin@grandstroy.uz"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full h-9 px-3 border border-gray-300 rounded-lg text-xs outline-none focus:border-[#ff7a16]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Telefon raqam</label>
                <input
                  type="text"
                  placeholder="+998901234567"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full h-9 px-3 border border-gray-300 rounded-lg text-xs outline-none focus:border-[#ff7a16]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Parol (kamida 6 belgi) *</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full h-9 px-3 border border-gray-300 rounded-lg text-xs outline-none focus:border-[#ff7a16]"
                />
              </div>

              <div className="flex flex-wrap justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 border rounded-lg text-xs text-gray-600"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#ff7a16] text-white rounded-lg text-xs font-semibold hover:bg-[#e86807]"
                >
                  Kompaniya & Admin Qo'shish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
