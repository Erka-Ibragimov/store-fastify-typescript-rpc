interface User {
  id: string;
  name: string;
  carts: Cart[];
  orders: Order[];
}

interface Cart {
  id: string;
  productId: string;
  userId: string;
  count: number;
}

interface Order {
  userId: string;
  phoneNumber: string;
  address: string;
  // ...
}

interface OrderItem {
  productId: string;
  orderId: string;
  count: number;
}
