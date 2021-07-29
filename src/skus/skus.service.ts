import { CurrenciesService } from './../currencies/currencies.service';
import { MaterialService } from './../material/material.service';
import { UomService } from './../uom/uom.service';
import { BrandService } from './../brand/brand.service';
import { SizeService } from './../size/size.service';
import { GrpTwoService } from './../grp-two/grp-two.service';
import { GrpOneService } from './../grp-one/grp-one.service';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateSkusDto, RsvdDto } from './dto/create-skus.dto';
import { UpdateSkusDto } from './dto/update-skus.dto';
import { Sku } from './skus.interface';
import { SupplierService } from './../supplier/supplier.service';
import { WorkOrdersService } from '../work-orders/work-orders.service';
import { OnMergeSkusDto } from './dto/onMerge-skus.dto';
import formatFixed2 from '../shared/formatFixed2';
import formatFixed4 from '../shared/formatFixed4';

@Injectable()
export class SkusService {
  // Added new Constructor
  constructor(
    @InjectModel('Sku') private readonly SkuModel: Model<Sku>,

    private readonly grpOneService: GrpOneService,
    private readonly grpTwoService: GrpTwoService,
    private readonly sizeService: SizeService,
    private readonly brandService: BrandService,
    private readonly currenciesService: CurrenciesService,
    private readonly uomService: UomService,
    private readonly materialService: MaterialService,
    private readonly supplierService: SupplierService,
    private readonly workOrdersService: WorkOrdersService,
  ) {}

  async createSku(createSkusDto: CreateSkusDto): Promise<Sku> {
    const response = new this.SkuModel(createSkusDto);
    return await response.save();
  }

  // Fetch All Sku Group
  async getAllSkuDropdownGroup() {
    const grpOne = await this.grpOneService.findAll();
    const grpTwo = await this.grpTwoService.findAll();
    const size = await this.sizeService.findAll();
    const currency = await this.currenciesService.findAll();
    const brand = await this.brandService.findAll();
    const uom = await this.uomService.findAll();
    const material = await this.materialService.findAll();

    return {
      grpOne,
      grpTwo,
      size,
      currency,
      brand,
      uom,
      material,
    };
  }

  // async createSkuWithProduct(objSku): Promise<Sku> {
  //   const response = new this.SkuModel(objSku);
  //   return await response.save();
  // }

  async findAllSku(): Promise<Sku[]> {
    const response = await this.SkuModel.find().populate([
      'product',
      'location',
    ]);
    return response;
  }

  async findSkuBelongsToProduct(id: string) {
    const response = await this.SkuModel.find({
      product: id,
      quantity: { $gt: 0 },
    }).populate(['location']);

    for (const sku of response) {
      if (sku.supplierNo) {
        const supplier = await this.supplierService.findBySupplierNo(
          sku.supplierNo,
        );
        if (supplier) {
          sku.set(
            'supplier',
            { name: supplier.name, suppNo: supplier.suppId },
            { strict: false },
          );
        }
      }
      if (sku.rsvd && sku.rsvd.length > 0) {
        for (const rsvd of sku.rsvd) {
          const workOrder = await this.workOrdersService.getWorkOrderbyId(
            rsvd.woId,
          );

          if (workOrder) {
            rsvd.set('woNumber', workOrder.woNumber, { strict: false });
          }
        }
      } else {
        sku.set('rsvd', undefined, { strict: false });
      }
    }

    return response;
  }

  async findSkUuWithSupplier(id: string) {
    const response = await this.SkuModel.findById(id).populate(['location']);

    //find supplier name and number
    if (response.supplierNo) {
      const supplier = await this.supplierService.findBySupplierNo(
        response.supplierNo,
      );
      if (supplier) {
        response.set(
          'supplier',
          { name: supplier.name, suppNo: supplier.suppId },
          { strict: false },
        );
      }
    }

    return response;
  }

  async findOneSkuForWO(id: string): Promise<any> {
    const response = await this.SkuModel.findById(
      { _id: id },
      'product location quantity',
    )
      .populate(['location'])
      .exec();
    if (!response) {
      throw new NotFoundException('Sku not found');
    }
    return response;
  }

  async findOneSku(id: string): Promise<any> {
    return await this.SkuModel.findById(id).populate(['product', 'location']);
  }

  async findOneSkuOnly(id: string): Promise<Sku> {
    const response = await this.SkuModel.findById(id);
    return response;
  }

  async updateSku(id: string, updateSkusDto: UpdateSkusDto): Promise<Sku> {
    const response = await this.SkuModel.findByIdAndUpdate(id, updateSkusDto, {
      new: true,
    });
    return response;
  }

  async removeSku(id: string): Promise<any> {
    return await this.SkuModel.findByIdAndRemove(id);
  }

  async findOneSkuByProductId(productId: string) {
    const response = await this.SkuModel.findOne({ product: productId });
    return response;
  }

  async updateRsvd(skuId: string, rsvdPayload: RsvdDto) {
    console.log('what is id onupdateSKU Service', skuId);
    console.log('rsvdPayload', rsvdPayload);
    const response = await this.SkuModel.updateOne(
      { _id: skuId },
      { $push: { rsvd: rsvdPayload } },
    );

    console.log('response after update', response);
    return response;
  }

  async findAllSkusBelongsToProductNonPopulate(
    productId: string,
  ): Promise<Sku[]> {
    return await this.SkuModel.find({
      product: productId,
    });
  }

  async deleteManyByProductId(productId: string): Promise<any> {
    return await this.SkuModel.deleteMany({
      product: productId,
    });
  }

  async onMergeSku(
    productId: string,
    onMergeSkusDto: OnMergeSkusDto,
  ): Promise<any> {
    const skuFrom = await this.findOneSku(onMergeSkusDto.skuIdMergeFrom);
    const skuTo = await this.findOneSku(onMergeSkusDto.skuIdMergeTo);
    console.log('skuFrom', skuFrom);
    console.log('skuTo', skuTo);

    if (!skuFrom || !skuTo) {
      throw new NotFoundException('Sku not found');
    }

    // Not allow to merge if both Skus have different supplierNo
    if (skuFrom.supplierNo && skuTo.supplierNo) {
      if (skuFrom.supplierNo !== skuTo.supplierNo)
        throw new BadRequestException(
          'Both Skus are different in supplier info, request denied',
        );
    }

    // Not allow to merge if either sku has reservation
    if (skuFrom.rsvd && skuFrom.rsvd.length > 0) {
      throw new BadRequestException(
        'Sku has quantity reservation, request denied',
      );
    }
    // sum of quantities
    const totalQuantity = skuFrom.quantity + skuTo.quantity;

    // sum of uniCost
    const unitCostSkuFrom = skuFrom.unitCost * skuFrom.quantity;
    const unitCostSkuTo = skuTo.unitCost * skuTo.quantity;

    // cal averageUnitCost
    const averageUnitCost = (unitCostSkuFrom + unitCostSkuTo) / totalQuantity;

    // Update SkU To
    skuTo.unitCost = averageUnitCost;
    skuTo.quantity = formatFixed4(totalQuantity);
    await skuTo.save();

    // Update SkU From
    skuFrom.quantity = 0;
    await skuFrom.save();

    return { skuFrom: skuFrom, skuTo: skuTo };
  }
}
