import React from 'react';
import './Play.css';

const Play = ({targetOnFocus}) => 
  <div id="play-button" className={targetOnFocus ? "" : "focus"} >
    <img src="imgs/play-btn.png" alt="play" id="play-btn"/>
  </div>

export default Play;