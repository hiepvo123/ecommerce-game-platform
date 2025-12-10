import React from 'react';
import { useCart } from '../context/CartContext';

const Cart = () => {
  const { cart, loading } = useCart();

  return (
    <div>
      <h1>Cart Page</h1>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div>
          {cart.length === 0 ? (
            <p>Your cart is empty</p>
          ) : (
            <ul>
              {cart.map((item) => (
                <li key={item.appId}>{item.appId}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default Cart;
