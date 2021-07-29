export interface SalesOrderStatus {
  woStatus: string;
  doStatus: string;
}

// Enum Sales Order'workOrder status
export enum soWoStatusEnum {
  INPROGRESS = 'in-progress',
  PARTIAL = 'partial',
  COMPLETE = 'completed',
}

// Enum Sales Order'delivery order status
export enum soDoStatusEnum {
  PENDING = 'pending',
  PARTIAL = 'partial',
  COMPLETE = 'completed',
}
