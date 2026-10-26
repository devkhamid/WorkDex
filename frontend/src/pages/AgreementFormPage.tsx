import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Download, Save, Building2, User as UserIcon, ChevronDown, ChevronUp } from 'lucide-react';
import { agreementsApi, customersApi } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { Customer } from '../types';
import { numberToWordsRu, MONTHS_RU } from '../utils/numberToWords';
import { AgreementDocument, AgreementDocData } from '../components/AgreementDocument';

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
  const [mobilePane, setMobilePane] = useState<'form' | 'preview'>('form');

  const [clientType, setClientType] = useState<1 | 2>(1);

  const [contractNumber, setContractNumber] = useState(1);
  const [day, setDay] = useState(new Date().getDate());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [projectName, setProjectName] = useState('');

  const [customerId, setCustomerId] = useState('');
  const [customerFullName, setCustomerFullName] = useState('');
  const [customerPassport, setCustomerPassport] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

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

  const [objectAddress, setObjectAddress] = useState('г. Ташкент, Яккасарайский район, улица, дом 133');
  const [block, setBlock] = useState('');
  const [apartmentNumber, setApartmentNumber] = useState('');
  const [areaM2, setAreaM2] = useState('');

  const [totalAmount, setTotalAmount] = useState('');
  const [prepayPct, setPrepayPct] = useState(40);
  const [intermediatePct, setIntermediatePct] = useState(40);
  const [finalPct, setFinalPct] = useState(20);

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

      setObjectAddress(a.objectAddress || 'г. Ташкент, Яккасарайский район, улица, дом 133');
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
      alert('Shartnomadagi ob\'ektni kiriting');
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

  const docData: AgreementDocData = {
    contractNumber, day, month, year, projectName, clientType,
    customerFullName, customerPassport, customerAddress, customerPhone,
    companyName, directorName, directorTitle, foundationDoc, legalAddress, inn, bankAccount, bankName, mfo,
    secondBankName, secondBankAccount, secondMfo, oked, okpo, ndsRegNumber,
    contractorCompanyName, contractorDirectorName, contractorAddress, contractorBankAccount, contractorBankName,
    contractorMfo, contractorInn,
    objectAddress, block, apartmentNumber, areaM2,
    totalAmount: totalNum, prepayPct, intermediatePct, finalPct,
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#7c3aed] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 18mm 20mm 18mm 20mm;
          }

          /* 1. Hide UI chrome */
          .no-print,
          aside,
          header,
          nav {
            display: none !important;
          }

          /* 2. Reset html, body, and all wrappers to natural block flow */
          html, body {
            width: 100% !important;
            height: auto !important;
            min-height: 0 !important;
            overflow: visible !important;
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
            color: black !important;
          }

          #root,
          #root > div,
          main,
          .agreement-form-wrapper,
          .contract-preview-scroll {
            display: block !important;
            position: static !important;
            width: 100% !important;
            max-width: 100% !important;
            height: auto !important;
            min-height: 0 !important;
            max-height: none !important;
            overflow: visible !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
            background: white !important;
            float: none !important;
          }

          /* 3. Contract Document — multi-page natural flow */
          .contract-preview {
            display: block !important;
            position: static !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            background: white !important;
            overflow: visible !important;
            color: #000 !important;
            font-size: 12pt !important;
            line-height: 1.5 !important;
          }

          /* Avoid breaking titles away from their section content */
          .contract-preview h1,
          .contract-preview h2,
          .contract-preview h3,
          .contract-preview .sec-title,
          .contract-preview .sub-title {
            break-after: avoid !important;
            page-break-after: avoid !important;
          }

          .contract-preview p {
            orphans: 3 !important;
            widows: 3 !important;
          }

          /* Section 10 (Bank requisites and signatures) must not be split in half */
          .signature-section {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
        }
      `}</style>

      <div className="agreement-form-wrapper flex flex-col lg:flex-row h-full bg-[#f8f9fb]">
        <div className="no-print lg:hidden sticky top-0 z-20 bg-white border-b border-gray-200 p-2 flex gap-2">
          <button
            type="button"
            onClick={() => setMobilePane('form')}
            className={`flex-1 rounded-lg py-2 text-xs font-semibold ${
              mobilePane === 'form' ? 'bg-[#7c3aed] text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            Forma
          </button>
          <button
            type="button"
            onClick={() => setMobilePane('preview')}
            className={`flex-1 rounded-lg py-2 text-xs font-semibold ${
              mobilePane === 'preview' ? 'bg-[#7c3aed] text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            Ko'rish
          </button>
        </div>

        <div className={`${mobilePane === 'form' ? 'block' : 'hidden'} lg:block w-full lg:w-[460px] lg:flex-shrink-0 bg-white border-b lg:border-b-0 lg:border-r border-gray-200 overflow-y-auto no-print`}>
          <div className="p-4 sm:p-5">
            <div className="flex items-center gap-3 mb-4">
              <button
                onClick={() => navigate('/agreements')}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 flex-shrink-0"
                title="Ortga"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className="min-w-0">
                <h2 className="font-bold text-[#171b25] text-sm">
                  {isEdit ? 'Shartnomani tahrirlash' : 'Yangi shartnoma'}
                </h2>
                <p className="text-[11px] text-gray-400">
                  {clientType === 1 ? 'Jismoniy shaxs bilan' : 'Yuridik shaxs bilan'}
                </p>
              </div>
            </div>

            <div className="mb-4 p-1 bg-gray-100 rounded-xl flex items-center gap-1 overflow-x-auto scrollbar-none">
              <button
                type="button"
                onClick={() => setClientType(1)}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all whitespace-nowrap flex-shrink-0 ${
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
                className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all whitespace-nowrap flex-shrink-0 ${
                  clientType === 2
                    ? 'bg-white text-[#7c3aed] shadow-xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                Yuridik shaxs
              </button>
            </div>

            <div className="mb-4 border border-gray-100 rounded-xl p-3 bg-gray-50/50">
              <div className="flex items-center gap-2 mb-2.5">
                <div className="w-1 h-3.5 bg-[#7c3aed] rounded-full" />
                <span className="text-xs font-bold text-[#171b25] uppercase tracking-wide">
                  Shartnoma shakli
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
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
                  Ob'ekt (Shartnoma uchun)
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

            <div className="mb-4 border border-gray-100 rounded-xl p-3 bg-gray-50/50">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="w-1 h-3.5 bg-[#ff7a16] rounded-full" />
                  <span className="text-xs font-bold text-[#171b25] uppercase tracking-wide">
                    {clientType === 1 ? 'Mijoz (Jismoniy shaxs)' : 'Buyurtmachi (Yuridik shaxs)'}
                  </span>
                </div>
                {customers.length > 0 && (
                  <select
                    value={customerId}
                    onChange={e => handleCustomerSelect(e.target.value)}
                    className="w-full sm:w-auto text-[10px] border border-gray-200 rounded px-2 py-1 bg-white text-gray-600 focus:outline-none"
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
                    placeholder="г. Ташкент, Яккасарайский район, улица, дом 133"
                    className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-[#7c3aed] bg-white"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-2">
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
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
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

            <div className="mb-4 border border-gray-100 rounded-xl p-3 bg-gray-50/50">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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

            <div className="flex flex-col sm:flex-row gap-2 sticky bottom-0 bg-white pt-3 pb-1 border-t border-gray-100">
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

        <div className={`contract-preview-scroll ${mobilePane === 'preview' ? 'block' : 'hidden'} lg:block flex-1 min-w-0 overflow-auto bg-gray-100`}>
          <div className="no-print bg-white border-b border-gray-200 px-4 sm:px-5 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sticky top-0 z-10">
            <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">
              Shartnoma ko'rinishi
            </span>
            <div className="flex flex-wrap items-center gap-2">
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

          <AgreementDocument
            ref={printRef}
            data={docData}
            className="w-[794px] mx-auto my-4 sm:my-6 shadow-xl"
          />
        </div>
      </div>
    </>
  );
};
