import React from 'react';
import './Accuracy.css';

const Accuracy = ({keyStrokes, totalTypingErr, timer, wpm}) => 
  keyStrokes.length > 0 && (
  <div id="accuracy">
    <div id="errors" className="accuracy-stat">Errors:&nbsp;
      {(totalTypingErr.length*100/keyStrokes.length).toFixed(2)}%
    </div>
    <div id="time" className="accuracy-stat">Clock:&nbsp;{
      Math.floor(timer/60) + ":" + (timer%60 < 10 ? "0" : "") + timer%60
      }</div>
    <div id="wpm" className="accuracy-stat">WPM:&nbsp;{wpm}</div>
  </div>)

export default Accuracy;