import { ApiProperty } from '@nestjs/swagger';
import { PackItems } from 'src/packing-lists/packing-lists.interface';
import { StockMove } from 'src/stock-move/stock-move.interface';

export enum OperationStatusEnumDto {
  OPEN = 'open',
  PARTIAL = 'partial',
  CLOSED = 'closed',
}

export class CreateStockOperationDto {
  @ApiProperty()
  moveNo: string;
  @ApiProperty()
  type: string;
  @ApiProperty()
  readonly orderNo: string;
  @ApiProperty()
  deliveryId?: string;
  @ApiProperty()
  destination: string;
  @ApiProperty()
  stockMove?: PackItems[];
  @ApiProperty()
  moveItems?: StockMove[];
  @ApiProperty()
  onMoveIn?: boolean; // onMoveIn : True = Add Qty || false = deduct qty
  @ApiProperty()
  onSelectProduct?: boolean;
  @ApiProperty()
  status: OperationStatusEnumDto
}
