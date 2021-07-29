import { PartialType } from '@nestjs/mapped-types';
import { CreateBalanceSheetDto } from './create-balance-sheet.dto';

export class UpdateBalanceSheetDto extends PartialType(CreateBalanceSheetDto) {}
