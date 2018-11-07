import React, { Component } from 'react';
import './App.css';

import removeDiacritics from './diacritics.js';
import AppTitle from "./components/AppTitle";
import TopBar from "./components/TopBar";
import Play from "./components/Play";
import MainContainer from "./components/MainContainer"
import Accuracy from "./components/Accuracy";

const WIKI_ENDPOINT = "https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*";
const WIKI_PREFIXSEARCH_QUERY = "&list=search&srlimit=200&srnamespace=0&srsearch=";
const WIKI_CONTENT_QUERY = "&prop=extracts&list=&exlimit=max&exintro=1&explaintext=1" + 
  "&exsectionformat=plain&exsentences=3&pageids="; // for testing: exchars=50
const LENGTH_FILTER = 30;
let containerOffset = 0;  // top margin between container and target, to be calculated once components are rendered 

class App extends Component {
  constructor(props){
    super(props);
    this.state = {
      firstSearch: true,
      searchTerm: "Touch Typing",
      targetOnFocus: false,
      target: "",
      title: "",
      fetching: false,
      wikiIdList : [],
      wikiIdSelectionList : [],
      wikiExtracts : [],
      prevWikiExtracts: [],
      articleIterator : 0,
      keyStrokes: "",
      tempTypingErr : [],
      totalTypingErr: [],
      correctyTypedChars: 0,
      sentencesCompleted: 0,
      cursorPos: 0,
      isCursorRendered: false,
      readyToRollAgain : true,
      timer : 0,
      timerRunning: false,
      showSettings: false,
      styles: {
        title : 40,
        target : 100
      },
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
    };
  }

  componentDidMount() {
    document.getElementById("container").addEventListener("keydown", this.onKeyPress);
    document.getElementById("container").addEventListener("focus", this.changeFocus);
    document.getElementById("container").addEventListener("blur", this.changeFocus);
    document.getElementById("settings-panel").addEventListener("blur", this.checkAsyncFocus);
    window.addEventListener("resize", () => this.setState({readyToRollAgain: true}));
    this.fetchArticlesIds();
  }

  componentDidUpdate(prevProps, prevState) {
    if(this.state.articleIterator > prevState.articleIterator) {
      this.refreshContainer();
    }
    if(this.state.showSettings !== prevState.showSettings && this.state.showSettings) {
      document.getElementById("settings-panel").focus();
    }
    if(!this.state.isCursorRendered && document.getElementsByClassName("cursor").length){
      this.setState({isCursorRendered : true});
      containerOffset = document.getElementsByClassName("cursor")[0].getBoundingClientRect().top - 
        document.getElementById("container").getBoundingClientRect().top;
    }
  }
 
  manageTimer = () => {
    const S = 1000; // 1 second timeframe (1000 ms)
    let start = Number(new Date());
    this.clock = setInterval(() => {
      let now = Number(new Date());
      // a calculation of delta is necessary to avoid accumulating extra ms
      let deltaErr = Math.abs((now - start) % S);
      deltaErr -= deltaErr > S / 2 ? S : 0;
      // basically "start" gets to move forward every second w/ delta
      start += deltaErr;
      // if the target is on focus, refresh time
      if(this.state.targetOnFocus){
        this.setState({timer : (now - start) / S});
      }
      else start += S;
    }, S);
  }

  onSearchChange = (e) => {
    if(this.state.firstSearch){
      this.setState({ firstSearch : false });
    }  
    this.setState({ searchTerm : e.target.value });
  }

  onSearchSubmit = (e) => {
    e.preventDefault();
    this.refreshContainer();
    this.fetchArticlesIds();
  };

  // update options by creating a new settingsOptions list to be stored in state
  onCheckboxChange = (e) => {
    let newOptions = [];
    let idx = this.state.settingsOptions.findIndex(i => i.name === e.target.name);
    for(let i = 0; i < this.state.settingsOptions.length; i++){
      newOptions.push(this.state.settingsOptions[i]);
      if(i === idx)
        newOptions[i].val = !newOptions[i].val;
    }
    this.setState({settingsOptions : newOptions});
  }

  // reset container view and put a new article in it (if available)
  refreshContainer = () => {
    this.setState({
      cursorPos : 0, 
      tempTypingErr : [],
      readyToRollAgain : false
    });
    this.changeScrollCoord();
    this.chooseArticle();
  }

