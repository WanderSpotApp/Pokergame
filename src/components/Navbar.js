import React from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';

function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">XRPL NFT Market</Link>
      </div>
      <div className="navbar-menu">
        <Link to="/marketplace">Marketplace</Link>
        <Link to="/profile">Profile</Link>
        <button className="connect-wallet-btn">Connect Wallet</button>
      </div>
    </nav>
  );
}

export default Navbar; 