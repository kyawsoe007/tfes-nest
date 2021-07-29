import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SupplierReconcileService } from './supplier-reconcile.service';
import { CreateSupplierReconcileDto } from './dto/create-supplier-reconcile.dto';
import { SupplierReconcile } from './interfaces/supplier-reconcile.interface';

@ApiTags('SupplierReconcile')
@Controller('supplier-reconcile')
export class SupplierReconcileController {
  constructor(private readonly supplierReconcileService: SupplierReconcileService) {}
  // Create new invoice
  @Post()
  async createNewReconcile(
    @Body() createSupplierReconcileDto: CreateSupplierReconcileDto
  ): Promise<SupplierReconcile> {
    return await this.supplierReconcileService.createNewReconcile(
        createSupplierReconcileDto
    );
  }

  @Get('getOutstands/:id')
  async getOutstands(@Param('id') id: string): Promise<SupplierReconcile[]> {
    const result = await this.supplierReconcileService.getOutstands(id);
    console.log('id',id)
    if (!result) {
      console.log('reconcile not found');
      //throw new NotFoundException('reconcile not found!');
    }
    return result;
  }
}
