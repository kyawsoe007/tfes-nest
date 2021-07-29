import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { isValidObjectId, Model } from 'mongoose'; //added
import { Product } from './products.interface'; //added
import { Brand } from 'src/brand/brand.interface';
import { Size } from 'src/size/size.interface';
import { GrpOne } from 'src/grp-one/grp-one.interface';
import { GrpTwo } from 'src/grp-two/grp-two.interface';
import { SelOne } from 'src/sel-one/sel-one.interface';
import { SelTwo } from 'src/sel-two/sel-two.interface';
import { Uom } from 'src/uom/uom.interface';
import { Material } from 'src/material/material.interface';
import { GstReq } from 'src/gst-req/gst-req.interface';
import { Supplier } from 'src/supplier/supplier.interface';
import { SkusService } from 'src/skus/skus.service';
import { CurrenciesService } from 'src/currencies/currencies.service';
import { BomsService } from 'src/boms/boms.service';
import { SequenceSettingsService } from 'src/sequence-settings/sequence-settings.service';
import { StockLocationService } from '../stock-location/stock-location.service';
import { SaleOrderItemsDto } from '../sales-orders/dto/create-sales-order.dto';
import { CreateSkusDto } from '../skus/dto/create-skus.dto';
import { SalesOrdersService } from '../sales-orders/sales-orders.service';
import { OnMergeSkusDto } from '../skus/dto/onMerge-skus.dto';
import formatFixed2 from '../shared/formatFixed2';

// import * as mongoose from 'mongoose';
const mongoose = require('mongoose');
// const { ObjectId } = require('mongodb');
@Injectable()
export class ProductsService {
  // create(createProductDto: CreateProductDto) {
  //   return 'This action adds a new product';
  // }
  constructor(
    @InjectModel('Product') private readonly productModel: Model<Product>,
    @InjectModel('Brand') private readonly brandModel: Model<Brand>,
    @InjectModel('GrpOne') private readonly grponeModel: Model<GrpOne>,
    @InjectModel('GrpTwo') private readonly grptwoModel: Model<GrpTwo>,
    @InjectModel('GstReq') private readonly gstreqModel: Model<GstReq>,
    @InjectModel('SelOne') private readonly seloneModel: Model<SelOne>,
    @InjectModel('SelTwo') private readonly seltwoModel: Model<SelTwo>,
    @InjectModel('Size') private readonly sizeModel: Model<Size>,
    @InjectModel('Uom') private readonly uomModel: Model<Uom>,
    @InjectModel('Material') private readonly materialModel: Model<Material>,
    @InjectModel('Supplier') private readonly supplierModel: Model<Supplier>,
    private readonly skusService: SkusService,
    private readonly currenciesService: CurrenciesService,
    private readonly sequenceSettingsService: SequenceSettingsService,
    private readonly stockLocationService: StockLocationService,
    private readonly bomService: BomsService,
    @Inject(forwardRef(() => SalesOrdersService))
    private readonly salesOrdersService: SalesOrdersService,
  ) {}

