import React from 'react';
import './Settings.css';

const Settings = (props) =>
  <div id="settings-panel" tabIndex="1" className={props.showSettings ? "visible" : ""}>{
    props.settingsOptions.map((key, index) => 
      <div id={"option-" + index + "-" + key.name} key={"div-opt-" + index}>
        <label htmlFor={key.name} key={"label-opt-" + index} 
          className="option-checkbox" onBlur={props.toggleSettings}>
          <input id={key.name} type="checkbox" name={key.name} key={"input-opt-" + index}
            defaultChecked={key.val} onChange={props.onCheckboxChange} />{key.label}
          <span className="checkmark" key={"span-opt-" + index} />
          <br />
        </label>
      </div>
      )}
    <div id="wiki-link">Read it on Wikipedia:&nbsp;
      <a href={"https://en.wikipedia.org/wiki/" + props.title} alt={props.title}
        target="_blank" onBlur={props.toggleSettings} >{props.title}</a>
    </div>
  </div>

export default Settings;