import { PartialType } from '@nestjs/mapped-types';
import { CreatePurchaseSettingDto } from './create-purchase-setting.dto';

export class UpdatePurchaseSettingDto extends PartialType(CreatePurchaseSettingDto) {}
