import React from 'react';
import { Link } from 'react-router-dom';
import './NFTCard.css';

function NFTCard({ nft }) {
  return (
    <Link to={`/nft/${nft.id}`} className="nft-card">
      <div className="nft-image">
        <img src={nft.image} alt={nft.title} />
      </div>
      <div className="nft-info">
        <h3>{nft.title}</h3>
        <p className="creator">By {nft.creator}</p>
        <p className="price">{nft.price}</p>
      </div>
    </Link>
  );
}

export default NFTCard; 