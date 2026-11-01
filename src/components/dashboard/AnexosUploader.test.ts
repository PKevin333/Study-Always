import { describe, expect, it } from 'vitest';
import { getClipboardFiles } from './AnexosUploader';

const asClipboardData = (value: Partial<DataTransfer>) => value as DataTransfer;

describe('getClipboardFiles', () => {
  it('lê imagens expostas diretamente em clipboardData.files', () => {
    const image = new File(['imagem'], 'captura.png', { type: 'image/png' });
    const clipboardData = asClipboardData({ files: [image] as unknown as FileList, items: [] as unknown as DataTransferItemList });

    expect(getClipboardFiles(clipboardData)).toEqual([image]);
  });

  it('usa clipboardData.items quando o navegador não preenche files', () => {
    const image = new File(['imagem'], 'captura.webp', { type: 'image/webp' });
    const item = { kind: 'file', getAsFile: () => image } as DataTransferItem;
    const clipboardData = asClipboardData({ files: [] as unknown as FileList, items: [item] as unknown as DataTransferItemList });

    expect(getClipboardFiles(clipboardData)).toEqual([image]);
  });

  it('ignora clipboard sem arquivos', () => {
    const textItem = { kind: 'string', getAsFile: () => null } as unknown as DataTransferItem;
    const clipboardData = asClipboardData({ files: [] as unknown as FileList, items: [textItem] as unknown as DataTransferItemList });

    expect(getClipboardFiles(clipboardData)).toEqual([]);
    expect(getClipboardFiles(null)).toEqual([]);
  });
});
