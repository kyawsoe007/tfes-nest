import { ApiProperty } from "@nestjs/swagger";

export class CreatePurchaseSettingDto {
    @ApiProperty()
    setting_name:string;

    @ApiProperty()
    account:string;
}
