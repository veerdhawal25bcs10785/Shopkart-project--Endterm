import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  getCart,
  addToCart as apiAddToCart,
  updateCartQuantity as apiUpdateCartQuantity,
  removeFromCart as apiRemoveFromCart,
  clearCart as apiClearCart,
} from '../services/api';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Track individual item loading states (e.g. { [productId]: true })
  const [itemLoading, setItemLoading] = useState({});

  // Fetch cart from backend on mount or authentication change
  const refreshCart = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getCart();
      setCart(data.cart || []);
    } catch (err) {
      // 401 is normal for guests/unauthenticated users -> empty cart
      if (err.response?.status === 401) {
        setCart([]);
      } else {
        console.error('Failed to fetch cart:', err);
        setError(err.response?.data?.message || 'Unable to load your cart.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  // Add product to cart
  const addToCart = async (productId) => {
    setItemLoading((prev) => ({ ...prev, [productId]: true }));
    setError(null);
    try {
      const data = await apiAddToCart(productId);
      if (data.cart) {
        setCart(data.cart);
      }
      return { success: true, message: data.message || 'Product added to cart' };
    } catch (err) {
      console.error('Add to cart failed:', err);
      const message =
        err.response?.data?.message || 'Unable to add product to cart.';
      return { success: false, error: message, status: err.response?.status };
    } finally {
      setItemLoading((prev) => ({ ...prev, [productId]: false }));
    }
  };

  // Update item quantity
  const updateQuantity = async (productId, quantity) => {
    setItemLoading((prev) => ({ ...prev, [productId]: true }));
    setError(null);
    try {
      const data = await apiUpdateCartQuantity(productId, quantity);
      if (data.cart) {
        setCart(data.cart);
      }
      return { success: true, message: data.message };
    } catch (err) {
      console.error('Update quantity failed:', err);
      const message =
        err.response?.data?.message || 'Unable to update quantity.';
      return { success: false, error: message };
    } finally {
      setItemLoading((prev) => ({ ...prev, [productId]: false }));
    }
  };

  // Remove item from cart
  const removeFromCart = async (productId) => {
    setItemLoading((prev) => ({ ...prev, [productId]: true }));
    setError(null);
    try {
      const data = await apiRemoveFromCart(productId);
      if (data.cart) {
        setCart(data.cart);
      }
      return { success: true, message: data.message };
    } catch (err) {
      console.error('Remove from cart failed:', err);
      const message =
        err.response?.data?.message || 'Unable to remove item from cart.';
      return { success: false, error: message };
    } finally {
      setItemLoading((prev) => ({ ...prev, [productId]: false }));
    }
  };

  // Clear entire cart
  const clearCart = async () => {
    setLoading(true);
    try {
      await apiClearCart();
      setCart([]);
      return { success: true };
    } catch (err) {
      console.error('Clear cart failed:', err);
      return { success: false, error: 'Unable to clear cart.' };
    } finally {
      setLoading(false);
    }
  };

  // Derived Values (Section 15)
  // Total units across all cart items for Navbar count e.g. Cart (3)
  const totalUnits = cart.reduce(
    (sum, item) => sum + (Number(item.quantity) || 0),
    0
  );

  // Subtotal in Rupees = sum(price * quantity)
  const subtotal = cart.reduce((sum, item) => {
    const price = Number(item.product?.price) || 0;
    const qty = Number(item.quantity) || 0;
    return sum + price * qty;
  }, 0);

  // Total distinct product line items
  const totalItems = cart.length;

  // Helper checks
  const isInCart = (productId) => {
    return cart.some(
      (item) => item.product?._id?.toString() === productId?.toString()
    );
  };

  const getItemQuantity = (productId) => {
    const found = cart.find(
      (item) => item.product?._id?.toString() === productId?.toString()
    );
    return found ? found.quantity : 0;
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        cartItems: cart,
        loading,
        error,
        itemLoading,
        totalUnits,
        cartCount: totalUnits,
        subtotal,
        totalItems,
        refreshCart,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        isInCart,
        getItemQuantity,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export default CartContext;
