import { create } from 'zustand';
import { socketService } from '@/services/socket.service';

// Helper function to generate order number
const generateOrderNumber = (): string => {
  const timestamp = Date.now().toString().slice(-4);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${timestamp}${random}`;
};

export interface CartItem {
  id: string;
  productId: string;
  productName: string;
  variantId?: string;
  variantName?: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  tax: number;
  total: number;
  modifiers?: any[];
  notes?: string;
}

interface CartState {
  items: CartItem[];
  customerId: string | null;
  customerName: string | null;
  discount: number;
  tax: number;
  subtotal: number;
  total: number;
  userId: string | null;
  isPaid: boolean;
  orderCreated: boolean;
  orderNumber: string | null;
  addItem: (item: Omit<CartItem, 'total'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  clearCartAndStorage: () => void;
  setCustomer: (customerId: string, customerName: string) => void;
  setDiscount: (discount: number) => void;
  setTax: (tax: number) => void;
  calculateTotals: () => void;
  setCartFromSocket: (cartData: any) => void;
  setUserId: (userId: string) => void;
  setPaymentStatus: (isPaid: boolean) => void;
  setOrderCreated: (orderCreated: boolean, orderNumber?: string) => void;
}

export const useCartStore = create<CartState>()((set, get) => ({
  items: [],
  customerId: null,
  customerName: null,
  discount: 0,
  tax: 0,
  subtotal: 0,
  total: 0,
  userId: null,
  isPaid: false,
  orderCreated: false,
  orderNumber: null,

      addItem: (item) => {
        const items = get().items;
        const existingItemIndex = items.findIndex(
          (i) => i.productId === item.productId && i.variantId === item.variantId
        );

        let newItems;
        if (existingItemIndex >= 0) {
          const existingItem = items[existingItemIndex];
          const newQuantity = existingItem.quantity + item.quantity;
          const newTax = item.tax * newQuantity;
          newItems = items.map((i, index) =>
            index === existingItemIndex
              ? { ...i, quantity: newQuantity, total: i.unitPrice * newQuantity, tax: newTax }
              : i
          );
        } else {
          newItems = [...items, { ...item, total: item.unitPrice * item.quantity, tax: item.tax * item.quantity }];
        }

        set({ items: newItems });
        get().calculateTotals();
        
        // Broadcast cart update via Socket.io with userId
        const currentState = get();
        socketService.emitCartUpdate({
          userId: currentState.userId,
          items: currentState.items,
          customerId: currentState.customerId,
          customerName: currentState.customerName,
          discount: currentState.discount,
          tax: currentState.tax,
          subtotal: currentState.subtotal,
          total: currentState.total,
          isPaid: currentState.isPaid,
          orderCreated: currentState.orderCreated,
          orderNumber: currentState.orderNumber
        });
      },

      removeItem: (id) => {
        set({ items: get().items.filter((item) => item.id !== id) });
        get().calculateTotals();
        
        // Broadcast cart update via Socket.io with userId
        const currentState = get();
        socketService.emitCartUpdate({
          userId: currentState.userId,
          items: currentState.items,
          customerId: currentState.customerId,
          customerName: currentState.customerName,
          discount: currentState.discount,
          tax: currentState.tax,
          subtotal: currentState.subtotal,
          total: currentState.total,
          isPaid: currentState.isPaid,
          orderCreated: currentState.orderCreated,
          orderNumber: currentState.orderNumber
        });
      },

      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(id);
          return;
        }

        set({
          items: get().items.map((item) =>
            item.id === id
              ? { ...item, quantity, total: item.unitPrice * quantity, tax: (item.tax / (item.quantity || 1)) * quantity }
              : item
          ),
        });
        get().calculateTotals();
        
        // Broadcast cart update via Socket.io with userId
        const currentState = get();
        socketService.emitCartUpdate({
          userId: currentState.userId,
          items: currentState.items,
          customerId: currentState.customerId,
          customerName: currentState.customerName,
          discount: currentState.discount,
          tax: currentState.tax,
          subtotal: currentState.subtotal,
          total: currentState.total,
          isPaid: currentState.isPaid,
          orderCreated: currentState.orderCreated,
          orderNumber: currentState.orderNumber
        });
      },

      clearCart: () => {
        set({
          items: [],
          customerId: null,
          customerName: null,
          discount: 0,
          tax: 0,
          subtotal: 0,
          total: 0,
          isPaid: false,
          orderCreated: false,
          orderNumber: null,
        });
        
        // Broadcast cart update via Socket.io with userId
        const currentState = get();
        socketService.emitCartUpdate({
          userId: currentState.userId,
          items: [],
          customerId: null,
          customerName: null,
          discount: 0,
          tax: 0,
          subtotal: 0,
          total: 0,
          isPaid: false,
          orderCreated: false,
          orderNumber: null
        });
      },

      clearCartAndStorage: () => {
        set({
          items: [],
          customerId: null,
          customerName: null,
          discount: 0,
          tax: 0,
          subtotal: 0,
          total: 0,
          isPaid: false,
          orderCreated: false,
          orderNumber: null,
        });
        
        // Broadcast cart update via Socket.io with userId
        const currentState = get();
        socketService.emitCartUpdate({
          userId: currentState.userId,
          items: [],
          customerId: null,
          customerName: null,
          discount: 0,
          tax: 0,
          subtotal: 0,
          total: 0,
          isPaid: false,
          orderCreated: false,
          orderNumber: null
        });
      },

      setCartFromSocket: (cartData: any) => {
        set({
          items: cartData.items || [],
          customerId: cartData.customerId || null,
          customerName: cartData.customerName || null,
          discount: cartData.discount || 0,
          tax: cartData.tax || 0,
          subtotal: cartData.subtotal || 0,
          total: cartData.total || 0,
          isPaid: cartData.isPaid || false,
          orderCreated: cartData.orderCreated || false,
          orderNumber: cartData.orderNumber || null,
        });
      },

      setUserId: (userId: string) => {
        set({ userId });
      },

      setPaymentStatus: (isPaid: boolean) => {
        set({ isPaid });
        
        // Broadcast payment status via Socket.io
        const currentState = get();
        socketService.emitCartUpdate({
          userId: currentState.userId,
          items: currentState.items,
          customerId: currentState.customerId,
          customerName: currentState.customerName,
          discount: currentState.discount,
          tax: currentState.tax,
          subtotal: currentState.subtotal,
          total: currentState.total,
          isPaid: isPaid,
          orderCreated: currentState.orderCreated,
          orderNumber: currentState.orderNumber
        });
      },

      setOrderCreated: (orderCreated: boolean, orderNumber?: string) => {
        const generatedOrderNumber = orderNumber || generateOrderNumber();
        set({ orderCreated, orderNumber: generatedOrderNumber });
        
        // Broadcast order creation via Socket.io
        const currentState = get();
        socketService.emitCartUpdate({
          userId: currentState.userId,
          items: currentState.items,
          customerId: currentState.customerId,
          customerName: currentState.customerName,
          discount: currentState.discount,
          tax: currentState.tax,
          subtotal: currentState.subtotal,
          total: currentState.total,
          isPaid: currentState.isPaid,
          orderCreated: orderCreated,
          orderNumber: generatedOrderNumber
        });
      },

      setCustomer: (customerId, customerName) => {
        set({ customerId, customerName });
        
        // Broadcast cart update via Socket.io with userId
        const currentState = get();
        socketService.emitCartUpdate({
          userId: currentState.userId,
          items: currentState.items,
          customerId: currentState.customerId,
          customerName: currentState.customerName,
          discount: currentState.discount,
          tax: currentState.tax,
          subtotal: currentState.subtotal,
          total: currentState.total,
          isPaid: currentState.isPaid,
          orderCreated: currentState.orderCreated,
          orderNumber: currentState.orderNumber
        });
      },

      setDiscount: (discount) => {
        set({ discount });
        get().calculateTotals();
        
        // Broadcast cart update via Socket.io with userId
        const currentState = get();
        socketService.emitCartUpdate({
          userId: currentState.userId,
          items: currentState.items,
          customerId: currentState.customerId,
          customerName: currentState.customerName,
          discount: currentState.discount,
          tax: currentState.tax,
          subtotal: currentState.subtotal,
          total: currentState.total,
          isPaid: currentState.isPaid,
          orderCreated: currentState.orderCreated,
          orderNumber: currentState.orderNumber
        });
      },

      setTax: (tax) => {
        set({ tax });
        get().calculateTotals();
        
        // Broadcast cart update via Socket.io with userId
        const currentState = get();
        socketService.emitCartUpdate({
          userId: currentState.userId,
          items: currentState.items,
          customerId: currentState.customerId,
          customerName: currentState.customerName,
          discount: currentState.discount,
          tax: currentState.tax,
          subtotal: currentState.subtotal,
          total: currentState.total,
          isPaid: currentState.isPaid,
          orderCreated: currentState.orderCreated,
          orderNumber: currentState.orderNumber
        });
      },

      calculateTotals: () => {
        const items = get().items;
        const discount = get().discount;

        const subtotal = items.reduce((sum, item) => sum + item.total, 0);
        const tax = items.reduce((sum, item) => sum + item.tax, 0);
        const total = subtotal - discount + tax;

        set({ subtotal, tax, total });
      },
    })
);
