import { create } from 'zustand';

export interface OcrItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice?: number;
  totalPrice: number;
  confidence?: number;
}

export interface ReceiptEntry {
  receiptId: string;
  ocrStatus: 'PENDING' | 'PROCESSING' | 'SUCCEEDED' | 'FAILED';
  ocrItems: OcrItem[];
  unclassifiedLines: string[];
}

interface SettlementStore {
  receipts: ReceiptEntry[];

  addReceipt: (receiptId: string) => void;
  updateOcrResult: (
    receiptId: string,
    items: OcrItem[],
    status: 'SUCCEEDED' | 'FAILED',
    unclassifiedLines?: string[]
  ) => void;
  clearReceipts: () => void;
}

export const useSettlementStore = create<SettlementStore>((set) => ({
  receipts: [],

  addReceipt: (receiptId) =>
    set((state) => ({
      receipts: [
        ...state.receipts,
        { receiptId, ocrStatus: 'PENDING', ocrItems: [], unclassifiedLines: [] },
      ],
    })),

  updateOcrResult: (receiptId, items, status, unclassifiedLines = []) =>
    set((state) => ({
      receipts: state.receipts.map((r) =>
        r.receiptId === receiptId
          ? { ...r, ocrStatus: status, ocrItems: items, unclassifiedLines }
          : r
      ),
    })),

  clearReceipts: () => set({ receipts: [] }),
}));
