import React from 'react';
import { useWishlist } from '../context/WishlistContext';

const Wishlist = () => {
  const { wishlist, loading } = useWishlist();

  return (
    <div>
      <h1>Wishlist Page</h1>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div>
          {wishlist.length === 0 ? (
            <p>Your wishlist is empty</p>
          ) : (
            <ul>
              {wishlist.map((item) => (
                <li key={item.appId}>{item.appId}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default Wishlist;
