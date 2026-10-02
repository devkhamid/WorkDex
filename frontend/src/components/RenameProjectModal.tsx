import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { projectsApi } from '../api/services';
import { Project } from '../types';

interface RenameProjectModalProps {
  project: Project | null;
  onClose: () => void;
  onRenamed: (project: Project) => void;
}

export const RenameProjectModal: React.FC<RenameProjectModalProps> = ({ project, onClose, onRenamed }) => {
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setName(project?.name ?? '');
    setError('');
  }, [project]);

  if (!project) return null;

  const trimmed = name.trim();
  const unchanged = trimmed === project.name.trim();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trimmed) {
      setError('Loyiha nomini kiriting.');
      return;
    }
    if (unchanged) {
      onClose();
      return;
    }
    setSaving(true);
    setError('');
    try {
      const updated = await projectsApi.rename(project.id, trimmed);
      onRenamed(updated);
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Nomni saqlab bo\'lmadi.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center sm:p-4"
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-xl shadow-xl max-h-[92vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#e4e7ec]">
          <h3 className="text-sm font-bold text-[#171b25]">Loyiha nomini o'zgartirish</h3>
          <button type="button" onClick={onClose} className="p-1 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-2">
          <label className="block text-xs font-semibold text-gray-700">Loyiha nomi</label>
          <input
            autoFocus
            type="text"
            maxLength={300}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full h-10 px-3 border border-[#e4e7ec] rounded-lg text-sm outline-none focus:border-[#ff7a16]"
          />
          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>

        <div className="flex gap-2 px-5 pb-5">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 h-10 border border-[#e4e7ec] rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50"
          >
            Bekor qilish
          </button>
          <button
            type="submit"
            disabled={saving || !trimmed}
            className="flex-1 h-10 bg-[#ff7a16] hover:bg-[#f06c0a] disabled:opacity-50 rounded-lg text-xs font-bold text-white"
          >
            {saving ? 'Saqlanmoqda...' : 'Saqlash'}
          </button>
        </div>
      </form>
    </div>
  );
};
