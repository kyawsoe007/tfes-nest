import { ApiProperty } from "@nestjs/swagger";

export class CreateProfitDto {
    @ApiProperty()
    accountId: string;

    @ApiProperty()
    internal: string;
}
