import { create } from 'zustand';
import { socketService } from '@/services/socket.service';

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
          total: currentState.total
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
          total: currentState.total
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
          total: currentState.total
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
          total: 0
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
          total: 0
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
        });
      },

      setUserId: (userId: string) => {
        set({ userId });
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
          total: currentState.total
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
          total: currentState.total
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
          total: currentState.total
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
