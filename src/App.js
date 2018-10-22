// QuikiType
import React, { Component } from 'react';
import './App.css';
import removeDiacritics from './diacritics.js';
const WIKI_ENDPOINT = "https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*";
const WIKI_PREFIXSEARCH_QUERY = "&list=search&srlimit=200&srnamespace=0&srsearch=";
const WIKI_CONTENT_QUERY = "&prop=extracts&list=&exlimit=max&exintro=1&explaintext=1&exsectionformat=plain&exsentences=3&pageids="; // exchars=20
const Y_OFFSET = 100;

const AppTitle = () => <React.Fragment>
    <h1 id="app-title-1">QuikiType!</h1>
    <h3 id="app-title-2">quick Wikipedia snippets for typists</h3>
  </React.Fragment>

const Title = ({title, fetching}) => <div id="title">{fetching ? " " : title}</div>

const Play = () => 
  <div id="play-button">
    <img src="imgs/play-btn.png" alt="play" id="play-btn" />
  </div>

const Settings = ({toggleSettings, settingsOptions, handleCheckbox, title}) =>
  <div id="settings-panel" tabIndex="1" >{
    settingsOptions.map(key => 
      <div id={key.name + "-label"}>
        <label htmlFor={key.name} key={key.name} className="option-checkbox" onBlur={toggleSettings}>
          <input id={key.name} type="checkbox" name={key.name} defaultChecked={key.val} onChange={handleCheckbox} />{key.label}
          <span class="checkmark" />
          <br />
        </label>
      </div>
      )}
    <div id="wiki-link">Read it on Wikipedia:&nbsp;
      <a href={"https://en.wikipedia.org/wiki/" + title} alt={title} target="_blank" onBlur={toggleSettings} >{title}</a>
    </div>
  </div>

const Target = ({target, title, tempTypingErr, cursorPos, fetching, toggleSettings, settingsOptions, handleCheckbox}) => 
  <React.Fragment>
    <Settings toggleSettings={toggleSettings} settingsOptions={settingsOptions} handleCheckbox={handleCheckbox} title={title} />
    <div id="container" tabIndex="0">
      <Title title={title} fetching={fetching} />
      <div id="target">
        {fetching ? "Fetching..." : target.split('').map((i, index) => 
          <span key={index} id={"ch-" + index} className={"char "
            + (index < cursorPos ? "correct " : "")
            + (tempTypingErr.indexOf(index) !== -1 ? "error " : "")
            + (index === cursorPos ? "cursor " : "")
          }>{i}</span>
      )}</div>
    </div>
  </React.Fragment>;

const Accuracy = ({keyStrokes, totalTypingErr, timer, wpm}) => 
  keyStrokes.length > 0 && (
  <div id="accuracy">
    <div id="errors" className="accuracy-stat">Errors:&nbsp;{(totalTypingErr.length*100/keyStrokes.length).toFixed(2)}%</div>
    <div id="time" className="accuracy-stat">Clock:&nbsp;{
      Math.floor(timer/60) + ":" + (timer%60 < 10 ? "0" : "") + timer%60
      }</div>
    <div id="wpm" className="accuracy-stat">WPM:&nbsp;{wpm}</div>
  </div>)

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

class App extends Component {
  constructor(props){
    super(props);
    this.state = {
      category: "Touch Typing",
      target: "",
      title: "",
      targetOnFocus: false,
      wikiExtracts : [],
      prevWikiExtracts: [],
      articleIterator : 0,
      keyStrokes: "",
      tempTypingErr : [],
      totalTypingErr: [],
      correctyTypedChars: 0,
      cursorPos: 0,
      runningTimer: false,
      timer : -1,
      wpm: 0,
      sentencesCompleted: 0,
      fetching: false,
      wikiIdList : [],
      wikiIdSelectionList : [],
      showSettings: false,
      settingsOptions : [{
          name: "ignoreCase",
          label : "Ignore letter case",
          val: true
        }, {
          name: "ignoreSpecial",
          label : "Ignore diacritics & special characters (spacebar to skip)",
          val: true
        },
      ],
      rowOffset : Y_OFFSET,
      readyToRollAgain : true,
      lastPosY: 0
    };
  }

