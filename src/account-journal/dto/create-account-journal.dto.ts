import { ApiProperty } from "@nestjs/swagger";

export class CreateAccountJournalDto {
    @ApiProperty()
    name: string;

    @ApiProperty()
    debit_account:string;
    
    @ApiProperty()
    credit_account:string;

    @ApiProperty()
    currency:string;
}
