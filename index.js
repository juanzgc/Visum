import { AppRegistry } from 'react-native';
import React, { Component } from 'react';
import { Provider } from 'react-redux';
import { createStore } from 'redux';

var reducers = require('./js/redux/reducers');

import App from './App.js';

let store = createStore(reducers);

export default class Root extends Component {
  render() {
    return (
      <Provider store={store}>
        <App />
      </Provider>
    )
  }
}

AppRegistry.registerComponent('VisumApp4', () => Root);

// The below line is necessary for use with the TestBed App
AppRegistry.registerComponent('ViroSample', () => Root);
