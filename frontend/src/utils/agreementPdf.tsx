import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { projectsApi } from '../api/services';
import { AgreementDocument, agreementToDocData } from '../components/AgreementDocument';
import { ProjectDocument } from '../types';

export const AGREEMENT_DOC_TYPE = 'shartnoma';

export const agreementDocTitle = (contractNumber: number) =>
  `Shartnoma №${String(contractNumber || 1).padStart(3, '0')}`;

export const isAgreementPdfDoc = (d: Pick<ProjectDocument, 'title' | 'fileType'>) =>
  d.fileType === AGREEMENT_DOC_TYPE && d.title.startsWith('Shartnoma №');

const waitForImages = (el: HTMLElement) =>
  Promise.all(
    Array.from(el.querySelectorAll('img')).map((img) =>
      img.complete
        ? Promise.resolve()
        : new Promise<void>((resolve) => {
            img.addEventListener('load', () => resolve(), { once: true });
            img.addEventListener('error', () => resolve(), { once: true });
          })
    )
  );

// Shartnoma ko'rinishini (forma bilan bir xil) ekrandan tashqarida chizib, A4 PDF ga aylantiradi
export const renderAgreementPdf = async (agreement: any): Promise<Blob> => {
  const { default: html2pdf } = await import('html2pdf.js');

  const host = document.createElement('div');
  host.style.cssText = 'position:fixed;left:-10000px;top:0;width:794px;background:#fff;';
  document.body.appendChild(host);
  const root = createRoot(host);

  try {
    flushSync(() => {
      root.render(<AgreementDocument data={agreementToDocData(agreement)} className="pdf-export w-[794px]" />);
    });
    const el = host.firstElementChild as HTMLElement;
    await waitForImages(el);
    if (document.fonts?.ready) await document.fonts.ready;

    const options = {
      margin: [18, 0, 18, 0],
      image: { type: 'jpeg', quality: 0.9 },
      html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff', windowWidth: 794 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['css', 'avoid-all'] },
    };
    return (await html2pdf().set(options as any).from(el).outputPdf('blob')) as Blob;
  } finally {
    root.unmount();
    host.remove();
  }
};

export const uploadAgreementPdfToProject = async (projectId: string, agreement: any): Promise<ProjectDocument> => {
  const blob = await renderAgreementPdf(agreement);
  const title = agreementDocTitle(agreement.contractNumber);
  const file = new File([blob], `${title.replace('№', '')}.pdf`.replace(/\s+/g, '_'), { type: 'application/pdf' });
  const fd = new FormData();
  fd.append('file', file);
  fd.append('title', title);
  fd.append('fileType', AGREEMENT_DOC_TYPE);
  return projectsApi.uploadDocument(projectId, fd);
};
