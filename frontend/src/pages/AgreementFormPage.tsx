import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Download, Save } from 'lucide-react';
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

  // Form state
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
  const [objectAddress, setObjectAddress] = useState('');
  const [block, setBlock] = useState('');
  const [apartmentNumber, setApartmentNumber] = useState('');
  const [areaM2, setAreaM2] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [prepayPct, setPrepayPct] = useState(30);
  const [intermediatePct, setIntermediatePct] = useState(50);
  const [finalPct, setFinalPct] = useState(20);

  const companyName = user?.companyName || 'WorkDex Qurilish';
  const directorName = user?.fullName || '';

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
      setContractNumber(a.contractNumber);
      setDay(a.day);
      setMonth(a.month);
      setYear(a.year);
      setProjectName(a.projectName);
      setCustomerId(a.customerId || '');
      setCustomerFullName(a.customerFullName || '');
      setCustomerPassport(a.customerPassportSeries || '');
      setCustomerAddress(a.customerAddress || '');
      setCustomerPhone(a.customerPhone || '');
      setObjectAddress(a.objectAddress || '');
      setBlock(a.block || '');
      setApartmentNumber(a.apartmentNumber || '');
      setAreaM2(a.areaM2?.toString() || '');
      setTotalAmount(a.totalAmountUZS?.toString() || '');
      setPrepayPct(a.prepaymentPercent || 30);
      setIntermediatePct(a.intermediatePercent || 50);
      setFinalPct(a.finalPercent || 20);
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
      const c = customers.find(c => c.id === cId);
      if (c) {
        setCustomerFullName(c.fullName);
        setCustomerPassport((c as any).passportSeries || '');
        setCustomerAddress(c.address || '');
        setCustomerPhone(c.phoneNumber);
      }
    } else {
      setCustomerFullName('');
      setCustomerPassport('');
      setCustomerAddress('');
      setCustomerPhone('');
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
        customerId: customerId || null,
        customerFullName: customerFullName || null,
        customerPassportSeries: customerPassport || null,
        customerAddress: customerAddress || null,
        customerPhone: customerPhone || null,
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
      alert(err?.response?.data?.message || 'Saqlashda xatolik');
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
        <div className="w-[440px] flex-shrink-0 bg-white border-r border-gray-200 overflow-y-auto no-print">
          <div className="p-5">
            {/* Header */}
            <div className="flex items-center gap-3 mb-5">
              <button
                onClick={() => navigate('/agreements')}
                className="p-1 rounded hover:bg-gray-100"
              >
                <ArrowLeft className="w-4 h-4 text-gray-500" />
              </button>
              <h2 className="font-bold text-[#171b25] text-sm">
                {isEdit ? 'Shartnomani tahrirlash' : 'Yangi shartnoma'}
              </h2>
            </div>

            {/* Section: Shartnoma shakli */}
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1 h-4 bg-[#7c3aed] rounded-full" />
                <span className="text-xs font-bold text-[#171b25] uppercase tracking-wide">
                  Shartnoma shakli
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                <div>
                  <label className="text-[10px] text-gray-500 block mb-1">№</label>
                  <input
                    type="number"
                    value={contractNumber}
                    onChange={e => setContractNumber(parseInt(e.target.value) || 1)}
                    className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs text-center focus:outline-none focus:border-[#7c3aed]"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 block mb-1">Kun</label>
                  <input
                    type="number"
                    min={1}
                    max={31}
                    value={day}
                    onChange={e => setDay(parseInt(e.target.value) || 1)}
                    className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs text-center focus:outline-none focus:border-[#7c3aed]"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 block mb-1">Oy</label>
                  <select
                    value={month}
                    onChange={e => setMonth(parseInt(e.target.value))}
                    className="w-full border border-gray-200 rounded-lg px-1 py-1.5 text-xs focus:outline-none focus:border-[#7c3aed]"
                  >
                    {[...Array(12)].map((_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {i + 1}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 block mb-1">Yil</label>
                  <input
                    type="number"
                    value={year}
                    onChange={e => setYear(parseInt(e.target.value) || 2026)}
                    className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs text-center focus:outline-none focus:border-[#7c3aed]"
                  />
                </div>
              </div>
              <div className="mt-2">
                <label className="text-[10px] text-gray-500 block mb-1">
                  Loyiha nomi (Shartnoma uchun)
                </label>
                <input
                  type="text"
                  value={projectName}
                  onChange={e => setProjectName(e.target.value)}
                  placeholder="Kvartira v zhilom komplekse..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-[#7c3aed]"
                />
              </div>
            </div>

            {/* Section: Mijoz */}
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1 h-4 bg-[#ff7a16] rounded-full" />
                <span className="text-xs font-bold text-[#171b25] uppercase tracking-wide">
                  Mijoz
                </span>
              </div>
              <div className="mb-2">
                <label className="text-[10px] text-gray-500 block mb-1">
                  Mavjud mijozdan tanlash
                </label>
                <select
                  value={customerId}
                  onChange={e => handleCustomerSelect(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-[#7c3aed]"
                >
                  <option value="">— Yangi mijoz —</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.fullName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-2">
                <label className="text-[10px] text-gray-500 block mb-1">
                  To'liq ism (F.I.O.)
                </label>
                <input
                  type="text"
                  value={customerFullName}
                  onChange={e => setCustomerFullName(e.target.value)}
                  placeholder="Ikramov Ulug'bek Yusupovich"
                  className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-[#7c3aed]"
                />
              </div>
              <div className="mb-2">
                <label className="text-[10px] text-gray-500 block mb-1">
                  Pasport seriyasi va raqami
                </label>
                <input
                  type="text"
                  value={customerPassport}
                  onChange={e => setCustomerPassport(e.target.value)}
                  placeholder="AA 1234567"
                  className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-[#7c3aed] font-mono"
                />
              </div>
              <div className="mb-2">
                <label className="text-[10px] text-gray-500 block mb-1">Yashash manzili</label>
                <input
                  type="text"
                  value={customerAddress}
                  onChange={e => setCustomerAddress(e.target.value)}
                  placeholder="g. Toshkent, Yunusobod tumani..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-[#7c3aed]"
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-500 block mb-1">Telefon</label>
                <input
                  type="text"
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)}
                  placeholder="+998 90 000 00 00"
                  className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-[#7c3aed]"
                />
              </div>
            </div>

            {/* Section: Obyekt */}
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1 h-4 bg-blue-500 rounded-full" />
                <span className="text-xs font-bold text-[#171b25] uppercase tracking-wide">
                  Obyekt
                </span>
              </div>
              <div className="mb-2">
                <label className="text-[10px] text-gray-500 block mb-1">Loyiha nomi</label>
                <input
                  type="text"
                  value={projectName}
                  readOnly
                  className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs bg-gray-50 focus:outline-none"
                />
              </div>
              <div className="mb-2">
                <label className="text-[10px] text-gray-500 block mb-1">Obyekt manzili</label>
                <input
                  type="text"
                  value={objectAddress}
                  onChange={e => setObjectAddress(e.target.value)}
                  placeholder="g. Toshkent, Yakkasaroy tumani, Abdulla Qahhora, 133"
                  className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-[#7c3aed]"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] text-gray-500 block mb-1">Blok</label>
                  <input
                    type="text"
                    value={block}
                    onChange={e => setBlock(e.target.value)}
                    placeholder="E"
                    className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs text-center focus:outline-none focus:border-[#7c3aed]"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 block mb-1">Kvartira №</label>
                  <input
                    type="text"
                    value={apartmentNumber}
                    onChange={e => setApartmentNumber(e.target.value)}
                    placeholder="215"
                    className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs text-center focus:outline-none focus:border-[#7c3aed]"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 block mb-1">Maydon (m²)</label>
                  <input
                    type="number"
                    value={areaM2}
                    onChange={e => setAreaM2(e.target.value)}
                    placeholder="85"
                    className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs text-center focus:outline-none focus:border-[#7c3aed]"
                  />
                </div>
              </div>
            </div>

            {/* Section: Moliya */}
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1 h-4 bg-green-500 rounded-full" />
                <span className="text-xs font-bold text-[#171b25] uppercase tracking-wide">
                  Moliya
                </span>
              </div>
              <div className="mb-2">
                <label className="text-[10px] text-gray-500 block mb-1">
                  Umumiy summa (raqamda, UZS)
                </label>
                <input
                  type="number"
                  value={totalAmount}
                  onChange={e => setTotalAmount(e.target.value)}
                  placeholder="150000000"
                  className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-[#7c3aed]"
                />
              </div>
              {amountInWords && (
                <div className="mb-2 px-3 py-1.5 bg-gray-50 rounded-lg">
                  <div className="text-[10px] text-gray-400 mb-0.5">So'zda</div>
                  <div className="text-xs text-gray-700 capitalize">{amountInWords}</div>
                </div>
              )}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] text-gray-500 block mb-1">Oldindan %</label>
                  <input
                    type="number"
                    value={prepayPct}
                    onChange={e => setPrepayPct(parseInt(e.target.value) || 0)}
                    className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs text-center focus:outline-none focus:border-[#7c3aed]"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 block mb-1">O'rta bosqich %</label>
                  <input
                    type="number"
                    value={intermediatePct}
                    onChange={e => setIntermediatePct(parseInt(e.target.value) || 0)}
                    className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs text-center focus:outline-none focus:border-[#7c3aed]"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 block mb-1">Yakuniy %</label>
                  <input
                    type="number"
                    value={finalPct}
                    onChange={e => setFinalPct(parseInt(e.target.value) || 0)}
                    className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs text-center focus:outline-none focus:border-[#7c3aed]"
                  />
                </div>
              </div>

              {/* Payment breakdown */}
              {totalNum > 0 && (
                <div className="mt-2 grid grid-cols-3 gap-2">
                  <div className="bg-purple-50 rounded-lg p-2 text-center">
                    <div className="text-[9px] text-purple-600">Oldindan</div>
                    <div className="text-xs font-bold text-purple-700">{fmt(prepayAmount)} UZS</div>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-2 text-center">
                    <div className="text-[9px] text-blue-600">O'rta</div>
                    <div className="text-xs font-bold text-blue-700">
                      {fmt(intermediateAmount)} UZS
                    </div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-2 text-center">
                    <div className="text-[9px] text-green-600">Yakuniy</div>
                    <div className="text-xs font-bold text-green-700">{fmt(finalAmount)} UZS</div>
                  </div>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-4">
              <p className="text-[10px] text-blue-600">
                💡 Maydonlar shartnomada real vaqtda yangilanadi. Chop etish uchun "PDF yuklash"
                tugmasini bosing.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => navigate('/agreements')}
                className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-lg text-xs font-semibold hover:bg-gray-50"
              >
                Bekor qilish
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 bg-[#7c3aed] text-white py-2 rounded-lg text-xs font-semibold hover:bg-[#6d28d9] disabled:opacity-50"
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

          {/* Contract Document */}
          <div
            ref={printRef}
            className="contract-preview max-w-[800px] mx-auto my-6 bg-white shadow-lg rounded-lg p-12 text-sm leading-relaxed"
            style={{ fontFamily: 'Times New Roman, Times, serif' }}
          >
            {/* Company Header */}
            <div className="text-center mb-8">
              <div className="text-2xl font-bold tracking-[0.3em] text-gray-900 mb-1">
                {companyName.toUpperCase()}
              </div>
              <div className="text-xs text-gray-500 tracking-widest">QURILISH</div>
            </div>

            {/* Title */}
            <div className="text-center mb-6">
              <div className="text-base font-bold">ДОГОВОР ПОДРЯДА №{contractNumber}</div>
              <div className="text-sm mt-1">
                г. Ташкент &nbsp;&nbsp;&nbsp; «{day}» {MONTHS_RU[month]} {year} г.
              </div>
            </div>

            {/* Parties */}
            <div className="mb-5 text-sm text-justify">
              <p>
                {companyName}, в лице директора {directorName || '____________'}, действующего на
                основании Устава с одной стороны, и
              </p>
              <p className="mt-2">
                гр. <strong>{customerFullName || '____________'}</strong>, паспорт{' '}
                <strong>{customerPassport || '____________'}</strong>, в дальнейшем именуемый(ая)
                «Заказчик», с другой стороны, вместе именуемые «Стороны», а по отдельности
                «Сторона», заключили настоящий договор о нижеследующем:
              </p>
            </div>

            {/* Section 1 */}
            <div className="mb-4">
              <div className="font-bold text-center mb-2">1. ПРЕДМЕТ ДОГОВОРА</div>
              <p className="text-sm text-justify">
                1.1. Подрядчик обязуется выполнить комплекс ремонтно-строительных работ в
                соответствии с проектом: <strong>{projectName || '____________'}</strong> по адресу{' '}
                {objectAddress || '____________'}, блок{' '}
                <strong>{block || '____'}</strong> квартиры №{' '}
                <strong>{apartmentNumber || '____'}</strong> общей площадью{' '}
                <strong>{areaM2 || '____'}</strong> м².
              </p>
              <p className="text-sm text-justify mt-2">
                1.2. Подрядчик обязуется в соответствии с условиями настоящего договора выполнить
                работы, предусмотренные проектной документацией (сметой, локально-ресурсной
                ведомости), а Заказчик обязуется создать Подрядчику необходимые условия для
                выполнения строительных работ, принять их и произвести оплату.
              </p>
            </div>

            {/* Section 2 */}
            <div className="mb-4">
              <div className="font-bold text-center mb-2">
                2. СТОИМОСТЬ РАБОТ И ПОРЯДОК ОПЛАТЫ
              </div>
              <p className="text-sm text-justify">
                2.1. По данному договору общая стоимость услуг с учетом НДС составляет:{' '}
                {totalNum > 0 ? (
                  <strong>
                    {fmt(totalNum)} ({amountInWords})
                  </strong>
                ) : (
                  <span className="border-b border-gray-800">
                    ______________ (____________________)
                  </span>
                )}{' '}
                сум.
              </p>
              <p className="text-sm text-justify mt-1">
                2.2. Окончательная стоимость договора будет определена по факту его выполнения, на
                основании подписанного Сторонами Акта приема-передачи выполненных Работ и
                накладных, счет-фактур приобретенных товаров.
              </p>
              <p className="text-sm text-justify mt-1">
                2.3. Стоимость работ, выполняемых Подрядчиком по взаимному соглашению сторон,
                является договорной, согласно проектной документации (смете, локально-ресурсной
                ведомости, спецификации), являющихся неотъемлемой частью настоящего договора,
                оформляемый в качестве приложения к настоящему Договору.
              </p>
              <p className="text-sm text-justify mt-2 font-semibold">2.4. Порядок платежей:</p>
              {totalNum > 0 ? (
                <>
                  <p className="text-sm mt-1">
                    2.4.1. <strong>{prepayPct}%</strong> от стоимости Договора —{' '}
                    <strong>{fmt(prepayAmount)} сум</strong> — выплачивается в качестве предоплаты
                    при подписании настоящего Договора.
                  </p>
                  <p className="text-sm mt-1">
                    2.4.2. <strong>{intermediatePct}%</strong> от стоимости Договора —{' '}
                    <strong>{fmt(intermediateAmount)} сум</strong> — выплачивается после завершения
                    промежуточного этапа работ.
                  </p>
                  <p className="text-sm mt-1">
                    2.4.3. Оставшиеся <strong>{finalPct}%</strong> от стоимости Договора —{' '}
                    <strong>{fmt(finalAmount)} сум</strong> — выплачиваются после полного завершения
                    работ.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm mt-1">
                    2.4.1. {prepayPct}% от стоимости Договора выплачивается в качестве предоплаты
                    при подписании настоящего Договора.
                  </p>
                  <p className="text-sm mt-1">
                    2.4.2. {intermediatePct}% от стоимости Договора выплачивается после завершения
                    промежуточного этапа работ.
                  </p>
                  <p className="text-sm mt-1">
                    2.4.3. Оставшиеся {finalPct}% от стоимости Договора выплачиваются после полного
                    завершения работ.
                  </p>
                </>
              )}
            </div>

            {/* Section 3 */}
            <div className="mb-4">
              <div className="font-bold text-center mb-2">3. СРОКИ ВЫПОЛНЕНИЯ РАБОТ</div>
              <p className="text-sm">
                3.1. Договор вступает в силу с момента его подписания сторонами.
              </p>
              <p className="text-sm mt-1">
                3.2. Начало работ – в течение 1 рабочего дня после выполнения Заказчиком условий
                согласно п.п. 2.4.1
              </p>
              <p className="text-sm mt-1">
                3.3. Окончание работ – согласно согласованного Сторонами графика производства
                работ.
              </p>
            </div>

            {/* Section 4 */}
            <div className="mb-4">
              <div className="font-bold text-center mb-2">
                4. ПОРЯДОК СДАЧИ-ПРИЕМКИ РАБОТ
              </div>
              <p className="text-sm text-justify">
                4.1. Приемка законченного строительством объекта осуществляется после выполнения
                сторонами всех обязательств, предусмотренных настоящим договором, в соответствии с
                установленным порядком, действующим на дату подписания договора.
              </p>
              <p className="text-sm text-justify mt-1">
                4.2. При выявлении со стороны Заказчика несоответствия осуществлённых работ
                согласно утверждённому рабочему проекту и дизайнерским чертежам, Подрядчик
                обязуется в течение 30 календарных дней устранить такое несоответствие за свой
                счет.
              </p>
            </div>

            {/* Section 5 */}
            <div className="mb-4">
              <div className="font-bold text-center mb-2">5. ОБЯЗАТЕЛЬСТВА СТОРОН</div>
              <p className="text-sm font-semibold">5.1. Подрядчик обязуется:</p>
              <p className="text-sm">
                - Выполнить работы, предусмотренные в разделе 2 настоящего Договора в
                установленные сроки.
              </p>
              <p className="text-sm">
                - Использовать при производстве работ только качественные материалы.
              </p>
              <p className="text-sm mt-2 font-semibold">5.2. Заказчик обязуется:</p>
              <p className="text-sm">
                - Своевременно производить оплату согласно разделу 2 настоящего Договора.
              </p>
              <p className="text-sm">- Обеспечить доступ к объекту в рабочее время.</p>
            </div>

            {/* Signatures */}
            <div className="mt-8 border-t pt-6">
              <div className="font-bold text-center mb-4">РЕКВИЗИТЫ И ПОДПИСИ СТОРОН</div>
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <div className="font-semibold text-sm mb-2">ПОДРЯДЧИК:</div>
                  <div className="text-sm">{companyName}</div>
                  <div className="text-sm mt-1">
                    Директор: {directorName || '____________'}
                  </div>
                  <div className="mt-8 border-b border-gray-400 w-48" />
                  <div className="text-xs text-gray-500 mt-1">подпись / печать</div>
                </div>
                <div>
                  <div className="font-semibold text-sm mb-2">ЗАКАЗЧИК:</div>
                  <div className="text-sm">{customerFullName || '____________'}</div>
                  <div className="text-sm mt-1">
                    Паспорт: {customerPassport || '____________'}
                  </div>
                  {customerAddress && <div className="text-sm mt-1">{customerAddress}</div>}
                  {customerPhone && <div className="text-sm">{customerPhone}</div>}
                  <div className="mt-8 border-b border-gray-400 w-48" />
                  <div className="text-xs text-gray-500 mt-1">подпись</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
