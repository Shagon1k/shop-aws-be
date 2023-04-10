import {
  Controller,
  Get,
  Delete,
  Put,
  Body,
  Req,
  Post,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';

import { BasicAuthGuard } from '../auth';
import { OrderService } from '../order';
import { AppRequest, getUserIdFromRequest } from '../shared';

import { calculateCartTotal } from './models-rules';
import { CartService } from './services';

import { CartItemUpdate } from './models';

const validateBodyItems = (items: CartItemUpdate[]) => {
  return items?.every(({ count, productId }) => {
    const isValidCartItem =
      Number.isFinite(count) && typeof productId === 'string';

    return isValidCartItem;
  });
};

@Controller('api/profile/cart')
export class CartController {
  constructor(
    private cartService: CartService,
    private orderService: OrderService,
  ) {}

  @UseGuards(BasicAuthGuard)
  @Get()
  async findUserCart(@Req() req: AppRequest) {
    const cartId = req.query.id as string || ''
    const cart = await this.cartService.findOrCreateByUserId(
      getUserIdFromRequest(req),
      cartId
    );

    return {
      statusCode: HttpStatus.OK,
      message: 'OK',
      data: { cart, total: calculateCartTotal(cart) },
    };
  }

  @UseGuards(BasicAuthGuard)
  @Put()
  async updateUserCart(@Req() req: AppRequest, @Body() body) {
    const isItemsValid = validateBodyItems(body.items);

    if (isItemsValid) {
      const cart = await this.cartService.updateByUserId(
        getUserIdFromRequest(req),
        body,
      );

      return {
        statusCode: HttpStatus.OK,
        message: 'OK',
        data: {
          cart,
          total: calculateCartTotal(cart),
        },
      };
    } else {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Invalid items passed.',
      };
    }
  }

  @UseGuards(BasicAuthGuard)
  @Delete()
  async clearUserCart(@Req() req: AppRequest) {
    await this.cartService.removeByUserId(getUserIdFromRequest(req));

    return {
      statusCode: HttpStatus.OK,
      message: 'OK',
    };
  }

  @UseGuards(BasicAuthGuard)
  @Post('checkout')
  async checkout(@Req() req: AppRequest, @Body() body) {
    const userId = getUserIdFromRequest(req);
    const cart = await this.cartService.findByUserId(userId);
    const {
      payment = { type: 'Dummy payment type' },
      delivery = { type: 'Dummy delivery type', address: 'Dummy address' },
      comments = 'Dummy Comment',
    } = body;

    if (!(cart && cart.items.length)) {
      const statusCode = HttpStatus.BAD_REQUEST;
      req.statusCode = statusCode;

      return {
        statusCode,
        message: 'Cart is empty',
      };
    }

    const { id: cartId } = cart;
    const total = calculateCartTotal(cart);
    const order = await this.orderService.create({
      userId,
      cartId,
      total,
      payment,
      delivery,
      comments,
    });

    return {
      statusCode: HttpStatus.OK,
      message: 'OK',
      data: { order },
    };
  }
}