  changeScrollCoord = (title = 40, target = 100) => {
    let newStyles = this.state.styles;
    newStyles.title = title;
    newStyles.target = target;
    this.setState({styles : newStyles});
  }

  // check if "settings-panel" or any of its children get blurred.
  // promises are necessary here due to the asynch nature of document.activeElement
  checkAsyncFocus = () => {
    const wait = () => {
      let promise = new Promise((resolve) => {
        window.setTimeout(() => {
          resolve(document.activeElement);
        }, 1);
      });
      return promise;
    }
    wait().then(elm => {
      if(!document.getElementById("settings-panel").contains(elm) && 
        elm !== document.getElementById("settings")){
        this.changeSettings();
      } 
    });
  }

  changeSettings = () => {
    this.setState({showSettings : !this.state.showSettings});
  }

  changeFocus = () => {
    this.setState({targetOnFocus : !this.state.targetOnFocus});
  }

  changeFetching = () => {
    this.setState({fetching : !this.state.fetching});
  }

  animateCSS = (id, animation, duration) => {
    document.getElementById(id).style.animation = animation;
    setTimeout(() => document.getElementById(id).removeAttribute("style"), duration);   
  }

  handleFetchingErrors = (err) => {
    console.log("Error: " + err);
    this.animateCSS("search-field", "alarming .3s ease-in-out 2", 600);
    this.setState({wikiExtracts: this.state.prevWikiExtracts});
    this.changeFetching();  
  }

  // fetch articles ids related to searchTerm 
  fetchArticlesIds = () => {
    if(!this.state.fetching){
      this.setState({articleIterator : 0});
      this.changeFetching();
      this.setState({
        wikiExtracts : [], wikiIdSelectionList: [],
        prevWikiExtracts: this.state.wikiExtracts       
      });
      fetch(WIKI_ENDPOINT + WIKI_PREFIXSEARCH_QUERY + this.state.searchTerm)
        .then(response => response.json())
        .then(result => {this.setState({wikiIdList : result.query.search.map(key => key.pageid)})})
        .then(this.fetchExtracts)
        .catch(error => this.handleFetchingErrors(error));
    }
  }

  fetchExtracts = () => {
    const {wikiIdList} = this.state;
    // if the returned list is empty, the search didn't match any result
    if(!wikiIdList.length){
      this.handleFetchingErrors("No match! The list is empty.");
    }
    else { // otherwise, proceed making a new call to fetch extracts
      this.animateCSS("app-title-1", "wiggleTitle .5s ease-out", 500);
      // always select the first returned Id. first match = best match
      this.setState({wikiIdSelectionList : [wikiIdList[0]]}); 
      // then eventually add the rest (chosen randomly)
      for(let i = 1; i < 20 && i < wikiIdList.length; i++){ // 20 == hard limit for this API call
        let rng = 0;
        do {
          rng = Math.floor(Math.random() * wikiIdList.length);
        } while(this.state.wikiIdSelectionList.includes(wikiIdList[rng]));
        this.setState({wikiIdSelectionList : [...this.state.wikiIdSelectionList, wikiIdList[rng]]});
      }
      // call to fetch extracts
      fetch(WIKI_ENDPOINT + WIKI_CONTENT_QUERY + this.state.wikiIdSelectionList.join("%7C"))
        .then(response => response.json())
        // map results to a new object list (wikiExtracts)
        .then(result => {
          this.setState({wikiExtracts : Object.keys(result.query.pages).map(q => {
              return {
                id: result.query.pages[q].pageid,
                title: result.query.pages[q].title,
                article: result.query.pages[q].extract
              }
            })
            // filter out short results
            .filter(q => q.article.length > LENGTH_FILTER)
          });
          // move the best match up in the list, so for each query
          // the first result to be shown is the closest one (unless filtered out!)
          for(let key in Object.keys(this.state.wikiExtracts)){
            if(this.state.wikiExtracts[key].id === wikiIdList[0]){
              [this.state.wikiExtracts[key], this.state.wikiExtracts[0]] =
              [this.state.wikiExtracts[0], this.state.wikiExtracts[key]];
            }
          }
          // finally, choose an article
          this.chooseArticle();
        })
        .catch(error => this.handleFetchingErrors(error));
    }
  }

