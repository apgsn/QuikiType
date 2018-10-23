import React from 'react';
import './Settings.css';

const Settings = (props) =>
  <div id="settings-panel" tabIndex="1" >{
    props.settingsOptions.map(key => 
      <div id={key.name}>
        <label htmlFor={"label-" + key.name} key={"label-" + key.name} 
          className="option-checkbox" onBlur={props.toggleSettings}>
          <input id={"input-" + key.name} type="checkbox" name={"input-" + key.name}
            defaultChecked={key.val} onChange={props.onCheckboxChange} />{key.label}
          <span className="checkmark" />
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