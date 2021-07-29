import { forwardRef, Module } from '@nestjs/common';
import { PartnersService } from './partners.service';
import { PartnersController } from './partners.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { PartnerSchema } from './schemas/partners.schema';
import { CustomerSchema } from 'src/customer/schemas/customer.schema';
import { SupplierSchema } from 'src/supplier/schemas/supplier.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Partner', schema: PartnerSchema }]),
    MongooseModule.forFeature([{
      name: 'Customer', schema: CustomerSchema
    }]),
    MongooseModule.forFeature([{
      name: 'Supplier', schema: SupplierSchema
    }]),
  ],
  controllers: [PartnersController],
  providers: [PartnersService],
  exports: [PartnersService],
})
export class PartnersModule { }
