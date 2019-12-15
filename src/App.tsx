import React from "react";
import logo from "./logo.svg";
import VideoRoot from "./Components/Video";

import "./App.css";

const App: React.FC = () => {
  return (
    <div className="App">
      <header className="App-Main">
        <img src={logo} className="App-logo" alt="logo" />
        <p>Video should show below</p>
        <VideoRoot />
      </header>
    </div>
  );
};

export default App;
