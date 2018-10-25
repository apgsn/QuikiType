import React from 'react';
import './Accuracy.css';

const Accuracy = ({keyStrokes, totalTypingErr, timer, correctyTypedChars}) => {
  const STANDARD_WORD_LENGTH = 5;
  const calcWPM = () => {
    let WPM = Math.round((correctyTypedChars / STANDARD_WORD_LENGTH) * (60 / timer));
    return WPM > 0 && WPM < Infinity? WPM : "-";
  };
  
  return keyStrokes.length > 0 && (
  <div id="accuracy">
    <div id="errors" className="accuracy-stat">Errors:&nbsp;
      {(totalTypingErr.length*100/keyStrokes.length).toFixed(2)}%
    </div>
    <div id="time" className="accuracy-stat">Clock:&nbsp;{
      Math.floor(timer/60) + ":" + (timer%60 < 10 ? "0" : "") + timer%60
      }</div>
    <div id="wpm" className="accuracy-stat">WPM:&nbsp;{calcWPM()}</div>
  </div>)
  }

export default Accuracy;