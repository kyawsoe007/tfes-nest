import { ApiProperty } from "@nestjs/swagger";

export class CreatePaymentMethodDto {
    @ApiProperty()
    name: string;

    @ApiProperty()
    account: string;

    @ApiProperty()
    journal: string;

    @ApiProperty()
    currency: string;
}
