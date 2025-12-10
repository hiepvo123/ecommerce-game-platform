import React from 'react';
import { useAuth } from '../context/AuthContext';

const Profile = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>Profile Page</h1>
      {user && (
        <div>
          <p>Name: {user.firstName} {user.lastName}</p>
          <p>Email: {user.email}</p>
        </div>
      )}
    </div>
  );
};

export default Profile;
