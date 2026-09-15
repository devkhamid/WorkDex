import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Download, Save, Building2, User as UserIcon, ChevronDown, ChevronUp } from 'lucide-react';
import { agreementsApi, customersApi } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { Customer } from '../types';
import { numberToWordsRu, MONTHS_RU } from '../utils/numberToWords';

export const AgreementFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const printRef = useRef<HTMLDivElement>(null);
  const isEdit = !!id && id !== 'new';

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showContractorFields, setShowContractorFields] = useState(false);
  const [showExtraRequisites, setShowExtraRequisites] = useState(false);

  // 1 = Jismoniy shaxs (Individual), 2 = Yuridik shaxs (LegalEntity)
  const [clientType, setClientType] = useState<1 | 2>(1);

  // Umumiy shartnoma shakli
  const [contractNumber, setContractNumber] = useState(1);
  const [day, setDay] = useState(new Date().getDate());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [projectName, setProjectName] = useState('');

  // Jismoniy shaxs maydonlari
  const [customerId, setCustomerId] = useState('');
  const [customerFullName, setCustomerFullName] = useState('');
  const [customerPassport, setCustomerPassport] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  // Yuridik shaxs (Buyurtmachi) maydonlari
  const [companyName, setCompanyName] = useState('');
  const [directorName, setDirectorName] = useState('');
  const [directorTitle, setDirectorTitle] = useState('Ген. директора');
  const [foundationDoc, setFoundationDoc] = useState('Устава');
  const [legalAddress, setLegalAddress] = useState('');
  const [inn, setInn] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [bankName, setBankName] = useState('');
  const [mfo, setMfo] = useState('');
  const [secondBankName, setSecondBankName] = useState('');
  const [secondBankAccount, setSecondBankAccount] = useState('');
  const [secondMfo, setSecondMfo] = useState('');
  const [oked, setOked] = useState('');
  const [okpo, setOkpo] = useState('');
  const [ndsRegNumber, setNdsRegNumber] = useState('');

  // Obyekt
  const [objectAddress, setObjectAddress] = useState('г. Ташкент');
  const [block, setBlock] = useState('');
  const [apartmentNumber, setApartmentNumber] = useState('');
  const [areaM2, setAreaM2] = useState('');

  // Moliya
  const [totalAmount, setTotalAmount] = useState('');
  const [prepayPct, setPrepayPct] = useState(40);
  const [intermediatePct, setIntermediatePct] = useState(40);
  const [finalPct, setFinalPct] = useState(20);

  // Bajaruvchi (Podryadchik / Sizning firmangiz)
  const defaultCompanyName = user?.companyName || 'ООО «UNIO ARCHITECTS»';
  const defaultDirector = user?.fullName || 'Фозилова А.А.';
  const [contractorCompanyName, setContractorCompanyName] = useState(defaultCompanyName);
  const [contractorDirectorName, setContractorDirectorName] = useState(defaultDirector);
  const [contractorAddress, setContractorAddress] = useState('г. Ташкент, Яккасарайский район, ул. Бабура, дом 58а.');
  const [contractorBankAccount, setContractorBankAccount] = useState('20208000507273070001');
  const [contractorBankName, setContractorBankName] = useState('Г. ТАШКЕНТ, ЧАКБ ТРАСТБАНК');
  const [contractorMfo, setContractorMfo] = useState('00491');
  const [contractorInn, setContractorInn] = useState('312186197');
  const [contractorPhone, setContractorPhone] = useState('+998 77 310 77 71');

  useEffect(() => {
    loadCustomers();
    if (isEdit) {
      loadAgreement();
    } else {
      loadNextNumber();
    }
  }, [id]);

  const loadCustomers = async () => {
    try {
      const data = await customersApi.getAll();
      setCustomers(data);
    } catch {}
  };

  const loadNextNumber = async () => {
    try {
      const num = await agreementsApi.getNextNumber();
      setContractNumber(num);
    } catch {}
  };

  const loadAgreement = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const a = await agreementsApi.getById(id);
      setClientType(a.clientType === 2 ? 2 : 1);
      setContractNumber(a.contractNumber || 1);
      setDay(a.day || new Date().getDate());
      setMonth(a.month || new Date().getMonth() + 1);
      setYear(a.year || new Date().getFullYear());
      setProjectName(a.projectName || '');
      setCustomerId(a.customerId || '');
      setCustomerFullName(a.customerFullName || '');
      setCustomerPassport(a.customerPassportSeries || '');
      setCustomerAddress(a.customerAddress || '');
      setCustomerPhone(a.customerPhone || '');

      setCompanyName(a.companyName || '');
      setDirectorName(a.directorName || '');
      setDirectorTitle(a.directorTitle || 'Ген. директора');
      setFoundationDoc(a.foundationDoc || 'Устава');
      setLegalAddress(a.legalAddress || '');
      setInn(a.inn || '');
      setBankAccount(a.bankAccount || '');
      setBankName(a.bankName || '');
      setMfo(a.mfo || '');
      setSecondBankName(a.secondBankName || '');
      setSecondBankAccount(a.secondBankAccount || '');
      setSecondMfo(a.secondMfo || '');
      setOked(a.oked || '');
      setOkpo(a.okpo || '');
      setNdsRegNumber(a.ndsRegNumber || '');

      if (a.contractorCompanyName) setContractorCompanyName(a.contractorCompanyName);
      if (a.contractorDirectorName) setContractorDirectorName(a.contractorDirectorName);
      if (a.contractorAddress) setContractorAddress(a.contractorAddress);
      if (a.contractorBankAccount) setContractorBankAccount(a.contractorBankAccount);
      if (a.contractorBankName) setContractorBankName(a.contractorBankName);
      if (a.contractorMfo) setContractorMfo(a.contractorMfo);
      if (a.contractorInn) setContractorInn(a.contractorInn);
      if (a.contractorPhone) setContractorPhone(a.contractorPhone);

      setObjectAddress(a.objectAddress || 'г. Ташкент');
      setBlock(a.block || '');
      setApartmentNumber(a.apartmentNumber || '');
      setAreaM2(a.areaM2 ? String(a.areaM2) : '');
      setTotalAmount(a.totalAmountUZS ? String(a.totalAmountUZS) : '');
      setPrepayPct(a.prepaymentPercent ?? 40);
      setIntermediatePct(a.intermediatePercent ?? 40);
      setFinalPct(a.finalPercent ?? 20);
    } catch {
      alert('Shartnoma topilmadi');
      navigate('/agreements');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerSelect = (cId: string) => {
    setCustomerId(cId);
    if (cId) {
      const c = customers.find(item => item.id === cId);
      if (c) {
        if (clientType === 1) {
          setCustomerFullName(c.fullName);
          setCustomerPassport((c as any).passportSeries || '');
          setCustomerAddress(c.address || '');
          setCustomerPhone(c.phoneNumber || '');
        } else {
          setCompanyName(c.fullName);
          setLegalAddress(c.address || '');
          setCustomerPhone(c.phoneNumber || '');
        }
      }
    }
  };

  const handleSave = async () => {
    if (!projectName.trim()) {
      alert('Loyiha nomini kiriting');
      return;
    }
    try {
      setSaving(true);
      const payload = {
        contractNumber,
        day,
        month,
        year,
        projectName,
        clientType,
        customerId: customerId || null,
        customerFullName: customerFullName || null,
        customerPassportSeries: customerPassport || null,
        customerAddress: customerAddress || null,
        customerPhone: customerPhone || null,

        companyName: companyName || null,
        directorName: directorName || null,
        directorTitle: directorTitle || 'Ген. директора',
        foundationDoc: foundationDoc || 'Устава',
        legalAddress: legalAddress || null,
        inn: inn || null,
        bankAccount: bankAccount || null,
        bankName: bankName || null,
        mfo: mfo || null,
        secondBankName: secondBankName || null,
        secondBankAccount: secondBankAccount || null,
        secondMfo: secondMfo || null,
        oked: oked || null,
        okpo: okpo || null,
        ndsRegNumber: ndsRegNumber || null,

        contractorCompanyName,
        contractorDirectorName,
        contractorAddress,
        contractorBankAccount,
        contractorBankName,
        contractorMfo,
        contractorInn,
        contractorPhone,

        objectAddress,
        block,
        apartmentNumber,
        areaM2: areaM2 ? parseFloat(areaM2) : null,
        totalAmountUZS: parseFloat(totalAmount) || 0,
        prepaymentPercent: prepayPct,
        intermediatePercent: intermediatePct,
        finalPercent: finalPct,
      };

      if (isEdit && id) {
        await agreementsApi.update(id, payload);
      } else {
        await agreementsApi.create(payload);
      }
      navigate('/agreements');
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Saqlashda xatolik yuz berdi');
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const totalNum = parseFloat(totalAmount) || 0;
  const amountInWords = totalNum > 0 ? numberToWordsRu(totalNum) : '';
  const prepayAmount = Math.round((totalNum * prepayPct) / 100);
  const intermediateAmount = Math.round((totalNum * intermediatePct) / 100);
  const finalAmount = Math.round((totalNum * finalPct) / 100);

  const fmt = (n: number) => new Intl.NumberFormat('ru-RU').format(n);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#7c3aed] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          body { background: white; }
          .contract-preview {
            position: fixed !important;
            top: 0; left: 0;
            width: 100% !important;
            height: auto !important;
            overflow: visible !important;
            box-shadow: none !important;
            border-radius: 0 !important;
          }
        }
      `}</style>

      <div className="flex h-full bg-[#f8f9fb]">
        {/* LEFT — Form */}
        <div className="w-[460px] flex-shrink-0 bg-white border-r border-gray-200 overflow-y-auto no-print">
          <div className="p-5">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <button
                onClick={() => navigate('/agreements')}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
                title="Ortga"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h2 className="font-bold text-[#171b25] text-sm">
                  {isEdit ? 'Shartnomani tahrirlash' : 'Yangi shartnoma'}
                </h2>
                <p className="text-[11px] text-gray-400">
                  {clientType === 1 ? 'Jismoniy shaxs bilan' : 'Yuridik shaxs bilan'}
                </p>
              </div>
            </div>

            {/* MIJOZ TURI (Jismoniy shaxs vs Yuridik shaxs) */}
            <div className="mb-4 p-1 bg-gray-100 rounded-xl flex items-center gap-1">
              <button
                type="button"
                onClick={() => setClientType(1)}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  clientType === 1
                    ? 'bg-white text-[#7c3aed] shadow-xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <UserIcon className="w-3.5 h-3.5" />
                Jismoniy shaxs
              </button>
              <button
                type="button"
                onClick={() => setClientType(2)}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  clientType === 2
                    ? 'bg-white text-[#7c3aed] shadow-xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                Yuridik shaxs
              </button>
            </div>

            {/* Section: Shartnoma shakli */}
            <div className="mb-4 border border-gray-100 rounded-xl p-3 bg-gray-50/50">
              <div className="flex items-center gap-2 mb-2.5">
                <div className="w-1 h-3.5 bg-[#7c3aed] rounded-full" />
                <span className="text-xs font-bold text-[#171b25] uppercase tracking-wide">
                  Shartnoma shakli
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2 mb-2">
                <div>
                  <label className="text-[10px] text-gray-500 block mb-1 font-medium">№</label>
                  <input
                    type="number"
                    value={contractNumber}
                    onChange={e => setContractNumber(parseInt(e.target.value) || 1)}
                    className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs text-center font-bold focus:outline-none focus:border-[#7c3aed] bg-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 block mb-1 font-medium">Kun</label>
                  <input
                    type="number"
                    min={1}
                    max={31}
                    value={day}
                    onChange={e => setDay(parseInt(e.target.value) || 1)}
                    className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs text-center focus:outline-none focus:border-[#7c3aed] bg-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 block mb-1 font-medium">Oy</label>
                  <select
                    value={month}
                    onChange={e => setMonth(parseInt(e.target.value))}
                    className="w-full border border-gray-200 rounded-lg px-1 py-1.5 text-xs focus:outline-none focus:border-[#7c3aed] bg-white"
                  >
                    {[...Array(12)].map((_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {MONTHS_RU[i + 1] || i + 1}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 block mb-1 font-medium">Yil</label>
                  <input
                    type="number"
                    value={year}
                    onChange={e => setYear(parseInt(e.target.value) || 2026)}
                    className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs text-center focus:outline-none focus:border-[#7c3aed] bg-white"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] text-gray-500 block mb-1 font-medium">
                  Loyiha nomi (Shartnoma uchun)
                </label>
                <input
                  type="text"
                  value={projectName}
                  onChange={e => setProjectName(e.target.value)}
                  placeholder="Квартира в жилом комплексе «Newport»..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-[#7c3aed] bg-white"
                />
              </div>
            </div>

            {/* Section: Buyurtmachi (Zakazchik) */}
            <div className="mb-4 border border-gray-100 rounded-xl p-3 bg-gray-50/50">
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-3.5 bg-[#ff7a16] rounded-full" />
                  <span className="text-xs font-bold text-[#171b25] uppercase tracking-wide">
                    {clientType === 1 ? 'Mijoz (Jismoniy shaxs)' : 'Buyurtmachi (Yuridik shaxs)'}
                  </span>
                </div>
                {customers.length > 0 && (
                  <select
                    value={customerId}
                    onChange={e => handleCustomerSelect(e.target.value)}
                    className="text-[10px] border border-gray-200 rounded px-2 py-1 bg-white text-gray-600 focus:outline-none"
                  >
                    <option value="">Mavjud mijozdan...</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.fullName}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {clientType === 1 ? (
                /* JISMONIY SHAXS FORMA MAYDONLARI */
                <div className="space-y-2">
                  <div>
                    <label className="text-[10px] text-gray-500 block mb-1 font-medium">
                      To'liq ism (F.I.O.)
                    </label>
                    <input
                      type="text"
                      value={customerFullName}
                      onChange={e => setCustomerFullName(e.target.value)}
                      placeholder="Ahmet Necati yoki Ikramov U.Yu."
                      className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-[#7c3aed] bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 block mb-1 font-medium">
                      Pasport seriyasi va raqami
                    </label>
                    <input
                      type="text"
                      value={customerPassport}
                      onChange={e => setCustomerPassport(e.target.value)}
                      placeholder="AA 0000000"
                      className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-[#7c3aed] bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 block mb-1 font-medium">
                      Yashash manzili
                    </label>
                    <input
                      type="text"
                      value={customerAddress}
                      onChange={e => setCustomerAddress(e.target.value)}
                      placeholder="г. Ташкент, Яккасарайский район, улица..."
                      className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-[#7c3aed] bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 block mb-1 font-medium">
                      Telefon
                    </label>
                    <input
                      type="text"
                      value={customerPhone}
                      onChange={e => setCustomerPhone(e.target.value)}
                      placeholder="+998 90 000 00 00"
                      className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-[#7c3aed] bg-white"
                    />
                  </div>
                </div>
              ) : (
                /* YURIDIK SHAXS FORMA MAYDONLARI */
                <div className="space-y-2">
                  <div>
                    <label className="text-[10px] text-gray-500 block mb-1 font-medium">
                      Tashkilot nomi (Kompaniya)
                    </label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={e => setCompanyName(e.target.value)}
                      placeholder="СП ООО «Test Test Test LTE» yoki MCHJ '...'"
                      className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-[#7c3aed] bg-white font-semibold"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-gray-500 block mb-1 font-medium">
                        Direktor / Rahbar (F.I.O.)
                      </label>
                      <input
                        type="text"
                        value={directorName}
                        onChange={e => setDirectorName(e.target.value)}
                        placeholder="Икрамов У.Ю."
                        className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-[#7c3aed] bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-500 block mb-1 font-medium">
                        Lavozimi
                      </label>
                      <input
                        type="text"
                        value={directorTitle}
                        onChange={e => setDirectorTitle(e.target.value)}
                        placeholder="Ген. Директора"
                        className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-[#7c3aed] bg-white"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-gray-500 block mb-1 font-medium">
                        Asos (Hujjat)
                      </label>
                      <input
                        type="text"
                        value={foundationDoc}
                        onChange={e => setFoundationDoc(e.target.value)}
                        placeholder="Устава"
                        className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-[#7c3aed] bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-500 block mb-1 font-medium">
                        INN (СТИР)
                      </label>
                      <input
                        type="text"
                        value={inn}
                        onChange={e => setInn(e.target.value)}
                        placeholder="300000000"
                        className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-[#7c3aed] bg-white font-mono"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 block mb-1 font-medium">
                      Yuridik manzil
                    </label>
                    <input
                      type="text"
                      value={legalAddress}
                      onChange={e => setLegalAddress(e.target.value)}
                      placeholder="г. Ташкент, Яккасарайский р-н, улица Абдулла Каххара, 133"
                      className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-[#7c3aed] bg-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-gray-500 block mb-1 font-medium">
                        Bank nomi
                      </label>
                      <input
                        type="text"
                        value={bankName}
                        onChange={e => setBankName(e.target.value)}
                        placeholder="Хамкор Банк Универсальный ОБУ"
                        className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-[#7c3aed] bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-500 block mb-1 font-medium">
                        MFO
                      </label>
                      <input
                        type="text"
                        value={mfo}
                        onChange={e => setMfo(e.target.value)}
                        placeholder="00083"
                        className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-[#7c3aed] bg-white font-mono"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 block mb-1 font-medium">
                      Hisob raqami (Р/С - 20 xonali)
                    </label>
                    <input
                      type="text"
                      value={bankAccount}
                      onChange={e => setBankAccount(e.target.value)}
                      placeholder="20208000000000000000"
                      className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-[#7c3aed] bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 block mb-1 font-medium">
                      Telefon
                    </label>
                    <input
                      type="text"
                      value={customerPhone}
                      onChange={e => setCustomerPhone(e.target.value)}
                      placeholder="+998 99 999 99 99"
                      className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-[#7c3aed] bg-white"
                    />
                  </div>

                  {/* Qo'shimcha rekvizitlar toggle */}
                  <div>
                    <button
                      type="button"
                      onClick={() => setShowExtraRequisites(!showExtraRequisites)}
                      className="text-[11px] text-[#7c3aed] font-medium flex items-center gap-1 hover:underline py-1"
                    >
                      {showExtraRequisites ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      {showExtraRequisites ? "Qo'shimcha rekvizitlarni yashirish" : "Qo'shimcha rekvizitlar (2-bank, OKED, NDS...)"}
                    </button>
                    {showExtraRequisites && (
                      <div className="p-2.5 bg-white border border-gray-200 rounded-lg space-y-2 mt-1">
                        <div>
                          <label className="text-[10px] text-gray-500 block mb-0.5">2-Bank nomi</label>
                          <input
                            type="text"
                            value={secondBankName}
                            onChange={e => setSecondBankName(e.target.value)}
                            placeholder="ТОШКЕНТ Ш., 'ТDASDASК' ХА БАНКИНИНГ БОШ ОФИСИ"
                            className="w-full border border-gray-200 rounded px-2 py-1 text-xs"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] text-gray-500 block mb-0.5">Vtor/schet</label>
                            <input
                              type="text"
                              value={secondBankAccount}
                              onChange={e => setSecondBankAccount(e.target.value)}
                              placeholder="2021 1515 15151 9 8002"
                              className="w-full border border-gray-200 rounded px-2 py-1 text-xs font-mono"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-gray-500 block mb-0.5">2-Bank MFO</label>
                            <input
                              type="text"
                              value={secondMfo}
                              onChange={e => setSecondMfo(e.target.value)}
                              placeholder="00491"
                              className="w-full border border-gray-200 rounded px-2 py-1 text-xs font-mono"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] text-gray-500 block mb-0.5">OKED</label>
                            <input
                              type="text"
                              value={oked}
                              onChange={e => setOked(e.target.value)}
                              placeholder="41202"
                              className="w-full border border-gray-200 rounded px-2 py-1 text-xs"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-gray-500 block mb-0.5">OKPO</label>
                            <input
                              type="text"
                              value={okpo}
                              onChange={e => setOkpo(e.target.value)}
                              placeholder="22222221"
                              className="w-full border border-gray-200 rounded px-2 py-1 text-xs"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] text-gray-500 block mb-0.5">Reg. nomer NDS</label>
                          <input
                            type="text"
                            value={ndsRegNumber}
                            onChange={e => setNdsRegNumber(e.target.value)}
                            placeholder="326010017789"
                            className="w-full border border-gray-200 rounded px-2 py-1 text-xs font-mono"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Section: Obyekt */}
            <div className="mb-4 border border-gray-100 rounded-xl p-3 bg-gray-50/50">
              <div className="flex items-center gap-2 mb-2.5">
                <div className="w-1 h-3.5 bg-blue-500 rounded-full" />
                <span className="text-xs font-bold text-[#171b25] uppercase tracking-wide">
                  Obyekt ma'lumotlari
                </span>
              </div>
              <div className="space-y-2">
                <div>
                  <label className="text-[10px] text-gray-500 block mb-1 font-medium">
                    Obyekt manzili
                  </label>
                  <input
                    type="text"
                    value={objectAddress}
                    onChange={e => setObjectAddress(e.target.value)}
                    placeholder="г. Ташкент"
                    className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-[#7c3aed] bg-white"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] text-gray-500 block mb-1 font-medium">Blok</label>
                    <input
                      type="text"
                      value={block}
                      onChange={e => setBlock(e.target.value)}
                      placeholder="X"
                      className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs text-center focus:outline-none focus:border-[#7c3aed] bg-white font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 block mb-1 font-medium">
                      Kvartira №
                    </label>
                    <input
                      type="text"
                      value={apartmentNumber}
                      onChange={e => setApartmentNumber(e.target.value)}
                      placeholder="40"
                      className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs text-center focus:outline-none focus:border-[#7c3aed] bg-white font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 block mb-1 font-medium">
                      Maydon (m²)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={areaM2}
                      onChange={e => setAreaM2(e.target.value)}
                      placeholder="462.67"
                      className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs text-center focus:outline-none focus:border-[#7c3aed] bg-white font-semibold"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section: Moliya */}
            <div className="mb-4 border border-gray-100 rounded-xl p-3 bg-gray-50/50">
              <div className="flex items-center gap-2 mb-2.5">
                <div className="w-1 h-3.5 bg-green-500 rounded-full" />
                <span className="text-xs font-bold text-[#171b25] uppercase tracking-wide">
                  Moliya va To'lov tartibi
                </span>
              </div>
              <div className="mb-2">
                <label className="text-[10px] text-gray-500 block mb-1 font-medium">
                  Umumiy summa (raqamda, UZS)
                </label>
                <input
                  type="number"
                  value={totalAmount}
                  onChange={e => setTotalAmount(e.target.value)}
                  placeholder="150000000"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs font-bold text-[#171b25] focus:outline-none focus:border-[#7c3aed] bg-white"
                />
              </div>
              {amountInWords && (
                <div className="mb-2.5 px-3 py-1.5 bg-purple-50/60 border border-purple-100 rounded-lg">
                  <div className="text-[10px] text-purple-600 font-semibold mb-0.5">
                    So'zda (avtomatik):
                  </div>
                  <div className="text-xs text-purple-900 font-serif italic">
                    {amountInWords}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-3 gap-2 mb-2">
                <div>
                  <label className="text-[10px] text-gray-500 block mb-1 font-medium">Oldindan %</label>
                  <input
                    type="number"
                    value={prepayPct}
                    onChange={e => setPrepayPct(parseInt(e.target.value) || 0)}
                    className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs text-center font-bold focus:outline-none focus:border-[#7c3aed] bg-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 block mb-1 font-medium">O'rta bosqich %</label>
                  <input
                    type="number"
                    value={intermediatePct}
                    onChange={e => setIntermediatePct(parseInt(e.target.value) || 0)}
                    className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs text-center font-bold focus:outline-none focus:border-[#7c3aed] bg-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 block mb-1 font-medium">Yakuniy %</label>
                  <input
                    type="number"
                    value={finalPct}
                    onChange={e => setFinalPct(parseInt(e.target.value) || 0)}
                    className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs text-center font-bold focus:outline-none focus:border-[#7c3aed] bg-white"
                  />
                </div>
              </div>

              {totalNum > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <div className="bg-purple-50 rounded-lg p-2 text-center border border-purple-100">
                    <div className="text-[9px] text-purple-600 font-medium">{prepayPct}% Oldindan</div>
                    <div className="text-[11px] font-bold text-purple-800">{fmt(prepayAmount)}</div>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-2 text-center border border-blue-100">
                    <div className="text-[9px] text-blue-600 font-medium">{intermediatePct}% O'rta</div>
                    <div className="text-[11px] font-bold text-blue-800">{fmt(intermediateAmount)}</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-2 text-center border border-green-100">
                    <div className="text-[9px] text-green-600 font-medium">{finalPct}% Yakuniy</div>
                    <div className="text-[11px] font-bold text-green-800">{fmt(finalAmount)}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Section: Bajaruvchi firma (Podryadchik) */}
            <div className="mb-4 border border-gray-100 rounded-xl p-3 bg-gray-50/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-3.5 bg-indigo-500 rounded-full" />
                  <span className="text-xs font-bold text-[#171b25] uppercase tracking-wide">
                    Bajaruvchi (Sizning firmangiz)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowContractorFields(!showContractorFields)}
                  className="text-[11px] text-[#7c3aed] font-medium flex items-center gap-1 hover:underline"
                >
                  {showContractorFields ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  {showContractorFields ? "Yashirish" : "Tahrirlash"}
                </button>
              </div>

              {showContractorFields ? (
                <div className="space-y-2 mt-3 pt-3 border-t border-gray-200">
                  <div>
                    <label className="text-[10px] text-gray-500 block mb-0.5">Kompaniya nomi</label>
                    <input
                      type="text"
                      value={contractorCompanyName}
                      onChange={e => setContractorCompanyName(e.target.value)}
                      className="w-full border border-gray-200 rounded px-2.5 py-1 text-xs bg-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-gray-500 block mb-0.5">Direktor</label>
                      <input
                        type="text"
                        value={contractorDirectorName}
                        onChange={e => setContractorDirectorName(e.target.value)}
                        className="w-full border border-gray-200 rounded px-2.5 py-1 text-xs bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-500 block mb-0.5">INN</label>
                      <input
                        type="text"
                        value={contractorInn}
                        onChange={e => setContractorInn(e.target.value)}
                        className="w-full border border-gray-200 rounded px-2.5 py-1 text-xs bg-white font-mono"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 block mb-0.5">Yuridik manzil</label>
                    <input
                      type="text"
                      value={contractorAddress}
                      onChange={e => setContractorAddress(e.target.value)}
                      className="w-full border border-gray-200 rounded px-2.5 py-1 text-xs bg-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-gray-500 block mb-0.5">Bank</label>
                      <input
                        type="text"
                        value={contractorBankName}
                        onChange={e => setContractorBankName(e.target.value)}
                        className="w-full border border-gray-200 rounded px-2.5 py-1 text-xs bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-500 block mb-0.5">MFO</label>
                      <input
                        type="text"
                        value={contractorMfo}
                        onChange={e => setContractorMfo(e.target.value)}
                        className="w-full border border-gray-200 rounded px-2.5 py-1 text-xs bg-white font-mono"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-gray-500 block mb-0.5">Hisob raqam (Р/С)</label>
                      <input
                        type="text"
                        value={contractorBankAccount}
                        onChange={e => setContractorBankAccount(e.target.value)}
                        className="w-full border border-gray-200 rounded px-2.5 py-1 text-xs bg-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-500 block mb-0.5">Telefon</label>
                      <input
                        type="text"
                        value={contractorPhone}
                        onChange={e => setContractorPhone(e.target.value)}
                        className="w-full border border-gray-200 rounded px-2.5 py-1 text-xs bg-white"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-2 text-xs text-gray-600 bg-white p-2 rounded border border-gray-200/80">
                  <div className="font-bold text-[#171b25]">{contractorCompanyName}</div>
                  <div className="text-[11px] text-gray-500 mt-0.5">Direktor: {contractorDirectorName} • INN: {contractorInn}</div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2 sticky bottom-0 bg-white pt-3 pb-1 border-t border-gray-100">
              <button
                type="button"
                onClick={() => navigate('/agreements')}
                className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-lg text-xs font-semibold hover:bg-gray-50"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 bg-[#7c3aed] text-white py-2.5 rounded-lg text-xs font-semibold hover:bg-[#6d28d9] disabled:opacity-50 shadow-sm"
              >
                <Save className="w-3.5 h-3.5" />
                {saving ? 'Saqlanmoqda...' : 'Shartnomani saqlash'}
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT — Contract Preview */}
        <div className="flex-1 overflow-auto bg-gray-100">
          {/* Toolbar */}
          <div className="no-print bg-white border-b border-gray-200 px-5 py-3 flex items-center justify-between sticky top-0 z-10">
            <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">
              Shartnoma ko'rinishi
            </span>
            <div className="flex items-center gap-2">
              <div className="text-xs text-gray-400">PDF yuklash uchun:</div>
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 bg-[#171b25] text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-black"
              >
                <Download className="w-3.5 h-3.5" />
                PDF yuklash
              </button>
            </div>
          </div>

          {/* Contract Document (A4 Style) */}
          <div
            ref={printRef}
            className="contract-preview max-w-[840px] mx-auto my-6 bg-white shadow-xl rounded-lg p-14 text-sm leading-relaxed text-[#111]"
            style={{ fontFamily: '"Times New Roman", Times, serif' }}
          >
            {/* Header Logo */}
            <div className="text-center mb-8">
              <div className="text-3xl font-bold tracking-[0.25em] text-gray-950 mb-1 uppercase">
                {contractorCompanyName.replace(/^(ООО|OOO|СП ООО|ЧП|MCHJ)\s*[«"']/i, '').replace(/[»"']$/i, '') || 'UNIO'}
              </div>
              <div className="text-xs text-gray-500 tracking-[0.4em] uppercase font-sans font-semibold">
                ARCHITECTS & BUILD
              </div>
            </div>

            {/* Title */}
            <div className="text-center mb-6">
              <div className="text-base font-bold tracking-wide">
                ДОГОВОР ПОДРЯДА №{contractNumber}
              </div>
              <div className="text-sm mt-1 flex justify-between px-2 font-medium">
                <span>г. Ташкент</span>
                <span>«{day}» {MONTHS_RU[month] || ''} {year}г.</span>
              </div>
            </div>

            {/* Parties Intro */}
            <div className="mb-5 text-sm text-justify leading-relaxed">
              <p>
                {contractorCompanyName}, в дальнейшем именуемое «Подрядчик», в лице Ген. директора{' '}
                <strong>{contractorDirectorName || '____________'}</strong> действующего на основании Устава с одной стороны, и
              </p>
              {clientType === 1 ? (
                /* Jismoniy shaxs intro */
                <p className="mt-2">
                  гр. <strong>{customerFullName || '________________________'}</strong>, паспорт{' '}
                  <strong>{customerPassport || '____________'}</strong>, в дальнейшем именуемый(ая) «Заказчик», с другой стороны,
                  вместе именуемые «Стороны», а по отдельности «Сторона», заключили настоящий договор о нижеследующем:
                </p>
              ) : (
                /* Yuridik shaxs intro */
                <p className="mt-2">
                  <strong>{companyName || '________________________'}</strong>, в дальнейшем именуемое «Заказчик», в лице{' '}
                  {directorTitle} <strong>{directorName || '________________________'}</strong>, действующего на основании {foundationDoc},
                  с другой стороны, вместе именуемые «Стороны», а по отдельности «Сторона», заключили настоящий договор о нижеследующем:
                </p>
              )}
            </div>

            {/* Section 1 */}
            <div className="mb-5">
              <div className="font-bold text-center mb-2 tracking-wide">
                1. ПРЕДМЕТ ДОГОВОРА
              </div>
              <p className="text-sm text-justify indent-6">
                1.1. Подрядчик обязуется выполнить комплекс ремонтно-строительных работ в соответствии с проектом:{' '}
                <strong>{projectName || '________________________'}</strong> по адресу:{' '}
                <strong>{objectAddress || 'г. Ташкент'}</strong>, блок{' '}
                <strong>{block || '____'}</strong>, квартиры №{' '}
                <strong>{apartmentNumber || '____'}</strong>, общей площадью{' '}
                <strong>{areaM2 || '____'}</strong> м².
              </p>
              <p className="text-sm text-justify indent-6 mt-2">
                1.2. Подрядчик обязуется в соответствии с условиями настоящего договора выполнить работы,
                предусмотренные проектной документацией (сметой, локально-ресурсной ведомости), а Заказчик
                обязуется создать Подрядчику необходимые условия для выполнения строительных работ, принять
                их и производить оплату.
              </p>
            </div>

            {/* Section 2 */}
            <div className="mb-5">
              <div className="font-bold text-center mb-2 tracking-wide">
                2. СТОИМОСТЬ РАБОТ И ПОРЯДОК ОПЛАТЫ
              </div>
              <p className="text-sm text-justify indent-6">
                2.1. По данному договору общая стоимость услуг с учетом НДС составляет:{' '}
                {totalNum > 0 ? (
                  <strong>
                    {fmt(totalNum)} ({amountInWords})
                  </strong>
                ) : (
                  <span className="border-b border-gray-700 inline-block min-w-[200px]">&nbsp;</span>
                )}{' '}
                сум.
              </p>
              <p className="text-sm text-justify indent-6 mt-1.5">
                2.2. Окончательная стоимость договора будет определена по факту их выполнения, на основании
                подписанного Сторонами Акта приема-передачи выполненных Работ и накладных, счет-фактур
                приобретенных товаров.
              </p>
              <p className="text-sm text-justify indent-6 mt-1.5">
                2.3. Стоимость работ, выполняемых Подрядчиком по взаимному соглашению сторон, является
                договорной, согласно проектной документации (смете, локально-ресурсной ведомости, спецификации),
                являющихся неотъемлемой частью настоящего договора, оформляемый в качестве приложений к настоящему
                Договору.
              </p>
              <p className="text-sm text-justify indent-6 mt-1.5">
                2.4. Порядок приобретения дополнительных материалов и выполнения услуг, не входящих
                изначально согласованной сторонами сметной документации, выполняется исключительно по
                дополнительному соглашению сторон и производится отдельная оплата по данному документу.
              </p>
              <p className="text-sm font-bold mt-2 indent-6">2.4. Порядок платежей:</p>
              <p className="text-sm indent-8 mt-1">
                2.4.1. <strong>{prepayPct}%</strong> от стоимости Договора{' '}
                {totalNum > 0 && <span>— <strong>{fmt(prepayAmount)} сум</strong> — </span>}
                выплачивается в качестве предоплаты при подписании настоящего Договора.
              </p>
              <p className="text-sm indent-8 mt-1">
                2.4.2. <strong>{intermediatePct}%</strong> от стоимости Договора{' '}
                {totalNum > 0 && <span>— <strong>{fmt(intermediateAmount)} сум</strong> — </span>}
                выплачивается после завершения промежуточного этапа работ.
              </p>
              <p className="text-sm indent-8 mt-1">
                2.4.3. Оставшиеся <strong>{finalPct}%</strong> от стоимости Договора{' '}
                {totalNum > 0 && <span>— <strong>{fmt(finalAmount)} сум</strong> — </span>}
                выплачиваются после полного завершения работ.
              </p>
            </div>

            {/* Section 3 */}
            <div className="mb-5">
              <div className="font-bold text-center mb-2 tracking-wide">
                3. СРОКИ ВЫПОЛНЕНИЯ РАБОТ
              </div>
              <p className="text-sm indent-6">
                3.1. Договор вступает в силу с момента его подписания сторонами.
              </p>
              <p className="text-sm indent-6 mt-1">
                3.2. Начало работ – в течение 1 рабочего дня после выполнения Заказчиком условий согласно п.п. 2.4.1
              </p>
              <p className="text-sm indent-6 mt-1">
                3.3. Окончание работ – согласно согласованного Сторонами графика производства работ.
              </p>
              <p className="text-sm indent-6 mt-1">
                3.4. При изменении первоначально указанных объемов работ или видов работ сроки выполнения работ могут изменяться.
              </p>
            </div>

            {/* Section 4 */}
            <div className="mb-5">
              <div className="font-bold text-center mb-2 tracking-wide">
                4. ПОРЯДОК СДАЧИ-ПРИЕМКИ РАБОТ:
              </div>
              <p className="text-sm text-justify indent-6">
                4.1. Приемка законченного строительством объекта осуществляется после выполнения сторонами всех
                обязательств, предусмотренных настоящим договором, в соответствии с установленным порядком,
                действующим на дату подписания договора, а также согласно установленным Правилам приемки в
                эксплуатацию законченных строительством объектов в присутствии представителей соответствующих
                надзорных лиц со стороны Заказчика.
              </p>
              <p className="text-sm text-justify indent-6 mt-2">
                4.2. При выявлении со стороны Заказчика несоответствия осуществлённых работ согласно утвержденному
                рабочему проекту и дизайнерским чертежам, Подрядчик обязуется в течение 30 календарных дней
                устранить такое несоответствие за свой счет.
              </p>
            </div>

            {/* Section 5 */}
            <div className="mb-5">
              <div className="font-bold text-center mb-2 tracking-wide">
                5. ОБЯЗАТЕЛЬСТВА СТОРОН
              </div>
              <p className="text-sm text-justify indent-6">
                5.1. По настоящему договору Подрядчик для выполнения работ, предусмотренных в разделе 2 настоящего
                договора, обязуется:
              </p>
              <p className="text-sm text-justify indent-8 mt-1">
                - выполнить своими и привлеченными силами все работы в объемах и в сроки, предусмотренные в настоящем
                договоре с использованием своих строительных материалов (сырья), которые будут включены в расходную часть
                по выполнению своих обязательств или же с использованием строительных материалов (сырья), переданных
                со стороны Заказчика в качестве давальческого сырья;
              </p>
              <p className="text-sm text-justify indent-8 mt-1">
                - поставить строительную технику, стройматериалы (в случае отсутствия давальческого сырья), осуществить
                приемку строительных материалов (при предоставлении давальческого сырья), разгрузку, складирование;
              </p>
              <p className="text-sm text-justify indent-8 mt-1">
                - при использовании сырья и материалов, закупаемых за свой счёт и передаваемых Заказчику с правом
                перехода в собственность, нести полную материальную и финансовую ответственность по таким товарам, если
                они требуют отдельных сертификатов, предоставлять их вместе с актами выполненных работ и гарантирует
                что при осуществлении работ, используются высококачественное сырьё и материалы.
              </p>
              <p className="text-sm text-justify indent-6 mt-2">
                5.2. Подрядчик производит своевременное устранение дефектов и замечаний по выполненным работам и услугам
                в процессе строительства или периода гарантийной эксплуатации в соответствии с рекламационными актами или
                письменными предписаниями Заказчика.
              </p>
              <p className="text-sm text-justify indent-6 mt-2">
                5.3. Подрядчик несет полную имущественную ответственность перед Заказчиком за ненадлежащее исполнение
                всех работ в соответствии с рабочим проектом, действующих норм и актов в области строительства, по
                настоящему договору.
              </p>
              <p className="text-sm font-bold indent-6 mt-2">5.4. Заказчик обязуется:</p>
              <p className="text-sm indent-8 mt-0.5">5.4.1. Представить Подрядчику всю необходимую документацию для выполнения Работ.</p>
              <p className="text-sm indent-8 mt-0.5">5.4.2. Обеспечить персоналу Подрядчика доступ к объектам Заказчика.</p>
              <p className="text-sm indent-8 mt-0.5">5.4.3. Принять и оплатить, выполненные по настоящему Договору Работы.</p>
              <p className="text-sm indent-8 mt-0.5 text-justify">
                5.4.4. Заказчик предоставляет Подрядчику на период выполнения Работ и до его завершения строительную
                площадку пригодную для выполнения Работ, территорию под склад для хранения материалов и инструментов,
                а также место, отведенное для складирования строительного мусора.
              </p>
              <p className="text-sm indent-8 mt-0.5 text-justify">
                5.4.5. В случае просрочки оплаты Заказчиком, Подрядчик имеет право взыскать с Заказчика пеню в размере
                0,4% от просроченной суммы за каждый день просрочки оплаты, но не более 50% от несвоевременно оплаченной суммы.
              </p>
              <p className="text-sm font-bold indent-6 mt-2">5.5. Подрядчик имеет право:</p>
              <p className="text-sm indent-8 mt-0.5">5.5.1. Сдать результат Работ в соответствии с Договором досрочно.</p>
              <p className="text-sm indent-8 mt-0.5">5.5.2. Привлекать к выполнению Работ по соответствующему Договору субподрядчиков, с согласия Заказчика.</p>
              <p className="text-sm font-bold indent-6 mt-2">5.6. Заказчик имеет право:</p>
              <p className="text-sm indent-8 mt-0.5">5.6.1. В любое время проверить ход и качество выполняемых Подрядчиком Работ.</p>
              <p className="text-sm indent-8 mt-0.5 text-justify">
                5.6.2. Заказчик обеспечивает надлежащую охрану объекта, материалов, оборудования и строительной техники
                от начала работ до завершения строительства.
              </p>
              <p className="text-sm indent-8 mt-0.5 text-justify">
                5.6.3. В случае нарушения сроков исполнения обязательств Подрядчиком, Заказчик имеет право взыскать с
                Подрядчика пеню в размере 0,4% от суммы неисполненных в срок обязательств за каждый день просрочки,
                но не более 50% от стоимости не исполненных в срок обязательств.
              </p>
            </div>

            {/* Section 6 */}
            <div className="mb-5">
              <div className="font-bold text-center mb-2 tracking-wide">
                6. ПРОИЗВОДСТВО РАБОТ
              </div>
              <p className="text-sm text-justify indent-6">
                6.1. Стороны перед началом работ согласовывают чертежи перегородок, визуализации интерьера, точки
                электрических и сантехнических соединений. После согласования, Подрядчик приступает к разработке
                проектировки инженерных сетей, параллельно с инженерными сетями создается рабочий проект и дизайн помещений.
              </p>
              <p className="text-sm text-justify indent-6 mt-2">
                6.2. Со дня завершения всех проектных документаций Подрядчик уведомляет Заказчика. Заказчик в свою
                очередь дает согласие на начало работ по данному проекту.
              </p>
              <p className="text-sm text-justify indent-6 mt-2">
                6.3. Подрядчик со дня начала работ назначает на строительной площадке своего представителя – работника
                по техническому надзору, который от его имени осуществляет технический надзор за качеством выполняемых
                работ, а также производит проверку соответствия качества используемых материалов и оборудования.
              </p>
              <p className="text-sm text-justify indent-6 mt-2">
                6.4. Подрядчик берет на себя ответственность за контролирование услуг складирования и снабжение
                строительных материалов в поставленные сроки.
              </p>
              <p className="text-sm text-justify indent-6 mt-2">
                6.5. Подрядчик после завершения всех работ согласно настоящего Договора подряда и Приложений к нему,
                передаёт обратно не использованные строительные материалы (сырьё) и возвращает строительное
                оборудование Заказчику.
              </p>
            </div>

            {/* Section 7 */}
            <div className="mb-5">
              <div className="font-bold text-center mb-2 tracking-wide">
                7. РАЗРЕШЕНИЕ СПОРОВ
              </div>
              <p className="text-sm text-justify indent-6">
                7.1. Споры решаются путем переговоров, в случае невозможности – в судебном порядке. В случае
                невозможности разрешить споры путем переговоров в течение 60 (шестьдесят) календарных дней споры
                подлежат рассмотрению в ташкентском межрайонном экономическом суде РУз, с обязательным соблюдением
                досудебного претензионного порядка.
              </p>
            </div>

            {/* Section 8 */}
            <div className="mb-5">
              <div className="font-bold text-center mb-2 tracking-wide">
                8. ОБСТОЯТЕЛЬСТВА НЕПРЕОДОЛИМОЙ СИЛЫ (форс-мажор)
              </div>
              <p className="text-sm text-justify indent-6">
                8.1. Стороны освобождаются от ответственности за частичное или полное неисполнение обязательств по
                настоящему договору, если оно явилось следствием природных явлений и прочих обстоятельств
                непреодолимой силы и если эти обстоятельства непосредственно повлияли на исполнение настоящего договора.
                Срок исполнения обязательств по настоящему договору отодвигается соразмерно периоду, в течение которого
                действовали обстоятельства непреодолимой силы, а также последствия вызванные этими обстоятельствами.
              </p>
              <p className="text-sm text-justify indent-6 mt-2">
                8.2. Если обстоятельства непреодолимой силы или их последствия продолжаются более одного месяца,
                стороны обсудят, какие меры следует предпринять для продолжения работ или их консервации.
              </p>
            </div>

            {/* Section 9 */}
            <div className="mb-5">
              <div className="font-bold text-center mb-2 tracking-wide">
                9. РАСТОРЖЕНИЕ ДОГОВОРА
              </div>
              <p className="text-sm text-justify indent-6">
                9.1. Заказчик вправе требовать расторжения договора в следующих случаях:
              </p>
              <p className="text-sm indent-8">- задержка Подрядчиком после вступления договора в силу начала строительства более чем на десять дней по причинам, не зависящим от Заказчика;</p>
              <p className="text-sm indent-8">- нарушение Подрядчиком условий договора, ведущее к снижению качества работ, предусмотренного нормами и правилами;</p>
              <p className="text-sm indent-8">- по другим основаниям в соответствии с законодательством.</p>
              <p className="text-sm text-justify indent-6 mt-2">
                9.2. Подрядчик вправе требовать расторжения договора в следующих случаях:
              </p>
              <p className="text-sm indent-8">- приостановка Заказчиком выполнения работ по причинам, не зависящим от Подрядчика, на срок, превышающий один месяц;</p>
              <p className="text-sm text-justify indent-6 mt-2">
                9.3. При расторжении договора по решению Заказчика незавершенное строительство в месячный срок
                передается Заказчику, без оплаты выполненных работ.
              </p>
              <p className="text-sm text-justify indent-6 mt-2">
                9.4. Сторона, инициирующая расторжение настоящего договора, согласно положениям настоящего раздела,
                направляет письменное уведомление другой стороне.
              </p>
            </div>

            {/* Section 10 - SIGNATURES & REQUISITES */}
            {/* EXACT MATCH: CHAPDA = ZAKAZCHIK, O'NGDA = PODRYADCHIK */}
            <div className="mt-8 pt-6 border-t border-gray-400">
              <div className="font-bold text-center mb-6 tracking-wide text-sm uppercase">
                10. БАНКОВСКИЕ РЕКВИЗИТЫ, ЮРИДИЧЕСКИЕ АДРЕСА И ПОДПИСИ СТОРОН
              </div>
              <div className="grid grid-cols-2 gap-8 text-xs">
                {/* CHAP TARAF: ZAKAZCHIK (KLIENT) */}
                <div className="space-y-1">
                  <div className="font-bold text-sm mb-2 text-gray-950 uppercase tracking-wide">
                    Заказчик:
                  </div>
                  {clientType === 1 ? (
                    /* Jismoniy shaxs rekvizitlari */
                    <>
                      <div className="font-semibold text-sm text-gray-900">
                        {customerFullName || '________________________'}
                      </div>
                      <div className="mt-1.5">
                        <span className="font-semibold">Паспорт:</span>{' '}
                        {customerPassport || '________________________'}
                      </div>
                      <div className="mt-1">
                        <span className="font-semibold">Адрес:</span>{' '}
                        {customerAddress || '________________________'}
                      </div>
                      <div className="mt-1">
                        <span className="font-semibold">Тел:</span>{' '}
                        {customerPhone || '________________________'}
                      </div>
                      <div className="pt-10">
                        <div className="flex items-end gap-2">
                          <span>Заказчик</span>
                          <span className="border-b border-gray-800 flex-1 min-w-[120px] text-center pb-0.5">
                            {customerFullName || ''}
                          </span>
                        </div>
                        <div className="text-[10px] text-gray-400 mt-1 italic pl-16">(подпись)</div>
                      </div>
                    </>
                  ) : (
                    /* Yuridik shaxs rekvizitlari */
                    <>
                      <div className="font-bold text-sm text-gray-950">
                        {companyName || '________________________'}
                      </div>
                      <div className="mt-1.5 leading-tight">
                        <span className="font-semibold">Адрес:</span>{' '}
                        {legalAddress || 'г. Ташкент'}
                      </div>
                      <div className="mt-1">
                        <span className="font-semibold">ИНН:</span>{' '}
                        <span className="font-mono">{inn || '000000000'}</span>
                      </div>
                      <div className="mt-1 leading-tight">
                        <span className="font-semibold">Банк:</span>{' '}
                        {bankName || '________________________'}
                      </div>
                      <div className="mt-1">
                        <span className="font-semibold">Р/С:</span>{' '}
                        <span className="font-mono">{bankAccount || '00000000000000000000'}</span>
                      </div>
                      <div className="mt-1">
                        <span className="font-semibold">МФО:</span>{' '}
                        <span className="font-mono">{mfo || '00000'}</span>
                      </div>

                      {secondBankName && (
                        <div className="mt-1 pt-1 border-t border-gray-200">
                          <span className="font-semibold">Банк (втор):</span> {secondBankName}
                        </div>
                      )}
                      {secondBankAccount && (
                        <div>
                          <span className="font-semibold">Втор/счет:</span>{' '}
                          <span className="font-mono">{secondBankAccount}</span>
                        </div>
                      )}
                      {secondMfo && (
                        <div>
                          <span className="font-semibold">МФО:</span>{' '}
                          <span className="font-mono">{secondMfo}</span>
                        </div>
                      )}
                      {(oked || okpo) && (
                        <div className="mt-1">
                          {oked && <span><span className="font-semibold">ОКЭД:</span> {oked} </span>}
                          {okpo && <span><span className="font-semibold">ОКПО:</span> {okpo}</span>}
                        </div>
                      )}
                      {ndsRegNumber && (
                        <div className="mt-1">
                          <span className="font-semibold">Рег.номер НДС:</span>{' '}
                          <span className="font-mono">{ndsRegNumber}</span>
                        </div>
                      )}
                      <div className="mt-1">
                        <span className="font-semibold">Тел:</span>{' '}
                        {customerPhone || '________________________'}
                      </div>

                      <div className="pt-8">
                        <div className="flex items-end gap-2">
                          <span>{directorTitle}</span>
                          <span className="border-b border-gray-800 flex-1 min-w-[120px] text-center pb-0.5">
                            {directorName || ''}
                          </span>
                        </div>
                        <div className="text-[10px] text-gray-400 mt-1 italic pl-24">(подпись / печать)</div>
                      </div>
                    </>
                  )}
                </div>

                {/* O'NG TARAF: PODRYADCHIK (SIZNING FIRMANGIZ) */}
                <div className="space-y-1 border-l border-gray-200 pl-6">
                  <div className="font-bold text-sm mb-2 text-gray-950 uppercase tracking-wide">
                    Подрядчик:
                  </div>
                  <div className="font-bold text-sm text-gray-950">
                    {contractorCompanyName}
                  </div>
                  <div className="mt-1.5 leading-tight">
                    <span className="font-semibold">Юридический адрес:</span>{' '}
                    {contractorAddress}
                  </div>
                  <div className="mt-1">
                    <span className="font-semibold">Р/С:</span>{' '}
                    <span className="font-mono">{contractorBankAccount}</span>
                  </div>
                  <div className="mt-1 leading-tight">
                    <span className="font-semibold">Банк:</span>{' '}
                    {contractorBankName}
                  </div>
                  <div className="mt-1">
                    <span className="font-semibold">МФО:</span>{' '}
                    <span className="font-mono">{contractorMfo}</span>
                  </div>
                  <div className="mt-1">
                    <span className="font-semibold">ИНН:</span>{' '}
                    <span className="font-mono">{contractorInn}</span>
                  </div>
                  <div className="mt-1">
                    <span className="font-semibold">Тел:</span>{' '}
                    {contractorPhone}
                  </div>

                  <div className="pt-8">
                    <div className="flex items-end gap-2">
                      <span>Ген. директор</span>
                      <span className="border-b border-gray-800 flex-1 min-w-[120px] text-center pb-0.5">
                        {contractorDirectorName}
                      </span>
                    </div>
                    <div className="text-[10px] text-gray-400 mt-1 italic pl-24">(подпись / печать)</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
