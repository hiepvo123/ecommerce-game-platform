import React from 'react';
import { useParams } from 'react-router-dom';

const GameDetail = () => {
  const { appId } = useParams();

  return (
    <div>
      <h1>Game Detail Page</h1>
      <p>App ID: {appId}</p>
    </div>
  );
};

export default GameDetail;
