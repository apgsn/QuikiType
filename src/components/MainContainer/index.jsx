import React from 'react';
import Settings from "../Settings";
import './MainContainer.css';

const MainContainer = (props) => {
    const {toggleSettings, settingsOptions, onCheckboxChange, title, fetching,
      cursorPos, target, tempTypingErr, targetOnFocus, styles, showSettings} = props;
      return(
      <React.Fragment>
        <Settings toggleSettings={toggleSettings} settingsOptions={settingsOptions}
          onCheckboxChange={onCheckboxChange} showSettings={showSettings} title={title} />
        <div id="container" tabIndex="0" className={targetOnFocus ? "focus": ""}>
          <div id="title" style={{top : styles.title}}>{fetching ? " " : title}</div>
          <div id="target" style={{top : styles.target}}>
            {fetching ? "Fetching..." : target.split('').map((i, index) => 
              <span id={"ch-" + index} key={"ch-" + index} className={"char "
                + (index < cursorPos ? "correct " : "")
                + (tempTypingErr.indexOf(index) !== -1 ? "error " : "")
                + (index === cursorPos ? "cursor " + (targetOnFocus ? "" : "no-focus") : "")
              }>{i}</span>
          )}</div>
        </div>
      </React.Fragment>
    );
  }

export default MainContainer;