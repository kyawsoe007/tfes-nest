import { ApiProperty } from "@nestjs/swagger";

export enum DepreciationType{
    Monthly = 'Monthly',
    Yearly='Yearly'
}
export class CreateCapexManagementDto {
    @ApiProperty()
    name: string;

    @ApiProperty()
    purchase_value: number;

    @ApiProperty()
    outstanding_loan: number;

    @ApiProperty()
    monthly_installment: number;

    @ApiProperty()
    loan_installment:number;

    @ApiProperty()
    residual_amount:number;

    @ApiProperty()
    months_left: string;

    @ApiProperty()
    remarks: string;

    @ApiProperty()
    life_span: number;

    @ApiProperty()
    purchase_date: Date;

    @ApiProperty()
    depreciation_type: DepreciationType;

    @ApiProperty()
    bank: string;

    @ApiProperty()
    loan_duration: number;

    @ApiProperty()
    payment_startdate: Date;
    

    @ApiProperty()
    loanDepositDate: Date;

    @ApiProperty()
    interest_rate: number;

    @ApiProperty()
    loan_amount: number;

    @ApiProperty()
    active:boolean;
    
    @ApiProperty()
    debit_account:string;
    
    @ApiProperty()
    credit_account:string;

    @ApiProperty()
    loan_debit_account:string;
    
    @ApiProperty()
    loan_credit_account:string;

    @ApiProperty()
    loan_interest_account:string;

}
