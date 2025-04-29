import React from 'react';
import './Marketplace.css';

const Marketplace = () => {
  // Sample NFT data - replace with your actual data
  const sampleNFTs = [
    {
      id: 1,
      title: "Abstract Art #1",
      price: 100,
      image: "https://picsum.photos/400/400?random=1"
    },
    {
      id: 2,
      title: "Digital Landscape #2",
      price: 150,
      image: "https://picsum.photos/400/400?random=2"
    },
    {
      id: 3,
      title: "Crypto Punk #3",
      price: 200,
      image: "https://picsum.photos/400/400?random=3"
    },
    // Add more sample NFTs as needed
  ];

  return (
    <div className="marketplace">
      <div className="marketplace-header">
        <h1 className="marketplace-title">NFT Marketplace</h1>
        <div className="filters">
          <select>
            <option value="">Sort By</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="recent">Recently Added</option>
          </select>
          <select>
            <option value="">Category</option>
            <option value="art">Art</option>
            <option value="collectibles">Collectibles</option>
            <option value="photography">Photography</option>
          </select>
        </div>
      </div>

      <div className="nft-grid">
        {sampleNFTs.map((nft) => (
          <div key={nft.id} className="nft-card">
            <img src={nft.image} alt={nft.title} className="nft-image" />
            <div className="nft-info">
              <h2 className="nft-title">{nft.title}</h2>
              <div className="nft-price">
                Price: <span className="nft-price-xrp">{nft.price} XRP</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Marketplace; 