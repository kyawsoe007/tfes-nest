import { ApiProperty } from '@nestjs/swagger';
export class CSVDto{
    @ApiProperty({ required: false })
    startDate:Date;
    @ApiProperty({ required: false })
    endDate:Date;
}
export class CreateStockMoveDto {
  productId: string;
  operationId: string;
  lineNumber: number;
  description: string;
  destinationId: string;
  estimatedDate: Date;
  qty: number;
  unitPrice: number;
  remarks: string;
  done: boolean;
  completedQty: number;
  remainingQty: number;
  completedDate?: Date;
  originalMoveId?: string;
  skuId?: string;
  lineNumberId?: string;
}