  componentDidMount(){
    document.getElementById("target").style.top = "100px";
    document.getElementById("title").style.top = "40px";
    document.getElementById("container").addEventListener("keydown", this.handleKeyPress);
    document.getElementById("container").addEventListener("keydown", () => { if(this.state.timer < 0) this.manageTimer()});
    document.getElementById("container").addEventListener("focus", this.changeFocus);
    document.getElementById("container").addEventListener("blur", this.changeFocus);
    document.getElementById("settings-panel").addEventListener("blur", this.asyncFocusCheck);
    this.fetchArticles();
  }

  componentDidUpdate(prevProps, prevState) {
    if(this.state.articleIterator > prevState.articleIterator) {
      this.refreshContainer();
    }
    if(this.state.showSettings !== prevState.showSettings) {
      this.toggleSettings();
    }
  }

  pickNextArticle = () => {
    if(!this.state.fetching)
      this.setState({articleIterator : this.state.articleIterator + 1});
  }
  
  refreshContainer = () => {
    this.reset();
    this.chooseArticle();
    let chars = document.getElementsByClassName("char");
    for(let i = 0; i < chars.length; i++)
      chars[i].removeAttribute("style"); 
  }

  onSearchSubmit = (e) => {
    e.preventDefault();
    this.reset();
    this.setState({category : document.getElementById("search-field").value}, this.fetchArticles);
  }



  asyncFocusCheck = () => {
    function wait() {
      var promise = new Promise(function(resolve, reject) {
        window.setTimeout(function() {
          resolve(document.activeElement);
        }, 1);
      });
      return promise;
    }
    
    wait().then((elm) => {
      console.log(elm);
      if(!document.getElementById("settings-panel").contains(elm) && elm != document.getElementById("settings")){
        this.toggleSettingsStatus();
      } 
    });
  }


  toggleSettingsStatus = () => {
    this.setState({showSettings : !this.state.showSettings});
  }
  toggleSettings = () => {
    if(this.state.showSettings){
      document.getElementById("settings-panel").focus();
      document.getElementById("settings-panel").style.height = "250px";
    }
    else document.getElementById("settings-panel").style.height = 0;
  }


  changeFocus = () => {
    if(this.state.targetOnFocus){ // window is blurring
      document.getElementById("container").style.opacity = .3;
      document.getElementById("play-button").style.opacity = 1;
      if(document.getElementsByClassName("cursor").length)
        document.getElementsByClassName("cursor")[0].style.borderBottom = "0px";
    } else {  // window is getting focus
      document.getElementById("container").style.opacity = 1;
      document.getElementById("play-button").style.opacity = 0;
      if(document.getElementsByClassName("cursor").length)
        document.getElementsByClassName("cursor")[0].style.borderBottom = "4px solid black";
    }
    this.setState({targetOnFocus : !this.state.targetOnFocus});
  }

  changeFetchingStatus = () => {
    let f = String(Number(!this.state.fetching));
    document.getElementById("wiki-globe").style.transform = "scale(" + f + ")";
    this.setState({fetching : !this.state.fetching});
  }

  manageTimer = () => {
    const S = 1000; // 1 second timeframe (1000 ms)
    this.setState({timer : 0});
    let start = Number(new Date());
    this.clock = setInterval(() => {
      let now = Number(new Date());
      let deltaErr = Math.abs((now - start) % S);
      deltaErr -= deltaErr > S / 2 ? S : 0;
      start += deltaErr;
      if(this.state.targetOnFocus)
        this.setState({timer : (now - start) / S});
      else start += S;
      this.calcWPM();
    }, S);
  }

