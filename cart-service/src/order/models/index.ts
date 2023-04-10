import { CartItem } from '../../cart/models';

enum CartStatus {
  OPEN = 'OPEN',
  ORDERED = 'ORDERED',
}

export type Order = {
  id?: string;
  userId: string;
  cartId: string;
  items: CartItem[];
  payment: {
    type: string;
    address?: any;
    creditCard?: any;
  };
  delivery: {
    type: string;
    address: any;
  };
  comments: string;
  status: CartStatus;
  total: number;
};