  chooseArticle = () => {
    const {wikiExtracts, articleIterator, fetching} = this.state;
    // if we reached the end of our wikiExtracts list, it's time to fetch again
    if(!fetching && wikiExtracts.length &&
      (articleIterator === wikiExtracts.length)){
      document.getElementById("container").blur();
      this.fetchArticlesIds();
    } else {
      // otherwise get the next article to be displayed
      document.getElementById("container").focus();
      if(fetching){
        this.changeFetching();
      }
      this.setState({
        target : wikiExtracts[articleIterator].article,
        title : wikiExtracts[articleIterator].title
      });
    }
  }
  
  pickNextArticle = () => {
    if(!this.state.fetching){
      this.setState({articleIterator : this.state.articleIterator + 1});
    }
  }

  checkCase = (key, target) => {  // TODO: merge in universal foo to handle settingsOptions
    let isTicked = this.state.settingsOptions.filter(i => i.name === "ignoreCase")[0].val;
    return isTicked && key.toLowerCase() === target.toLowerCase();
  }

  checkSpecial = (key, target) => {
    let isTicked = this.state.settingsOptions.filter(i => i.name === "ignoreSpecial")[0].val;
    return isTicked && (key === removeDiacritics(target) || (key === " " && /[^\w]/.test(target)));    
  }
  
  checkNewLine = () => {
    const yCursor = document.getElementsByClassName("cursor")[0].getBoundingClientRect().top;
    const yContainer = document.getElementById("container").getBoundingClientRect().top;
    const rowOffset = yCursor - yContainer - containerOffset;
    // check if eventual rollover movements have been completed
    if(Math.abs(rowOffset) < 1){
      this.setState({readyToRollAgain : true});
    }
    // check if y coordinate of cursor has changed of more than 50px (that means newline)
    if(this.state.readyToRollAgain && Math.abs(rowOffset) >= 50){
      this.setState({readyToRollAgain: false}); 
      this.changeScrollCoord(this.state.styles.title - rowOffset, this.state.styles.target - rowOffset);    
    };
  }

  onKeyPress = (e) => {
    const {keyStrokes, target, cursorPos, tempTypingErr,
      totalTypingErr,correctyTypedChars, fetching, timerRunning} = this.state;
    // prevent accidentally registering keys while fetching
    if(fetching) return;
    // start timer
    if(!timerRunning) this.setState({timerRunning : true}, this.manageTimer);
    // prevent quick-search in Firefox
    if(e.key === "'" || e.key === "/" || e.key === " ") e.preventDefault(); 
    // if it's a single char (as opposed to special keys), check:
    if(e.key.length === 1){
      this.setState({keyStrokes : keyStrokes + e.key});
      let match = e.key === target[cursorPos] || 
        this.checkCase(e.key, target[cursorPos]) ||
        this.checkSpecial(e.key, target[cursorPos]);
      if(match){  // if char is correct, move cursor       
        this.setState({
          cursorPos : cursorPos + 1,
          correctyTypedChars : correctyTypedChars + 1
        }); 
        // if the text is over, go fetch a new article and roll back
        if(this.state.cursorPos === target.length){   
          this.pickNextArticle();
          this.refreshContainer();
        }
      } else { // if char is wrong, count error
        this.setState({
          totalTypingErr : [...totalTypingErr, cursorPos],
          tempTypingErr : [...tempTypingErr, cursorPos]
        });
      };
      this.checkNewLine();
    }
  }

  render() {
    const {target, keyStrokes, cursorPos, tempTypingErr, totalTypingErr, targetOnFocus, styles, showSettings,
      timer, settingsOptions, fetching, title, firstSearch, searchTerm, correctyTypedChars} = this.state;
    return (
      <React.Fragment>
        <AppTitle />
        <TopBar pickNextArticle={this.pickNextArticle} onSearchSubmit={this.onSearchSubmit} firstSearch={firstSearch}
          toggleSettings={this.changeSettings} onSearchChange={this.onSearchChange} searchTerm={searchTerm} fetching={fetching}/>
        <Play targetOnFocus={targetOnFocus} />
        <MainContainer target={target} title={title} tempTypingErr={tempTypingErr} targetOnFocus={targetOnFocus}
        cursorPos={cursorPos} fetching={fetching} styles={styles} toggleSettings={this.checkAsyncFocus}
        settingsOptions={settingsOptions} showSettings={showSettings} onCheckboxChange={this.onCheckboxChange} />
        <Accuracy keyStrokes={keyStrokes} totalTypingErr={totalTypingErr} timer={timer} correctyTypedChars={correctyTypedChars}/>
      </React.Fragment>
    );
  }
}

export default App;