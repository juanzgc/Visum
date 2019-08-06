/**
 * Copyright (c) 2017-present, Viro Media, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */

import * as LoadingConstants from '../LoadingStateConstants';
import * as ActionTypes from '../actions/actionTypes';

/**
 * Reducers for handling state or AR objects (Objects) in the AR Scene
 */
const uuidv1 = require('uuid/v1');


// Initial state of the app with empty models
const initialState = {
  modelItems: {},
}

// Creates a new model item with the given index from the data model in ModelItems.js
// Model Type is the index of ModelData.js
function newModelItem(modelType, audio) {
  return {uuid: uuidv1(), selected: false, loading: LoadingConstants.NONE, modelType: modelType, audio: audio};
}

// Add model at the given index to the AR Scene
function addModelItem(state = {}, action) {
  var model = newModelItem(action.modelType, action.audio);
  state[model.uuid] = model;
  return state;
}

// Remove model with given UUID from the AR Scene
function removeModelItem(state = {}, action) {
  state[action.uuid] = null;
  return state;
}

// Change state of individual ListView items between NONE, LOADING, ERROR, LOADED
function modifyLoadState(state = {}, action) {
  if(state[action.uuid] != null || state[action.uuid] != undefined) {
    var model = state[action.uuid];
    var newModel = {...model};
    newModel.loading = action.loadState;
    state[action.uuid] = newModel;
  }
  return state;
}

function arobjects(state = initialState, action) {
  switch (action.type) {

    case ActionTypes.ADD_MODEL:
      return {
        ...state,
        modelItems: {...addModelItem(state.modelItems, action)},
      }

    case ActionTypes.REMOVE_MODEL:
      return {
        ...state,
        modelItems: {...removeModelItem(state.modelItems, action)},
      }

    case ActionTypes.REMOVE_ALL:
      return {
        ...state,
        modelItems:{},
      }

    case ActionTypes.CHANGE_MODEL_LOAD_STATE:
      return {
        ...state,
        modelItems: {...modifyLoadState(state.modelItems, action)},
      }

    case ActionTypes.TOGGLE_MODEL_SELECTED:
      return {
        ...state,
        modelItems: {...modifyLoadState(state.modelItems, action)}
      }

    default:
      return state;
  }
}

module.exports = arobjects;
