import React from 'react';
import './TopBar.css';
//import onSearchSubmit from './handleApi.js';

const TopBar = ({onSearchSubmit, pickNextArticle, toggleSettings}) => 
  <div id="top-bar">
    <div id="magnifying-glass">
      <img src="imgs/icon-magnifying.png" alt="Search" id="icon-magnifying" className="icon" />
    </div>
    <form id="search-form" onSubmit={onSearchSubmit} tabIndex="1">
      <input id="search-field" type="text"/>
    </form>
    <div id="wiki-globe">
      <img src="imgs/wikilogo.png" alt="Loading..." id="loading-image" />
    </div>
    <div id="topbar-left-options">
      <div id="refresh" tabIndex="2" onClick={pickNextArticle}>
        <img src="imgs/icon-refresh.png" alt="Pick another article" id="icon-refresh" className="icon" />
      </div>
      <div id="settings" tabIndex="3" onClick={toggleSettings}>
        <img src="imgs/icon-settings.png" alt="Settings" id="icon-settings" className="icon" />
      </div>
    </div>
  </div>

export default TopBar;