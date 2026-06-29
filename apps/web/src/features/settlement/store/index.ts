'use client';

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
  myRole: 'HOST' | 'MEMBER' | null; // 정산 플로우 진입 시 GET /members에서 채움
  previewUrls: Record<string, string>; // receiptId → blob: URL (re-mount 후에도 유지)
  pendingFiles: Record<string, File>; // receiptId → File (아직 S3 미업로드)

  addReceipt: (receiptId: string) => void;
  setOcrProcessing: (receiptId: string) => void;
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
  setMyRole: (role: 'HOST' | 'MEMBER') => void;
  updateOcrItem: (receiptId: string, itemId: string, item: OcrItem) => void;
  deleteOcrItem: (receiptId: string, itemId: string) => void;
  addOcrItem: (receiptId: string, item: OcrItem) => void;
  promoteUnclassifiedLine: (
    receiptId: string,
    lineIndex: number,
    item: OcrItem
  ) => void;
  setPreviewUrl: (receiptId: string, url: string) => void;
  setPendingFile: (receiptId: string, file: File) => void;
  removePendingFile: (receiptId: string) => void;
}

export const useSettlementStore = create<SettlementStore>((set) => ({
  receipts: [],
  selectedReceiptId: null,
  splitMethod: null,
  flowType: null,
  equalAmount: null,
  mySelectedItemIds: [],
  myRole: null,
  previewUrls: {},
  pendingFiles: {},

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

  setOcrProcessing: (receiptId) =>
    set((state) => ({
      receipts: state.receipts.map((r) =>
        r.receiptId === receiptId ? { ...r, ocrStatus: 'PROCESSING' } : r
      ),
    })),

  updateOcrResult: (receiptId, items, status, unclassifiedLines = []) =>
    set((state) => ({
      receipts: state.receipts.map((r) =>
        r.receiptId === receiptId
          ? { ...r, ocrStatus: status, ocrItems: items, unclassifiedLines }
          : r
      ),
    })),

  clearReceipts: () =>
    set((state) => {
      Object.values(state.previewUrls).forEach((url) =>
        URL.revokeObjectURL(url)
      );
      return {
        receipts: [],
        selectedReceiptId: null,
        splitMethod: null,
        flowType: null,
        equalAmount: null,
        mySelectedItemIds: [],
        myRole: null,
        previewUrls: {},
        pendingFiles: {},
      };
    }),

  deleteReceipt: (receiptId) =>
    set((state) => {
      const url = state.previewUrls[receiptId];
      if (url) URL.revokeObjectURL(url);
      const newReceipts = state.receipts.filter(
        (r) => r.receiptId !== receiptId
      );
      const { [receiptId]: _url, ...restUrls } = state.previewUrls;
      const { [receiptId]: _file, ...restFiles } = state.pendingFiles;
      return {
        receipts: newReceipts,
        selectedReceiptId:
          state.selectedReceiptId === receiptId
            ? (newReceipts[0]?.receiptId ?? null)
            : state.selectedReceiptId,
        previewUrls: restUrls,
        pendingFiles: restFiles,
      };
    }),

  setSelectedReceiptId: (receiptId) => set({ selectedReceiptId: receiptId }),

  setSplitMethod: (method) => set({ splitMethod: method }),
  setFlowType: (flow) => set({ flowType: flow }),
  setEqualAmount: (amount) => set({ equalAmount: amount }),
  setMySelectedItemIds: (ids) => set({ mySelectedItemIds: ids }),
  setMyRole: (role) => set({ myRole: role }),

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

  setPreviewUrl: (receiptId, url) =>
    set((state) => ({
      previewUrls: { ...state.previewUrls, [receiptId]: url },
    })),

  setPendingFile: (receiptId, file) =>
    set((state) => ({
      pendingFiles: { ...state.pendingFiles, [receiptId]: file },
    })),

  removePendingFile: (receiptId) =>
    set((state) => {
      const { [receiptId]: _, ...rest } = state.pendingFiles;
      return { pendingFiles: rest };
    }),

  // 미분류 줄 → 품목 승격. ocrItems push + unclassifiedLines splice를 한 액션으로
  // 묶어 중복 노출/race를 차단한다.
  promoteUnclassifiedLine: (receiptId, lineIndex, item) =>
    set((state) => ({
      receipts: state.receipts.map((r) =>
        r.receiptId === receiptId
          ? {
              ...r,
              ocrItems: [...r.ocrItems, item],
              unclassifiedLines: r.unclassifiedLines.filter(
                (_, i) => i !== lineIndex
              ),
            }
          : r
      ),
    })),
}));
