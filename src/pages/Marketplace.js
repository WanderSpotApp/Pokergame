import React, { useState } from 'react';
import NFTCard from '../components/NFTCard';
import './Marketplace.css';

function Marketplace() {
  const [filter, setFilter] = useState('all');
  
  // Placeholder data - replace with actual NFT data from XRPL
  const nfts = [
    {
      id: 1,
      title: "Digital Art #1",
      price: "100 XRP",
      image: "https://placeholder.com/150",
      creator: "Artist1"
    },
    // Add more NFTs...
  ];

  return (
    <div className="marketplace">
      <div className="marketplace-header">
        <h1>NFT Marketplace</h1>
        <div className="filters">
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All NFTs</option>
            <option value="art">Art</option>
            <option value="collectibles">Collectibles</option>
            <option value="music">Music</option>
          </select>
        </div>
      </div>
      
      <div className="nft-grid">
        {nfts.map(nft => (
          <NFTCard key={nft.id} nft={nft} />
        ))}
      </div>
    </div>
  );
}

export default Marketplace; 