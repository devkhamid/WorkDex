import React from 'react';
import { Sun, Moon, Monitor, Check, Palette, UserCircle2 } from 'lucide-react';
import { useTheme, ThemeMode } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

const OPTIONS: { value: ThemeMode; label: string; hint: string; icon: React.ElementType }[] = [
  { value: 'light', label: "Yorug'", hint: "Oq fon, klassik ko'rinish", icon: Sun },
  { value: 'dark', label: "Qorong'i", hint: "Ko'zni charchatmaydigan qora fon", icon: Moon },
  { value: 'system', label: 'Tizim', hint: "Qurilma sozlamasiga moslashadi", icon: Monitor },
];

const Preview: React.FC<{ dark: boolean }> = ({ dark }) => {
  const bg = dark ? '#0f1218' : '#f6f7f9';
  const card = dark ? '#171b24' : '#ffffff';
  const line = dark ? '#2a303c' : '#e4e7ec';
  const text = dark ? '#3a4150' : '#d5d9e0';
  return (
    <div style={{ background: bg, borderColor: line }} className="h-20 rounded-lg border p-2 flex gap-1.5">
      <div style={{ background: card, borderColor: line }} className="w-6 rounded border" />
      <div className="flex-1 flex flex-col gap-1.5">
        <div style={{ background: card, borderColor: line }} className="h-4 rounded border" />
        <div style={{ background: card, borderColor: line }} className="flex-1 rounded border p-1.5 flex flex-col gap-1">
          <div style={{ background: '#ff7a16' }} className="h-1.5 w-1/3 rounded-full" />
          <div style={{ background: text }} className="h-1.5 w-2/3 rounded-full" />
        </div>
      </div>
    </div>
  );
};

export const SettingsPage: React.FC = () => {
  const { mode, resolved, setMode } = useTheme();
  const { user } = useAuth();

  return (
    <div className="p-4 sm:p-6 max-w-3xl space-y-5">
      <section className="bg-white border border-[#e4e7ec] rounded-xl p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-1">
          <Palette className="w-4 h-4 text-[#ff7a16]" />
          <h2 className="text-sm font-bold text-[#171b25]">Ko'rinish (mavzu)</h2>
        </div>
        <p className="text-xs text-gray-500 mb-4">
          Ilova rang mavzusini tanlang. Tanlov shu brauzerda saqlanadi.
          {mode === 'system' && (
            <> Hozir: <b className="text-gray-700">{resolved === 'dark' ? "qorong'i" : "yorug'"}</b>.</>
          )}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3" role="radiogroup" aria-label="Mavzu">
          {OPTIONS.map(opt => {
            const Icon = opt.icon;
            const active = mode === opt.value;
            const previewDark = opt.value === 'system' ? resolved === 'dark' : opt.value === 'dark';
            return (
              <button
                key={opt.value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setMode(opt.value)}
                className={`relative text-left rounded-xl border-2 p-3 transition-colors ${
                  active ? 'border-[#ff7a16] bg-orange-50/40' : 'border-[#e4e7ec] hover:border-gray-300'
                }`}
              >
                <Preview dark={previewDark} />
                <div className="mt-3 flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${active ? 'text-[#ff7a16]' : 'text-gray-500'}`} />
                  <span className="text-sm font-semibold text-[#171b25]">{opt.label}</span>
                  {active && (
                    <span className="ml-auto w-5 h-5 rounded-full bg-[#ff7a16] flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-gray-500 mt-0.5">{opt.hint}</p>
              </button>
            );
          })}
        </div>
      </section>

      {user && (
        <section className="bg-white border border-[#e4e7ec] rounded-xl p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-3">
            <UserCircle2 className="w-4 h-4 text-[#ff7a16]" />
            <h2 className="text-sm font-bold text-[#171b25]">Hisob</h2>
          </div>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-[11px] text-gray-500">Ism</dt>
              <dd className="font-medium text-[#171b25] break-words">{user.fullName}</dd>
            </div>
            <div>
              <dt className="text-[11px] text-gray-500">Email</dt>
              <dd className="font-medium text-[#171b25] break-all">{user.email}</dd>
            </div>
            {user.companyName && (
              <div>
                <dt className="text-[11px] text-gray-500">Kompaniya</dt>
                <dd className="font-medium text-[#171b25] break-words">{user.companyName}</dd>
              </div>
            )}
          </dl>
        </section>
      )}
    </div>
  );
};
