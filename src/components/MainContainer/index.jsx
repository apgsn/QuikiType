import React from 'react';
import Settings from "../Settings";
import './MainContainer.css';

const MainContainer = (props) => {
    const {toggleSettings, settingsOptions, onCheckboxChange, title, fetching,
      cursorPos, target, tempTypingErr} = props;
    return(
      <React.Fragment>
        <Settings toggleSettings={toggleSettings} settingsOptions={settingsOptions}
          onCheckboxChange={onCheckboxChange} title={title} />
        <div id="container" tabIndex="0">
          <div id="title">{fetching ? " " : title}</div>
          <div id="target">
            {fetching ? "Fetching..." : target.split('').map((i, index) => 
              <span id={"ch-" + index} key={"ch-" + index} className={"char "
                + (index < cursorPos ? "correct " : "")
                + (tempTypingErr.indexOf(index) !== -1 ? "error " : "")
                + (index === cursorPos ? "cursor " : "")
              }>{i}</span>
          )}</div>
        </div>
      </React.Fragment>
    );
  }

export default MainContainer;