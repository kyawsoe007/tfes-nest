import { ApiProperty } from "@nestjs/swagger";

export class levelTwo {
    accountId: string;
}
export class CreateBalanceSheetDto {
    @ApiProperty()
    internalType: string;

    @ApiProperty()
    levelOne: string;

    @ApiProperty()
    levelTwo: []
}

