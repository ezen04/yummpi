export type SettlementItemInput = {
  receiptItemId: string;
  totalPrice: number;
  memberIds: string[];
};

export type SettlementEngineInput =
  | {
      splitMethod: 'EQUAL';
      totalAmount: number;
      hostMemberId: string;
      participantMemberIds: string[];
    }
  | {
      splitMethod: 'ITEM_BASED';
      hostMemberId: string;
      participantMemberIds: string[];
      itemAssignments: SettlementItemInput[];
    };

export type SettlementMemberOutput = {
  memberId: string;
  itemAmount: number;
  /** finalAmount − itemAmount. EQUAL은 finalAmount 전액, ITEM_BASED는 host의 반올림 차액 흡수분(타 멤버는 0) */
  adjustmentAmount: number;
  finalAmount: number;
};

export type SettlementItemAssignmentOutput = {
  receiptItemId: string;
  memberId: string;
  shareNumerator: 1;
  shareDenominator: number;
  assignedAmount: number;
};

export type SettlementEngineOutput = {
  totalAmount: number;
  members: SettlementMemberOutput[];
  itemAssignments?: SettlementItemAssignmentOutput[];
};
