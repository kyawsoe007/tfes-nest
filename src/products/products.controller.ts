import { ApiTags } from '@nestjs/swagger';
import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  Header,
  Res,
  NotFoundException,
} from '@nestjs/common';
import fs = require('fs-extra');
import path = require('path');
const {
  Parser,
  transforms: { unwind, flatten },
} = require('json2csv');

import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { FilterDto } from '../shared/filter.dto';
import { Product } from './products.interface';
import { Response } from 'express';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  // findone for WorkOrder
  @Get('simple/:id')
  findOneProductForWO(@Param('id') id: string): Promise<Product> {
    return this.productsService.findOneProductForWO(id);
  }

  @Post('getfilters')
  findAll(@Body() query: FilterDto) {
    return this.productsService.findAll(query);
  }

  @Get('getAllDetails')
  productDetails() {
    return this.productsService.productDetails();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productsService.update(id, updateProductDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }

  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename=products.csv')
  @Get()
  async findAllToExportCSV(@Res() response: Response) {
    // const quotation = await this.quotationsService.findStatusById(id);
    const products = await this.productsService.findAllToExportCSV();

    console.log('the products', products);
    // console.log('pro', products);
    const fields = [
      'partNumber',
      'description',
      'averagePrice',
      'listPrice',
      'unitCost',
      'remarks',
      'brand.name',
      'grpOne.name',
      'grpTwo.name',
      'currency.name',
      'selOne',
      'selTwo',
      'size.name',
      'material.name',
      'uom.name',
      'isFreight',
      'supp1.name',
      'supp2.name',
      'supp3.name',
      'supp4.name',
      'supp5.name',
      'location.name',
      'skus.unitCost',
      'skus.quantity',
      'skus.location.name',
      'skus.remarks',
      'skus.supplierNo',
      'skus.supplier.name',
      'skus.rsvd.woNumber',
      'skus.rsvd.qty',
    ];

    const transforms = [
      unwind({
        paths: ['skus', 'skus.rsvd'],
      }),
    ];
    const opts = { fields, transforms };

    // const json2csvParser = new Parser({ fields });
    // const csv = json2csvParser.parse(myCars);

    if (products.length > 0) {
      const json2csvParser = new Parser(opts);
      const resultCSV = json2csvParser.parse(
        JSON.parse(JSON.stringify(products)),
      );

      const readFile = fs.readFileSync(
        path.resolve('src/products/templates', 'products.csv'),
      );

      fs.writeFile(readFile, resultCSV, function (error) {
        if (error) {
          console.error(error);
        }
        console.log('successfully!');
        response.status(200).end(resultCSV);
      });
    } else {
      throw new NotFoundException('Products not Found');
    }
  }
}
