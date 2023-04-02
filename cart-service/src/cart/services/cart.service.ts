import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Cart, CartStatus } from '../../database/entities/cart.entity';
import { CartItem } from '../../database/entities/cart-item.entity';
import { Product } from '../../database/entities/product.entity';

import { Cart as ICart, CartUpdate as ICartUpdate } from '../models';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart)
    private readonly cartRepository: Repository<Cart>,
    @InjectRepository(CartItem)
    private readonly cartItemRepository: Repository<CartItem>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async findByUserId(userId: string): Promise<ICart> {
    const userCart = await this.cartRepository.findOne({
      where: { userId: userId },
    });

    return userCart;
  }

  async createByUserId(userId: string) {
    const cart = new Cart();
    cart.userId = userId;
    cart.createdAt = new Date();
    cart.updatedAt = new Date();
    cart.status = CartStatus.OPEN;

    return this.cartRepository.save(cart);
  }

  async findOrCreateByUserId(userId: string): Promise<ICart> {
    const userCart = await this.cartRepository.findOne({
      where: { userId: userId },
    });
    const cartItems = await this.cartItemRepository.find({
      where: { cartId: userCart?.id },
      relations: ['product'],
    });

    if (userCart) {
      return {
        ...userCart,
        items: cartItems,
      };
    }

    return this.createByUserId(userId);
  }

  async updateByUserId(userId: string, { items }: ICartUpdate): Promise<ICart> {
    const { id: cartId } = await this.findOrCreateByUserId(userId);

    await Promise.all(
      items.map(async item => {
        let cartItem = await this.cartItemRepository.findOne({
          where: { cartId: cartId, productId: item.productId },
        });

        if (!cartItem) {
          const product = await this.productRepository.findOne(item.productId);
          cartItem = new CartItem();
          cartItem.cart = { id: cartId } as Cart;
          cartItem.product = product;
        }

        cartItem.count = item.count;

        await this.cartItemRepository.save(cartItem);
      }),
    );

    const updatedItems = await this.cartItemRepository.find({
      where: { cartId: cartId },
      relations: ['product'],
    });

    return { id: cartId, items: updatedItems };
  }

  async removeByUserId(userId): Promise<void> {
    const userCart = await this.cartRepository.findOne({
      where: { userId: userId },
    });

    await this.cartItemRepository.delete({ cart: userCart });
    await this.cartRepository.remove(userCart);
  }
}