  handleCheckbox = (e) => {
    let newOptions = [];
    let idx = this.state.settingsOptions.findIndex(i => i.name === e.target.name);
    for(let i = 0; i < this.state.settingsOptions.length; i++){
      newOptions.push(this.state.settingsOptions[i]);
      if(i === idx)
        newOptions[i].val = !newOptions[i].val;
    }
    this.setState({settingsOptions : newOptions});
    console.log(this.state.settingsOptions);
  }

  searchError = () => {
    document.getElementById("search-field").style.animation = "alarming .3s ease-in-out 2";
    setTimeout(() => document.getElementById("search-field").removeAttribute("style"), 600);
  }

  fetchArticles = () => {
    if(!this.state.fetching){
      this.setState({articleIterator : 0});
      this.changeFetchingStatus();
      this.setState({
        wikiExtracts : [], wikiIdSelectionList: [],
        prevWikiExtracts: this.state.wikiExtracts       
      });
      fetch(WIKI_ENDPOINT + WIKI_PREFIXSEARCH_QUERY + this.state.category)
        .then(response => response.json())
        .then(result => {console.log(result); this.setState({wikiIdList : result.query.search.map(key => key.pageid)})})
        .then(this.fetchExtracts)
        .catch(error => {
          this.searchError();
          this.changeFetchingStatus();        
          console.log("Error: " + error);
        });
    }
  }

  fetchExtracts = () => {
    const {wikiIdList} = this.state;
    console.log(wikiIdList);
    if(!wikiIdList.length){
      console.log("no match!");
      this.setState({wikiExtracts: this.state.prevWikiExtracts});
      this.searchError();
      this.changeFetchingStatus();
      document.getElementsByClassName("cursor")[0].style.borderBottom = "0px";
    } else {
      document.getElementById("app-title-1").style.animation = "spinTitle .5s ease-out";
      setTimeout(() => document.getElementById("app-title-1").removeAttribute("style"), 500);
      this.setState({wikiIdSelectionList : [wikiIdList[0]]}); // first match = best match 
      for(let i = 1; i < 20 && i < wikiIdList.length; i++){ // then eventually add other results
        let rng = 0;
        do {
          rng = Math.floor(Math.random() * wikiIdList.length);
        } while(this.state.wikiIdSelectionList.includes(wikiIdList[rng]));
        this.setState({wikiIdSelectionList : [...this.state.wikiIdSelectionList, wikiIdList[rng]]});
      }
      console.log(this.state.wikiIdSelectionList.join(" "));
      fetch(WIKI_ENDPOINT + WIKI_CONTENT_QUERY + this.state.wikiIdSelectionList.join("%7C"))
        .then(response => response.json())
        .then(result => {
            this.setState({wikiExtracts : Object.keys(result.query.pages).map(q => {
              return {
              id: result.query.pages[q].pageid,
              title: result.query.pages[q].title,
              quote: result.query.pages[q].extract }
            }).filter(q => q.quote.length > 3)
          });
          for(let key in Object.keys(result.query.pages)){
            if(this.state.wikiExtracts[key].id === wikiIdList[0]){
              [this.state.wikiExtracts[key], this.state.wikiExtracts[0]] =
              [this.state.wikiExtracts[0], this.state.wikiExtracts[key]];
              break;
            }
          }
          console.log(this.state.wikiExtracts);
          this.chooseArticle();
        })
        .catch(error => console.log("Error: " + error));
    }
  }

  chooseArticle = () => {
    if(!this.state.fetching && this.state.wikiExtracts.length && (this.state.articleIterator === this.state.wikiExtracts.length)){
      document.getElementById("container").blur();
      this.fetchArticles();
    } else {
      document.getElementById("container").focus();
      if(this.state.fetching)
        this.changeFetchingStatus();
      this.setState({
        target : this.state.wikiExtracts[this.state.articleIterator].quote,
        title : this.state.wikiExtracts[this.state.articleIterator].title
      });
    }
  }

