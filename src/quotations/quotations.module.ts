import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose'; // Added new line
import { QuotationsService } from './quotations.service';
import { QuotationsController } from './quotations.controller';
import { QuotationSchema } from './schemas/quotation.schema';
import { PaymentTermsModule } from '../payment-terms/payment-terms.module';
import { CurrenciesModule } from '../currencies/currencies.module';
import { IncotermModule } from '../incoterm/incoterm.module';
import { SequenceSettingsModule } from '../sequence-settings/sequence-settings.module';
import { TaxesModule } from '../taxes/taxes.module';
import { BomsModule } from '../boms/boms.module';
import { ProductsModule } from '../products/products.module';
import { SkusModule } from '../skus/skus.module';
import { DiscountsModule } from '../discounts/discounts.module';
import { UsersModule } from '../users/users.module';
import { UomModule } from '../uom/uom.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Quotation', schema: QuotationSchema }]),
    PaymentTermsModule,
    CurrenciesModule,
    IncotermModule,
    SequenceSettingsModule,
    TaxesModule,
    BomsModule,
    ProductsModule,
    SkusModule,
    DiscountsModule,
    UsersModule,
    UomModule,
  ],
  controllers: [QuotationsController],
  providers: [QuotationsService],
  exports: [QuotationsService],
})
export class QuotationsModule {}
