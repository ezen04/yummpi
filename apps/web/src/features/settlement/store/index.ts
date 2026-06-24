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
  selectedReceiptId: string | null;
  splitMethod: 'ITEM_BASED' | 'EQUAL' | null;
  flowType: 'receipt' | 'manual' | null;
  equalAmount: number | null; // EQUAL(영수증 없는 /equal)만 사용. 그 외 null
  mySelectedItemIds: string[]; // ITEM_BASED /assign에서만 채움. 그 외 []

  addReceipt: (receiptId: string) => void;
  updateOcrResult: (
    receiptId: string,
    items: OcrItem[],
    status: 'SUCCEEDED' | 'FAILED',
    unclassifiedLines?: string[]
  ) => void;
  clearReceipts: () => void;
  deleteReceipt: (receiptId: string) => void;
  setSelectedReceiptId: (receiptId: string) => void;
  setSplitMethod: (method: 'ITEM_BASED' | 'EQUAL') => void;
  setFlowType: (flow: 'receipt' | 'manual') => void;
  setEqualAmount: (amount: number | null) => void;
  setMySelectedItemIds: (ids: string[]) => void;
  updateOcrItem: (receiptId: string, itemId: string, item: OcrItem) => void;
  deleteOcrItem: (receiptId: string, itemId: string) => void;
  addOcrItem: (receiptId: string, item: OcrItem) => void;
}

export const useSettlementStore = create<SettlementStore>((set) => ({
  receipts: [],
  selectedReceiptId: null,
  splitMethod: null,
  flowType: null,
  equalAmount: null,
  mySelectedItemIds: [],

  addReceipt: (receiptId) =>
    set((state) => {
      if (state.receipts.find((r) => r.receiptId === receiptId)) return state;
      return {
        receipts: [
          ...state.receipts,
          {
            receiptId,
            ocrStatus: 'PENDING',
            ocrItems: [],
            unclassifiedLines: [],
          },
        ],
        selectedReceiptId: state.selectedReceiptId || receiptId,
      };
    }),

  updateOcrResult: (receiptId, items, status, unclassifiedLines = []) =>
    set((state) => ({
      receipts: state.receipts.map((r) =>
        r.receiptId === receiptId
          ? { ...r, ocrStatus: status, ocrItems: items, unclassifiedLines }
          : r
      ),
    })),

  clearReceipts: () =>
    set({
      receipts: [],
      selectedReceiptId: null,
      splitMethod: null,
      flowType: null,
      equalAmount: null,
      mySelectedItemIds: [],
    }),

  deleteReceipt: (receiptId) =>
    set((state) => {
      const newReceipts = state.receipts.filter(
        (r) => r.receiptId !== receiptId
      );
      return {
        receipts: newReceipts,
        selectedReceiptId:
          state.selectedReceiptId === receiptId
            ? (newReceipts[0]?.receiptId ?? null)
            : state.selectedReceiptId,
      };
    }),

  setSelectedReceiptId: (receiptId) => set({ selectedReceiptId: receiptId }),

  setSplitMethod: (method) => set({ splitMethod: method }),
  setFlowType: (flow) => set({ flowType: flow }),
  setEqualAmount: (amount) => set({ equalAmount: amount }),
  setMySelectedItemIds: (ids) => set({ mySelectedItemIds: ids }),

  updateOcrItem: (receiptId, itemId, item) =>
    set((state) => ({
      receipts: state.receipts.map((r) =>
        r.receiptId === receiptId
          ? {
              ...r,
              ocrItems: r.ocrItems.map((i) => (i.id === itemId ? item : i)),
            }
          : r
      ),
    })),

  deleteOcrItem: (receiptId, itemId) =>
    set((state) => ({
      receipts: state.receipts.map((r) =>
        r.receiptId === receiptId
          ? {
              ...r,
              ocrItems: r.ocrItems.filter((i) => i.id !== itemId),
            }
          : r
      ),
    })),

  addOcrItem: (receiptId, item) =>
    set((state) => ({
      receipts: state.receipts.map((r) =>
        r.receiptId === receiptId
          ? {
              ...r,
              ocrItems: [...r.ocrItems, item],
            }
          : r
      ),
    })),
}));