  calcWPM = () => {
    const STANDARD_WORD_LENGTH = 5;
    const {correctyTypedChars, timer} = this.state;
    this.setState({wpm : Math.round((correctyTypedChars / STANDARD_WORD_LENGTH) * (60 / timer))});
  }
  checkCase = (key, target) => {  // TODO: merge in universal foo to handle settingsOptions
    let isTicked = this.state.settingsOptions.filter(i => i.name === "ignoreCase")[0].val;
    return isTicked && key.toLowerCase() === target.toLowerCase();
  }
  checkSpecial = (key, target) => {
    let isTicked = this.state.settingsOptions.filter(i => i.name === "ignoreSpecial")[0].val;
    return isTicked && (key === removeDiacritics(target) || (key === " " && /[^\w]/.test(target)));    
  }
  reset = () => {
    this.setState({
      cursorPos : 0, 
      rowOffset : Y_OFFSET,
      tempTypingErr : []
    });
    document.getElementById("target").style.top = "100px";
    document.getElementById("title").style.top = "40px";
  }

  handleKeyPress = (e) => {
    const {keyStrokes, target, cursorPos, tempTypingErr, totalTypingErr, correctyTypedChars, lastPosY} = this.state;
    if(this.state.fetching) return;
    if(e.key === "'" || e.key === "/" || e.key === " ") e.preventDefault();  // prevent quick-search in Firefox
    if(e.key.length === 1){ // if it's a single char...
      this.setState({keyStrokes : keyStrokes + e.key});
      let match = e.key === target[cursorPos] || 
        this.checkCase(e.key, target[cursorPos]) ||
        this.checkSpecial(e.key, target[cursorPos]);
      if(match){  // if char is correct, move cursor
        document.getElementsByClassName("cursor")[0].removeAttribute("style");         
        this.setState({
          cursorPos : cursorPos + 1,
          correctyTypedChars : correctyTypedChars + 1
        }); 
        if(this.state.cursorPos === target.length){   // if the string is over, fetch a new quote and roll back
          this.pickNextArticle();
          this.setState({articleIterator : this.state.articleIterator + 1});
          return;
        }
      } else { // if char is wrong, count error
        this.setState({
          totalTypingErr : [...totalTypingErr, cursorPos],
          tempTypingErr : [...tempTypingErr, cursorPos]});
        console.log(this.state.tempTypingErr);
      };
      

      //handle row shift
      let yP = document.getElementsByClassName("cursor")[0].getBoundingClientRect().top;
      const yC = document.getElementById("container").getBoundingClientRect().top; // 119.5
      this.setState({lastPosY : yP});
      // console.log(yP + " - " + yC + " cursorPos: " + this.state.cursorPos);
      if(Math.abs(lastPosY - yP) < 1){
        this.setState({readyToRollAgain : true});
      }
      if(this.state.cursorPos && this.state.readyToRollAgain && (Math.abs(lastPosY - yP) > 45)) {
        this.setState({
          rowOffset : (yP - yC) - 106.5,
          readyToRollAgain: false
        });  
        document.getElementById("target").style.top = String(
          parseInt(document.getElementById("target").style.top, 10) - this.state.rowOffset) + "px";
        document.getElementById("title").style.top = String(
          parseInt(document.getElementById("title").style.top, 10) - this.state.rowOffset) + "px";      
      };
    }
  }

  render() {
    const {target, keyStrokes, cursorPos, tempTypingErr, totalTypingErr, timer, wpm, settingsOptions, showSettings, fetching, title} = this.state;
    return (
      <div className="App">
        <AppTitle />
        <TopBar onSearchSubmit={this.onSearchSubmit} pickNextArticle={this.pickNextArticle} toggleSettings={this.toggleSettingsStatus}/>
        <Play />
        <Target target={target} title={title} tempTypingErr={tempTypingErr} 
        cursorPos={cursorPos} fetching={fetching} toggleSettings={this.asyncFocusCheck}
        settingsOptions={settingsOptions} handleCheckbox={this.handleCheckbox} />
        <Accuracy keyStrokes={keyStrokes} totalTypingErr={totalTypingErr} timer={timer} wpm={wpm} />
      </div>
    );
  }
}

export default App;
