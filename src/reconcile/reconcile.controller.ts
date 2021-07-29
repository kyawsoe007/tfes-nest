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
import { ReconcileService } from './reconcile.service';
import { CreateReconcileDto } from './dto/create-reconcile.dto';
import { UpdateReconcileDto } from './dto/update-reconcile.dto';
import { Reconcile } from './interfaces/reconcile.interface';
import {Invoice} from "../invoices/interfaces/invoices.interface";

@ApiTags('Reconcile')
@Controller('reconcile')
export class ReconcileController {
  constructor(private reconcileService: ReconcileService) {}

  // Create new invoice
  @Post()
  async createNewReconcile(
    @Body() createReconcileDto: CreateReconcileDto
  ): Promise<Reconcile> {
    return await this.reconcileService.createNewReconcile(
        createReconcileDto
    );
  }

  @Get('getOutstands/:id')
  async getOutstands(@Param('id') id: string): Promise<any> {
    const result = await this.reconcileService.getOutstands(id);
    if (!result) {
      console.log('reconcile not found');
      throw new NotFoundException('reconcile not found!');
    }
    return result;
  }

  @Get('getSupplierOutstands/:id')
  async getSupplierOutstands(@Param('id') id: string): Promise<any> {
    const result = await this.reconcileService.getSupplierOutstands(id);
    if (!result) {
      console.log('reconcile not found');
      throw new NotFoundException('reconcile not found!');
    }
    return result;
  }
}
