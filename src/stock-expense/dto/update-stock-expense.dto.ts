import { PartialType } from '@nestjs/mapped-types';
import { CreateStockExpenseDto } from './create-stock-expense.dto';

export class UpdateStockExpenseDto extends PartialType(CreateStockExpenseDto) {}
