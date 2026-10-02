import { forwardRef } from 'react';
import { numberToWordsRu } from '../utils/numberToWords';

export interface AgreementDocData {
  contractNumber: number;
  day: number;
  month: number;
  year: number;
  projectName: string;
  clientType: 1 | 2;
  customerFullName: string;
  customerPassport: string;
  customerAddress: string;
  customerPhone: string;
  companyName: string;
  directorName: string;
  directorTitle: string;
  foundationDoc: string;
  legalAddress: string;
  inn: string;
  bankAccount: string;
  bankName: string;
  mfo: string;
  secondBankName: string;
  secondBankAccount: string;
  secondMfo: string;
  oked: string;
  okpo: string;
  ndsRegNumber: string;
  contractorCompanyName: string;
  contractorDirectorName: string;
  contractorAddress: string;
  contractorBankAccount: string;
  contractorBankName: string;
  contractorMfo: string;
  contractorInn: string;
  objectAddress: string;
  block: string;
  apartmentNumber: string;
  areaM2: string;
  totalAmount: number;
  prepayPct: number;
  intermediatePct: number;
  finalPct: number;
}

// API dagi shartnoma obyektini hujjat ma'lumotlariga aylantiradi (forma bilan bir xil standart qiymatlar)
export const agreementToDocData = (a: any): AgreementDocData => ({
  contractNumber: a.contractNumber || 1,
  day: a.day || new Date().getDate(),
  month: a.month || new Date().getMonth() + 1,
  year: a.year || new Date().getFullYear(),
  projectName: a.projectName || '',
  clientType: a.clientType === 2 ? 2 : 1,
  customerFullName: a.customerFullName || '',
  customerPassport: a.customerPassportSeries || '',
  customerAddress: a.customerAddress || '',
  customerPhone: a.customerPhone || '',
  companyName: a.companyName || '',
  directorName: a.directorName || '',
  directorTitle: a.directorTitle || 'Ген. директора',
  foundationDoc: a.foundationDoc || 'Устава',
  legalAddress: a.legalAddress || '',
  inn: a.inn || '',
  bankAccount: a.bankAccount || '',
  bankName: a.bankName || '',
  mfo: a.mfo || '',
  secondBankName: a.secondBankName || '',
  secondBankAccount: a.secondBankAccount || '',
  secondMfo: a.secondMfo || '',
  oked: a.oked || '',
  okpo: a.okpo || '',
  ndsRegNumber: a.ndsRegNumber || '',
  contractorCompanyName: a.contractorCompanyName || '',
  contractorDirectorName: a.contractorDirectorName || '',
  contractorAddress: a.contractorAddress || '',
  contractorBankAccount: a.contractorBankAccount || '',
  contractorBankName: a.contractorBankName || '',
  contractorMfo: a.contractorMfo || '',
  contractorInn: a.contractorInn || '',
  objectAddress: a.objectAddress || '',
  block: a.block || '',
  apartmentNumber: a.apartmentNumber || '',
  areaM2: a.areaM2 ? String(a.areaM2) : '',
  totalAmount: Number(a.totalAmountUZS) || 0,
  prepayPct: a.prepaymentPercent ?? 40,
  intermediatePct: a.intermediatePercent ?? 40,
  finalPct: a.finalPercent ?? 20,
});

export const AGREEMENT_DOC_STYLES = `
      .contract-preview {
        font-family: 'Inter', Arial, Helvetica, sans-serif;
        font-size: 12pt;
        line-height: 1.5;
        color: #000;
        padding: 20mm;
      }
      .contract-preview p {
        text-align: justify;
        text-indent: 2.5em;
        margin: 0 0 0.75em;
      }
      .contract-preview p.sub-title {
        font-weight: 700;
        text-indent: 0;
      }
      .contract-preview p.bullet {
        text-indent: 0;
        padding-left: 2.5em;
      }
      .contract-preview .doc-title {
        text-align: center;
        font-weight: 700;
        font-size: 16pt;
        margin-bottom: 1.5em;
      }
      .contract-preview .sec-title {
        text-align: center;
        font-weight: 700;
        text-decoration: underline;
        text-underline-offset: 3px;
        margin: 1.6em 0 0.9em;
      }
      .contract-preview .req-col {
        display: flex;
        flex-direction: column;
        gap: 0.8em;
        font-size: 11pt;
      }
      .contract-preview .req-sign {
        margin-top: auto;
        padding-top: 2.5em;
      }
      .contract-preview .sign-line {
        display: inline-block;
        width: 7em;
        border-bottom: 1px solid #000;
      }
      /* PDF eksport: sahifa chetlari html2pdf margin orqali beriladi */
      .contract-preview.pdf-export {
        padding: 0 20mm 8mm;
      }
`;

