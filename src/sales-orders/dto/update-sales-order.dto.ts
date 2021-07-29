// import { PartialType } from '@nestjs/mapped-types';
import { CreateSalesOrderDto } from './create-sales-order.dto';
import { PartialType } from '@nestjs/swagger';

export class UpdateSalesOrderDto extends PartialType(CreateSalesOrderDto) {}