  async create(createProductDto: CreateProductDto): Promise<Product> {
    const data = createProductDto['data'];
    const checkId = await this.productModel.findOne({
      partNumber: data.partNumber,
    });
    if (checkId) {
      throw new BadRequestException('Part Number already existed');
    }

    if (!data.partNumber) {
      console.log('is empty');
      throw new BadRequestException('Part Number should not be empty');
    }

    const result = await this.productModel.create(createProductDto['data']);
    await result.save();
    return result;
  }
  async findAll(query: any): Promise<any> {
    // console.log(JSON.parse(query.filter));
    // const response = await this.productModel.find();
    // return response;
    const limit = parseInt(query.limit ? query.limit : 0);
    const skip = parseInt(query.skip ? query.skip : 0);
    const filter = query.filter ? query.filter : [];
    //const searchText = query.searchText ? query.searchText : '';
    let orderBy =
      query.orderBy && Object.keys(query.orderBy).length > 0
        ? query.orderBy
        : { partNumber: 1 };

    for (const [key, value] of Object.entries(orderBy)) {
      if (key === 'grpOne') {
        orderBy = { 'grpOne.name': value };
        break;
      }
      if (key === 'grpTwo') {
        orderBy = { 'grpTwo.name': value };
        break;
      }
      if (key === 'size') {
        orderBy = { 'size.name': value };
        break;
      }
    }

    let where = {};

    let nonzero = false;
    const namedFilter = [];
    if (filter != null) {
      //var filterKeys = Object.keys(filter);
      for (let i = 0; i < filter.length; i++) {
        const property = Object.keys(filter[i])[0];
        const propVal = Object.values(filter[i])[0] as unknown;
        console.log(property);
        if (property == 'dropsearch') {
          let arrVals = [];
          if (!Array.isArray(propVal)) {
            arrVals.push(propVal);
          } else {
            arrVals = propVal;
          }
          console.log(propVal);
          for (let i = 0; i < arrVals.length; i++) {
            const keyVals = arrVals[i].split(':');
            if (keyVals[0] == 'PartNo') {
              const replaceText = keyVals[1].replace('+', '\\+');
              var searchPattern = new RegExp('.*' + replaceText + '.*', 'i');
              namedFilter.push({ partNumber: searchPattern });
            } else if (keyVals[0] == 'Desc') {
              var searchPattern = new RegExp('.*' + keyVals[1] + '.*', 'i');
              namedFilter.push({ description: searchPattern });
            } else if (keyVals[0] == 'Grp1') {
              var searchPattern = new RegExp('.*' + keyVals[1] + '.*', 'i');
              const grpObj = await this.grponeModel.find({
                name: searchPattern,
              });
              const grpIds = grpObj.map((item) => item._id);
              namedFilter.push({ grpOne: { $in: grpIds } });
            } else if (keyVals[0] == 'Grp2') {
              var searchPattern = new RegExp('.*' + keyVals[1] + '.*', 'i');
              const grpObj = await this.grptwoModel.find({
                name: searchPattern,
              });
              const grpIds = grpObj.map((item) => item._id);
              namedFilter.push({ grpTwo: { $in: grpIds } });
            } else if (keyVals[0] == 'Size') {
              var searchPattern = new RegExp('.*' + keyVals[1] + '.*', 'i');
              const grpObj = await this.sizeModel.find({ name: searchPattern });
              const grpIds = grpObj.map((item) => item._id);
              namedFilter.push({ size: { $in: grpIds } });
            } else if (keyVals[0] == 'Supplier') {
              var searchPattern = new RegExp('.*' + keyVals[1] + '.*', 'i');
              const grpObj = await this.supplierModel.find({
                name: searchPattern,
              });
              const grpIds = grpObj.map((item) => item._id);
              namedFilter.push({
                $or: [
                  { supp1: { $in: grpIds } },
                  { supp2: { $in: grpIds } },
                  { supp3: { $in: grpIds } },
                  { supp4: { $in: grpIds } },
                  { supp5: { $in: grpIds } },
                ],
              });
            } else if (keyVals[0] == 'Material') {
              var searchPattern = new RegExp('.*' + keyVals[1] + '.*', 'i');
              const grpObj = await this.materialModel.find({
                name: searchPattern,
              });
              const grpIds = grpObj.map((item) => item._id);
              namedFilter.push({ material: { $in: grpIds } });
            } else if (keyVals[0] == 'Brand') {
              var searchPattern = new RegExp('.*' + keyVals[1] + '.*', 'i');
              const grpObj = await this.brandModel.find({
                name: searchPattern,
              });
              const grpIds = grpObj.map((item) => item._id);
              namedFilter.push({ brand: { $in: grpIds } });
            } else if (keyVals[0] == 'Sel1') {
              var searchPattern = new RegExp('.*' + keyVals[1] + '.*', 'i');
              namedFilter.push({ selOne: searchPattern });
            } else if (keyVals[0] == 'Sel2') {
              var searchPattern = new RegExp('.*' + keyVals[1] + '.*', 'i');
              namedFilter.push({ selTwo: searchPattern });
            }
          }
        } else if (property == 'Qty') {
          //find
          if (propVal == 'Not zero') {
            nonzero = true;
          }
        }
      }
    }

    if (namedFilter.length == 1) {
      where = namedFilter[0];
    } else if (namedFilter.length > 1) {
      where['$and'] = namedFilter;
    }

    let products, count;
    if (nonzero) {
      console.log('Non Zero====================================>');

      console.log('non zero');
      products = await this.productModel.aggregate([
        { $match: where },
        {
          $lookup: {
            from: 'grpones',
            let: { grpOne: '$grpOne' },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ['$_id', '$$grpOne'] },
                },
              },
              {
                $project: {
                  id: '$_id',
                  name: { $toUpper: '$name' },
                },
              },
            ],
            as: 'grpOne',
          },
        },
        { $unwind: { path: '$grpOne', preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: 'grptwos',
            let: { grpTwo: '$grpTwo' },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ['$_id', '$$grpTwo'] },
                },
              },
              {
                $project: {
                  id: '$_id',
                  name: { $toUpper: '$name' },
                },
              },
            ],
            as: 'grpTwo',
          },
        },
        { $unwind: { path: '$grpTwo', preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: 'sizes',
            let: { size: '$size' },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ['$_id', '$$size'] },
                },
              },
              {
                $project: {
                  id: '$_id',
                  name: 1,
                },
              },
            ],
            as: 'size',
          },
        },

        { $unwind: { path: '$size', preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: 'skus',
            let: { myid: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$product', '$$myid'] },
                      { $gt: ['$quantity', 0.00001] },
                    ],
                  },
                },
              },
            ],
            as: 'skus',
          },
        },
        {
          $addFields: {
            id: '$_id',
            skusize: { $size: '$skus' },
          },
        },
        {
          $match: { skusize: { $gt: 0 } },
        },

        { $sort: orderBy },
        { $skip: skip },
        { $limit: limit },

        {
          $lookup: {
            from: 'materials',
            let: { material: '$material' },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ['$_id', '$$material'] },
                },
              },
              {
                $project: {
                  id: '$_id',
                  name: 1,
                },
              },
            ],
            as: 'material',
          },
        },
        {
          $lookup: {
            from: 'brands',
            let: { brand: '$brand' },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ['$_id', '$$brand'] },
                },
              },
              {
                $project: {
                  id: '$_id',
                  name: 1,
                },
              },
            ],
            as: 'brand',
          },
        },
        {
          $lookup: {
            from: 'uoms',
            let: { uom: '$uom' },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ['$_id', '$$uom'] },
                },
              },
              {
                $project: {
                  id: '$_id',
                  name: 1,
                },
              },
            ],
            as: 'uom',
          },
        },
        // {
        //   $lookup: {
        //     from: 'suppliers',
        //     let: { supp1: '$supp1' },
        //     pipeline: [
        //       {
        //         $match: {
        //           $expr: { $eq: ['$_id', '$$supp1'] },
        //         },
        //       },
        //       {
        //         $project: {
        //           id: '$_id',
        //           suppId: 1,
        //           name: 1,
        //           nickname: 1,
        //           country: 1,
        //           delCountry: 1,
        //           tfesPIC: 1,
        //           incoterm: 1,
        //           downPayment: 1,
        //           gstReq: 1,
        //           salesPic: 1,
        //           billingCurrent: 1,
        //         },
        //       },
        //     ],
        //     as: 'supp1',
        //   },
        // },
        // {
        //   $lookup: {
        //     from: 'suppliers',
        //     let: { supp2: '$supp2' },
        //     pipeline: [
        //       {
        //         $match: {
        //           $expr: { $eq: ['$_id', '$$supp2'] },
        //         },
        //       },
        //       {
        //         $project: {
        //           id: '$_id',
        //           suppId: 1,
        //           name: 1,
        //           nickname: 1,
        //           country: 1,
        //           delCountry: 1,
        //           tfesPIC: 1,
        //           incoterm: 1,
        //           downPayment: 1,
        //           gstReq: 1,
        //           salesPic: 1,
        //           billingCurrent: 1,
        //         },
        //       },
        //     ],
        //     as: 'supp2',
        //   },
        // },
        // {
        //   $lookup: {
        //     from: 'suppliers',
        //     let: { supp3: '$supp3' },
        //     pipeline: [
        //       {
        //         $match: {
        //           $expr: { $eq: ['$_id', '$$supp3'] },
        //         },
        //       },
        //       {
        //         $project: {
        //           id: '$_id',
        //           suppId: 1,
        //           name: 1,
        //           nickname: 1,
        //           country: 1,
        //           delCountry: 1,
        //           tfesPIC: 1,
        //           incoterm: 1,
        //           downPayment: 1,
        //           gstReq: 1,
        //           salesPic: 1,
        //           billingCurrent: 1,
        //         },
        //       },
        //     ],
        //     as: 'supp3',
        //   },
        // },
        // {
        //   $lookup: {
        //     from: 'suppliers',
        //     let: { supp4: '$supp4' },
        //     pipeline: [
        //       {
        //         $match: {
        //           $expr: { $eq: ['$_id', '$$supp4'] },
        //         },
        //       },
        //       {
        //         $project: {
        //           id: '$_id',
        //           suppId: 1,
        //           name: 1,
        //           nickname: 1,
        //           country: 1,
        //           delCountry: 1,
        //           tfesPIC: 1,
        //           incoterm: 1,
        //           downPayment: 1,
        //           gstReq: 1,
        //           salesPic: 1,
        //           billingCurrent: 1,
        //         },
        //       },
        //     ],
        //     as: 'supp4',
        //   },
        // },
        // {
        //   $lookup: {
        //     from: 'suppliers',
        //     let: { supp5: '$supp5' },
        //     pipeline: [
        //       {
        //         $match: {
        //           $expr: { $eq: ['$_id', '$$supp5'] },
        //         },
        //       },
        //       {
        //         $project: {
        //           id: '$_id',
        //           suppId: 1,
        //           name: 1,
        //           nickname: 1,
        //           country: 1,
        //           delCountry: 1,
        //           tfesPIC: 1,
        //           incoterm: 1,
        //           downPayment: 1,
        //           gstReq: 1,
        //           salesPic: 1,
        //           billingCurrent: 1,
        //         },
        //       },
        //     ],
        //     as: 'supp5',
        //   },
        // },

        { $unwind: { path: '$material', preserveNullAndEmptyArrays: true } },
        { $unwind: { path: '$brand', preserveNullAndEmptyArrays: true } },
        { $unwind: { path: '$uom', preserveNullAndEmptyArrays: true } },
        // { $unwind: { path: '$supp1', preserveNullAndEmptyArrays: true } },
        // { $unwind: { path: '$supp2', preserveNullAndEmptyArrays: true } },
        // { $unwind: { path: '$supp3', preserveNullAndEmptyArrays: true } },
        // { $unwind: { path: '$supp4', preserveNullAndEmptyArrays: true } },
        // { $unwind: { path: '$supp5', preserveNullAndEmptyArrays: true } },
      ]);
      const countdocs = await this.productModel.aggregate([
        { $match: where },
        {
          $lookup: {
            from: 'skus',
            let: { myid: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$product', '$$myid'] },
                      { $gt: ['$quantity', 0] },
                    ],
                  },
                },
              },
            ],
            as: 'skus',
          },
        },
        {
          $set: { skusize: { $size: '$skus' } },
        },
        {
          $match: { skusize: { $gt: 0 } },
        },
        {
          $count: 'num',
        },
      ]);
      count = countdocs[0].num;
    } else {
      const query = [
        { $match: where },
        {
          $lookup: {
            from: 'grpones',
            let: { grpOne: '$grpOne' },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ['$_id', '$$grpOne'] },
                },
              },
              {
                $project: {
                  id: '$_id',
                  name: { $toUpper: '$name' },
                },
              },
            ],
            as: 'grpOne',
          },
        },
        { $unwind: { path: '$grpOne', preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: 'grptwos',
            let: { grpTwo: '$grpTwo' },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ['$_id', '$$grpTwo'] },
                },
              },
              {
                $project: {
                  id: '$_id',
                  name: { $toUpper: '$name' },
                },
              },
            ],
            as: 'grpTwo',
          },
        },
        { $unwind: { path: '$grpTwo', preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: 'sizes',
            let: { size: '$size' },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ['$_id', '$$size'] },
                },
              },
              {
                $project: {
                  id: '$_id',
                  name: 1,
                },
              },
            ],
            as: 'size',
          },
        },
        { $unwind: { path: '$size', preserveNullAndEmptyArrays: true } },

        { $sort: orderBy },
        { $skip: skip },
        { $limit: limit },

        {
          $lookup: {
            from: 'materials',
            let: { material: '$material' },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ['$_id', '$$material'] },
                },
              },
              {
                $project: {
                  id: '$_id',
                  name: 1,
                },
              },
            ],
            as: 'material',
          },
        },
        {
          $lookup: {
            from: 'brands',
            let: { brand: '$brand' },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ['$_id', '$$brand'] },
                },
              },
              {
                $project: {
                  id: '$_id',
                  name: 1,
                },
              },
            ],
            as: 'brand',
          },
        },
        {
          $lookup: {
            from: 'uoms',
            let: { uom: '$uom' },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ['$_id', '$$uom'] },
                },
              },
              {
                $project: {
                  id: '$_id',
                  name: 1,
                },
              },
            ],
            as: 'uom',
          },
        },

        { $unwind: { path: '$material', preserveNullAndEmptyArrays: true } },
        { $unwind: { path: '$brand', preserveNullAndEmptyArrays: true } },
        { $unwind: { path: '$uom', preserveNullAndEmptyArrays: true } },

        {
          $lookup: {
            from: 'skus',
            let: { myid: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$product', '$$myid'] },
                      { $gt: ['$quantity', 0.00001] },
                    ],
                  },
                },
              },
            ],
            as: 'skus',
          },
        },
        {
          $addFields: {
            id: '$_id',
          },
        },
      ];

      products = await this.productModel.aggregate(query);
      count = await this.productModel.countDocuments(where);
    }

    /*
    const products = await this.productModel
      .find(where)
      .skip(skip)
      .limit(limit)
      .sort(orderBy)
      .populate([
        'brand',
        'grpOne',
        'grpTwo',
        'size',
        'material',
        'uom',
        'supp1',
        'supp2',
        'supp3',
        'supp4',
        'supp5',
      ]);
*/

    for (let i = 0; i < products.length; i++) {
      for (let j = 0; j < products[i].skus.length; j++) {
        const skuFound = await this.skusService.findSkUuWithSupplier(
          products[i].skus[j]._id,
        );

        // Added Sku Reserved Qty
        if (skuFound) {
          if (skuFound.rsvd && skuFound.rsvd.length > 0) {
            const skuReserved = skuFound.rsvd
              .map((item) => item.qty)
              .reduce((accumulator, current) => accumulator + current);

            skuFound.set('totalReserved', skuReserved, {
              strict: false,
            });
          }

          products[i].skus[j] = skuFound;
        }
      }

      if (products[i].bom) {
        console.log(products[i].bom);
        try {
          const bomObj = await this.bomService.findOne(products[i].bom);
          const bomList = [];
          for (let j = 0; j < bomObj.productList.length; j++) {
            let productObj;
            let skuData;
            if (bomObj.productList[j].sku) {
              skuData = await this.skusService.findOneSku(
                bomObj.productList[j].sku,
              );
              if (!skuData) {
                throw new NotFoundException(
                  'You are selecting parent sku without product ID, sku not found, request denied',
                );
              }
              productObj = await this.findOne(skuData.product);
            } else if (bomObj.productList[j].product) {
              productObj = await this.findOne(bomObj.productList[j].product);
              if (!productObj) {
                throw new NotFoundException(
                  'You have a product in your BOM that does not exist',
                );
              }
            }

            bomList.push({
              product: bomObj.productList[j].product,
              sku: bomObj.productList[j].sku,
              qty: bomObj.productList[j].qty,
              skuData: skuData,
              productData: productObj,
            });
            products[i].bomlist = bomList;
            //products[i].set('bomlist', bomList, { strict: false });
          }
        } catch (e) {
          console.log('no bom found');
          console.log(e.message);
        }
      }
    }
    // console.log('filter', filter);
    // console.log('skip', skip);
    // console.log('limit', limit);
    // console.log('orderBy', orderBy);
    // console.log('count', count);
    // console.log('products', products);

    // return;
    return [products, count];
  }
  async findOne(id: string) {
    const product = await this.productModel
      .findOne({ _id: id })
      .populate([
        'brand',
        'grpOne',
        'grpTwo',
        'size',
        'material',
        'uom',
        'supp1',
        'supp2',
        'supp3',
        'supp4',
        'supp5',
        'currency',
      ]);

    const skuFound = await this.skusService.findSkuBelongsToProduct(id);
    product.set('skus', skuFound, { strict: false });
    return product;
  }

  async findOneProductForWO(id: string): Promise<Product> {
    const product = await this.productModel
      .findOne(
        { _id: id },
        'partNumber description bom unitCost uom averagePrice listPrice isFreight',
      )
      .populate('size', 'name')
      .exec();

    return product;
  }

  async productDetails(): Promise<any> {
    const brand = await this.brandModel.find().sort({ name: 1 });
    const grpOne = await this.grponeModel.find().sort({ name: 1 });
    const grpTwo = await this.grptwoModel.find().sort({ name: 1 });
    const sizes = await this.sizeModel.find().sort({ name: 1 });
    const uom = await this.uomModel.find().sort({ name: 1 });
    const materials = await this.materialModel.find().sort({ name: 1 });
    const gstReq = await this.gstreqModel.find();
    const supplier = await this.supplierModel.find().sort({ name: 1 });
    const currency = await this.currenciesService.findAll();
    const location = await this.stockLocationService.findAllLocation();

    return {
      materials: materials ? materials : [],
      brands: brand ? brand : [],
      grpOne: grpOne ? grpOne : [],
      grpTwo: grpTwo ? grpTwo : [],
      gstReq: gstReq ? gstReq : [],
      sizes: sizes ? sizes : [],
      supplier: supplier ? supplier : [],
      uom: uom ? uom : [],
      currency: currency ? currency : [],
      location: location ? location : [],
    };
  }

  async update(
    id: string,
    updateProductDto: UpdateProductDto,
  ): Promise<Product> {
    const existingProduct = await this.productModel.findByIdAndUpdate(
      { _id: id },
      updateProductDto,
      { new: true },
    );

    //  await existingProduct.save();
    return existingProduct;
  }

  async remove(id: string) {
    console.log('OnRemoved Product Functions');

    const product = await this.findOneProductForWO(id);
    if (!product) {
      throw new NotFoundException('No Product Found');
    }

    // find any product attaching with BOM list
    if (!product.bom) {
      const boms = await this.bomService.findAll();

      if (boms && boms.length > 0) {
        for (const bom of boms) {
          const productFound = bom.productList.some(
            (item) => String(item.product) === String(id),
          );
          if (productFound) {
            throw new NotFoundException(
              'Product existed one of the BOM list, deletion aborted',
            );
          }
        }
      }
    }

    const response = await this.salesOrdersService.onCheckingSalesOrderItemProduct(
      id,
    );
    if (response) {
      console.log('Proceed deletion');
      if (product.bom) {
        console.log('BOM product');
        await this.bomService.remove(product.bom);
      }
      await this.skusService.deleteManyByProductId(id);

      await product.remove();
    }

    return true;
  }

  async createOrUpdateProductAndSKU(
    salesOrderItemsDto: SaleOrderItemsDto,
    totalUnitCost: number,
  ): Promise<Product> {
    // console.log('what is coming in', salesOrderItemsDto);
    const product = await this.productModel.findOne({
      bom: salesOrderItemsDto.bom,
    });

    if (!product) {
      console.log('Product not exist, CREATE NEW PRODUCT');
      console.log('=================== START HERE =======================');
      const modelName = 'Product'; // hard-coded first

      const settings = await this.sequenceSettingsService.FindSequenceByModelName(
        modelName,
      );

      const newPartNumber = this.sequenceSettingsService.sequenceSettingEx(
        settings,
      );

      await this.sequenceSettingsService.updateSequenceByModelName(
        modelName,
        settings,
      );

      const productPayload = {
        partNumber: newPartNumber,
        description: salesOrderItemsDto.description,
        bom: salesOrderItemsDto.bom,
        listPrice: 0,
      };

      const response = new this.productModel(productPayload);

      const newProduct = await response.save();

      const stockLocation = await this.stockLocationService.getStockByName(
        'incoming bay',
      );

      if (!stockLocation) {
        throw new NotFoundException(
          'Stock Location name not found, kindly insert incoming bay',
        );
      }

      const skuPayload: CreateSkusDto = {
        quantity: 0, // salesOrderItemsDto.qty,
        product: newProduct._id,
        location: stockLocation._id,
        remarks: undefined,
        unitCost: totalUnitCost,
      };

      await this.skusService.createSku(skuPayload);

      // return Product
      return newProduct;
    }
    // else {
    //   console.log('PRODUCT EXISTED, update product only');
    //   product.description = salesOrderItemsDto.description;
    //   product.listPrice = salesOrderItemsDto.unitPrice;
    //   product.bom = salesOrderItemsDto.bom;

    //   return await product.save();
    // }
  }

  async updateProductCost(id: string) {
    //get all the skus
    const skuFound = await this.skusService.findSkuBelongsToProduct(id);
    let totalCost = 0;
    let totalQty = 0;
    skuFound.forEach((sku) => {
      totalCost += sku.unitCost * sku.quantity;
      totalQty += sku.quantity;
    });
    if (totalQty > 0 && totalCost > 0) {
      const uCost = totalCost / totalQty;
      await this.productModel.updateOne(
        { _id: id },
        {
          unitCost: uCost,
        },
      );
    }
  }

  async findAllQty(id: string): Promise<number> {
    const skuFound = await this.skusService.findSkuBelongsToProduct(id);
    let totalQty = 0;
    skuFound.forEach((sku) => {
      totalQty += sku.quantity;
    });
    return totalQty;
  }

  async findAllToExportCSV() {
    const products = await this.productModel
      .find()
      .lean()
      .populate([
        'brand',
        'grpOne',
        'grpTwo',
        'size',
        'material',
        'uom',
        'supp1',
        'supp2',
        'supp3',
        'supp4',
        'supp5',
        'currency',
        'bom',
      ]);

    if (products.length > 0) {
      for (const product of products) {
        const skuFound = await this.skusService.findSkuBelongsToProduct(
          product._id,
        );

        product.skus = skuFound;
      }

      return products;
    }
  }
}