interface AgreementDocumentProps {
  data: AgreementDocData;
  className?: string;
}

export const AgreementDocument = forwardRef<HTMLDivElement, AgreementDocumentProps>(({ data, className = '' }, ref) => {
  const {
    contractNumber, day, month, year, projectName, clientType,
    customerFullName, customerPassport, customerAddress, customerPhone,
    companyName, directorName, directorTitle, foundationDoc, legalAddress, inn, bankAccount, bankName, mfo,
    secondBankName, secondBankAccount, secondMfo, oked, okpo, ndsRegNumber,
    contractorCompanyName, contractorDirectorName, contractorAddress, contractorBankAccount, contractorBankName,
    contractorMfo, contractorInn,
    objectAddress, block, apartmentNumber, areaM2,
    totalAmount: totalNum, prepayPct, intermediatePct, finalPct,
  } = data;

  const amountInWords = totalNum > 0 ? numberToWordsRu(totalNum) : '';
  const amountInWordsCap = amountInWords.charAt(0).toUpperCase() + amountInWords.slice(1);
  const pad = (n: number, len: number) => String(n).padStart(len, '0');
  const fmt = (n: number) => new Intl.NumberFormat('ru-RU').format(n);

  return (
    <div ref={ref} className={`contract-preview bg-white ${className}`}>
      <style>{AGREEMENT_DOC_STYLES}</style>
      <div className="flex justify-center mb-10">
        <img src="/unio-logo.png" alt="UNIO ARCHITECTS" className="h-24 w-auto object-contain" />
      </div>

      <div className="doc-title">ДОГОВОР ПОДРЯДА №{pad(contractNumber, 3)}</div>
      <div className="flex justify-between mb-6">
        <span>г. Ташкент</span>
        <span>
          «<strong>{pad(day, 2)}</strong>» <strong>{pad(month, 2)} {year}</strong> г.
        </span>
      </div>

      <p>
        {contractorCompanyName}, в дальнейшем именуемое «Подрядчик», в лице Ген. директора{' '}
        {contractorDirectorName || '____________'} действующего на основании Устава с одной стороны, и
      </p>
      {clientType === 1 ? (
        <p>
          гр. <strong>{customerFullName || '________________________'}</strong>, паспорт{' '}
          <strong>{customerPassport || '____________'}</strong>, в дальнейшем именуемый(ая) «Заказчик», с другой стороны,
          вместе именуемые «Стороны», а по отдельности «Сторона», заключили настоящий договор о нижеследующем:
        </p>
      ) : (
        <p>
          <strong>{companyName || '________________________'}</strong>, в дальнейшем именуемое «Заказчик», в лице{' '}
          {directorTitle} <strong>{directorName || '________________________'}</strong>, действующего на основании {foundationDoc},
          с другой стороны, вместе именуемые «Стороны», а по отдельности «Сторона», заключили настоящий договор о нижеследующем:
        </p>
      )}

      <div className="sec-title">1. ПРЕДМЕТ ДОГОВОРА</div>
      <p>
        1.1. Подрядчик обязуется выполнить комплекс ремонтно-строительных работ в соответствии с проектом:{' '}
        {projectName || '________________________'} по адресу {objectAddress || '________________________'}, блок{' '}
        <strong>{block || '____'}</strong>, квартиры № <strong>{apartmentNumber || '____'}</strong>, общей площадью{' '}
        <strong>{areaM2 || '____'}</strong> м².
      </p>
      <p>
        1.2 Подрядчик обязуется в соответствии с условиями настоящего договора выполнить работы, предусмотренные
        проектной документацией (сметой, локально-ресурсной ведомости), а Заказчик обязуется создать Подрядчику
        необходимые условия для выполнения строительных работ, принять их и произвести оплату.
      </p>

      <div className="sec-title">2. СТОИМОСТЬ РАБОТ И ПОРЯДОК ОПЛАТЫ</div>
      <p>
        2.1. По данному договору общая стоимость услуг с учетом НДС составляет:{' '}
        {totalNum > 0 ? (
          <>
            <strong>{fmt(totalNum)}</strong> (<strong>{amountInWordsCap}</strong>)
          </>
        ) : (
          <span className="inline-block min-w-[200px] border-b border-black">&nbsp;</span>
        )}{' '}
        сум.
      </p>
      <p>
        2.2. Окончательная стоимость договора будет определена по факту их выполнения, на основании подписанного
        Сторонами Акта приема-передачи выполненных Работ и накладных, счет-фактур приобретенных товаров.
      </p>
      <p>
        2.3. Стоимость работ, выполняемых Подрядчиком по взаимному соглашению сторон, является договорной, согласно
        проектной документации (смете, локально-ресурсной ведомости, спецификации), являющихся неотъемлемой частью
        настоящего договора, оформляемый в качестве приложений к настоящему Договору.
      </p>
      <p>
        2.4. Порядок приобретения дополнительных материалов и выполнения услуг, не входящих изначально согласованной
        сторонами сметной документации, выполняется исключительно по дополнительному соглашению сторон и производится
        отдельная оплата по данному документу.
      </p>
      <p className="sub-title">2.4. Порядок платежей:</p>
      <p>
        2.4.1. <strong>{prepayPct}%</strong> от стоимости Договора выплачивается в качестве предоплаты при подписании
        настоящего Договора.
      </p>
      <p>
        2.4.2. <strong>{intermediatePct}%</strong> от стоимости Договора выплачивается после завершения промежуточного
        этапа работ.
      </p>
      <p>
        2.4.3. Оставшиеся <strong>{finalPct}%</strong> от стоимости Договора выплачиваются после полного завершения работ.
      </p>

      <div className="sec-title">3. СРОКИ ВЫПОЛНЕНИЯ РАБОТ</div>
      <p>3.1 Договор вступает в силу с момента его подписания сторонами.</p>
      <p>
        3.2 Начало работ – в течение 1 рабочего дня после выполнения Заказчиком условий согласно п.п. 2.4.1
      </p>
      <p>3.3. Окончания работ – согласно согласованного Сторонами графика производства работ.</p>
      <p>
        3.4. При изменении первоначально указанных объемов работ или видов работ сроки выполнения работ могут измениться.
      </p>

      <div className="sec-title">4. ПОРЯДОК СДАЧИ-ПРИЕМКИ РАБОТ:</div>
      <p>
        4.1. Приемка законченного строительством объекта осуществляется после выполнения сторонами всех обязательств,
        предусмотренных настоящим договором, в соответствии с установленным порядком, действующем на дату подписания
        договора, а также согласно установленным Правилам приемки в эксплуатацию законченных строительством объектов в
        присутствии представителей соответствующих надзорных лиц со стороны Заказчика.
      </p>
      <p>
        4.2. При выявлении со стороны Заказчика несоответствия осуществлённых работ согласно утвержденному рабочему
        проекту и дизайнерским чертежам, Подрядчик обязуется в течение 30 календарных дней устранить такое
        несоответствие за свой счет.
      </p>

      <div className="sec-title">5. ОБЯЗАТЕЛЬСТВА СТОРОН</div>
      <p>
        5.1. По настоящему договору Подрядчик для выполнения работ, предусмотренных в разделе 2 настоящего договора,
        обязуется:
      </p>
      <p className="bullet">
        - выполнить своими и привлеченными силами все работы в объемах и в сроки, предусмотренные в настоящем договоре
        с использованием своих строительных материалов (сырья), которые будут включены в расходную часть по выполнению
        своих обязательств или же с использованием строительных материалов (сырья), переданных со стороны Заказчика в
        качестве давальческого сырья;
      </p>
      <p className="bullet">
        - поставить строительную технику, стройматериалы (в случае отсутствия давальческого сырья), осуществить приемку
        строительных материалов (при предоставлении давальческого сырья), разгрузку, складирование;
      </p>
      <p className="bullet">
        - при использовании сырья и материалов, закупаемых за свой счёт и передаваемых Заказчику с правом перехода в
        собственность, нести полную материальную и финансовую ответственность по таким товарам, если они требуют
        отдельных сертификатов, предоставлять их вместе актами выполненных работ и гарантирует что при осуществлении
        работ, используются высококачественное сырьё и материалы.
      </p>
      <p>
        5.2. Подрядчик производит своевременное устранение дефектов и замечаний по выполненным работам и услугам в
        процессе строительства или периода гарантийной эксплуатации в соответствии с рекламационными актами или
        письменными предписаниями Заказчика.
      </p>
      <p>
        5.3. Подрядчик несет полную имущественную ответственность перед Заказчиком за ненадлежащее исполнение всех
        работ в соответствии с рабочим проектом, действующих норм и актов в области строительства, по настоящему
        договору.
      </p>
      <p className="sub-title">5.4. Заказчик обязуется:</p>
      <p>5.4.1. Представить Подрядчику всю необходимую документацию для выполнения Работ.</p>
      <p>5.4.2. Обеспечить персоналу Подрядчика доступ к объектам Заказчика.</p>
      <p>5.4.3. Принять и оплатить, выполненные по настоящему Договору Работы.</p>
      <p>
        5.4.4. Заказчик предоставляет Подрядчику на период выполнения Работ и до его завершения строительную площадку
        пригодную для выполнения Работ, территорию под склад для хранения материалов и инструментов, а также место,
        отведенное для складирования строительного мусора.
      </p>
      <p>
        5.4.5 В случае просрочки оплаты Заказчиком, Подрядчик имеет право взыскать с Заказчика пеню в размере 0,4% от
        просроченной суммы за каждый день просрочки оплаты, но не более 50% от несвоевременно оплаченной суммы.
      </p>
      <p className="sub-title">5.5. Подрядчик имеет право:</p>
      <p>5.5.1. Сдать результат Работ в соответствии с Договором досрочно.</p>
      <p>5.5.2. Привлекать к выполнению Работ по соответствующему Договору субподрядчиков, с согласия Заказчика.</p>
      <p className="sub-title">5.6. Заказчик имеет право:</p>
      <p>5.6.1. В любое время проверить ход и качество выполняемых Подрядчиком Работ.</p>
      <p>
        5.6.2. Заказчик обеспечивает надлежащую охрану объекта, материалов, оборудования и строительной техники от
        начала работ до завершения строительства.
      </p>
      <p>
        5.6.3 В случае нарушения сроков исполнения обязательств Подрядчиком, Заказчик имеет право взыскать с
        Подрядчика пеню в размере 0,4% от суммы неисполненных в срок обязательств за каждый день просрочки, но не более
        50% от стоимости не исполненных в срок обязательств.
      </p>

      <div className="sec-title">6. ПРОИЗВОДСТВО РАБОТ</div>
      <p>
        6.1. Стороны перед началом работ согласовывают чертежи перегородок, визуализации интерьера, точки
        электрических и сантехнических соединений. После согласования, Подрядчик приступает к разработке проектировки
        инженерных сетей, параллельно с инженерными сетями создается рабочий проект и дизайн помещений.
      </p>
      <p>
        6.2. Со дня завершения всех проектных документаций Подрядчик уведомляет Заказчика. Заказчик в свою очередь
        дает согласие на начало работ по данному проекту.
      </p>
      <p>
        6.3. Подрядчик со дня начало работ назначает на строительной площадке своего представителя – работника по
        техническому надзору, который от его имени осуществляет технический надзор за качеством выполняемых работ, а
        также производит проверку соответствия качества используемых материалов и оборудования.
      </p>
      <p>
        6.4. Подрядчик берет на себя ответственность за контролирование услуг складирования и снабжение строительных
        материалов в поставленные сроки.
      </p>
      <p>
        6.5. Подрядчик после завершения всех работ согласно настоящего Договора подряда и Приложений к нему, передаёт
        обратно не использованные строительные материалы (сырьё) и возвращает строильное оборудование Заказчику.
      </p>

      <div className="sec-title">7. РАЗРЕШЕНИЕ СПОРОВ</div>
      <p>
        7.1 Споры решаются путем переговоров, в случае невозможности – в судебном порядке. В случае невозможности
        разрешить споры путем переговоров в течение 60 (шестьдесят) календарных дней споры подлежат рассмотрению в
        ташкентском межрайонном экономическом суде РУз, с обязательным соблюдением досудебного претензионного порядка.
      </p>

      <div className="sec-title">8. ОБСТОЯТЕЛЬСТВА НЕПРЕОДОЛИМОЙ СИЛЫ (форс-мажор)</div>
      <p>
        8.1. Стороны освобождаются от ответственности за частичное или полное неисполнение обязательств по настоящему
        договору, если оно явилось следствием природных явлений и прочих обстоятельств непреодолимой силы и если эти
        обстоятельства непосредственно повлияли на исполнение настоящего договора.
      </p>
      <p>
        Срок исполнения обязательств по настоящему договору отодвигается соразмерно периоду, в течение которого
        действовали обстоятельства непреодолимой силы, а также последствия вызванные этими обстоятельствами.
      </p>
      <p>
        8.2. Если обстоятельства непреодолимой силы или их последствия продолжаются более одного месяца, стороны
        обсудят, какие меры следует предпринять.
      </p>

      <div className="sec-title">9. РАСТОРЖЕНИЕ ДОГОВОРА</div>
      <p>9.1. Заказчик вправе требовать расторжения договора в следующих случаях:</p>
      <p className="bullet">
        - задержка Подрядчиком после вступления договора в силу начала строительства более чем на десять дней по
        причинам, не зависящим от Заказчика;
      </p>
      <p className="bullet">
        - нарушение Подрядчиком условий договора, ведущее к снижению качества работ, предусмотренного нормами и
        правилами;
      </p>
      <p className="bullet">- по другим основаниям в соответствии с законодательством.</p>
      <p>9.2. Подрядчик вправе требовать расторжения договора в следующих случаях:</p>
      <p className="bullet">
        - приостановка Заказчиком выполнения работ по причинам, не зависящим от Подрядчика, на срок, превышающий один
        месяц;
      </p>
      <p>
        9.3. При расторжении договора по решению Заказчика незавершенное строительство в месячный срок передается
        Заказчику, без оплаты выполненных работ.
      </p>
      <p>
        9.4. Сторона, инициирующая расторжение настоящего договора, согласно положениям настоящего раздела, направляет
        письменное уведомление другой стороне.
      </p>

      <div className="signature-section">
        <div className="sec-title">10. БАНКОВСКИЕ РЕКВИЗИТЫ, ЮРИДИЧЕСКИЕ АДРЕСА И ПОДПИСИ СТОРОН</div>
        <div className="grid grid-cols-2 mt-10">
          <div className="req-col pr-6">
            <div className="font-bold">Заказчик:</div>
            {clientType === 1 ? (
              <>
                <div className="font-bold">{customerFullName || '________________________'}</div>
                <div>Паспорт: <strong>{customerPassport || '____________'}</strong></div>
                <div>Адрес: <strong>{customerAddress || '____________'}</strong></div>
                <div>Тел: <strong>{customerPhone || '____________'}</strong></div>
              </>
            ) : (
              <>
                <div className="font-bold">{companyName || '________________________'}</div>
                <div>Адрес: {legalAddress || '____________'}</div>
                <div>Р/С: {bankAccount || '____________'}</div>
                <div>Банк: {bankName || '____________'}</div>
                <div>МФО: {mfo || '____________'}</div>
                {secondBankAccount && <div>Р/С: {secondBankAccount}</div>}
                {secondBankName && <div>Банк: {secondBankName}</div>}
                {secondMfo && <div>МФО: {secondMfo}</div>}
                <div>ИНН: {inn || '____________'}</div>
                {oked && <div>ОКЭД: {oked}</div>}
                {okpo && <div>ОКПО: {okpo}</div>}
                {ndsRegNumber && <div>Рег. код НДС: {ndsRegNumber}</div>}
                {customerPhone && <div>Тел: {customerPhone}</div>}
              </>
            )}
            <div className="req-sign">
              Заказчик <span className="sign-line" /> {clientType === 1 ? customerFullName : directorName}
            </div>
          </div>

          <div className="req-col pl-6 border-l border-gray-200">
            <div className="font-bold">Подрядчик:</div>
            <div className="font-bold">{contractorCompanyName}</div>
            <div>Адрес: {contractorAddress}</div>
            <div>Р/С: {contractorBankAccount}</div>
            <div>Банк: {contractorBankName}</div>
            <div>МФО: {contractorMfo}</div>
            <div>ИНН: {contractorInn}</div>
            <div className="req-sign">
              Ген. директор <span className="sign-line" /> {contractorDirectorName}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

AgreementDocument.displayName = 'AgreementDocument';
