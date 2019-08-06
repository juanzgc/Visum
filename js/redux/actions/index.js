/**
 * Copyright (c) 2017-present, Viro Media, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */

/**
 * Redux actions used to change app state based on events in the app
 */

import * as ActionTypes from './actionTypes';

// action to show / hide AR Initialization UI to guide user to move device around
export function ARTrackingInitialized(trackingNormal) {
  return {
    type: ActionTypes.AR_TRACKING_INITIALIZED,
    trackingNormal: trackingNormal,
  };
}

// action to add to the AR Scene, the model of the type given
export function addModelWithType(modelType, audio) {
  return {
    type: ActionTypes.ADD_MODEL,
    modelType: modelType,
    audio: audio // audio buffer may be null
  }
}

// action to remove from the AR Scene, the model of the given uuid type
export function removeModelWithUUID(uuid) {
  return {
    type: ActionTypes.REMOVE_MODEL,
    uuid: uuid
  }
}

// action to remove from the AR Scene, all models
export function removeAllModels() {
  return {
    type: ActionTypes.REMOVE_ALL
  }
}

// Toggle selected in js/model/ModelItems.js
// @TODO determine whether to remove
export function toggleModelSelection(uuid) {
  return {
    type: ActionTypes.TOGGLE_MODEL_SELECTED,
    uuid: uuid
  }
}

// action to change state of an individual model between NONE, LOADING, ERROR, LOADED (path: js/redux/LoadingStateConstants.js)
export function changeModelLoadState(uuid, loadState) {
  return {
    type: ActionTypes.CHANGE_MODEL_LOAD_STATE,
    uuid: uuid,
    loadState: loadState,
  };
}

// Click State of an individual model (e.g: drag, rotate, ...etc)
export function changeItemClickState(uuid, clickState) {
  return {
    type: ActionTypes.CHANGE_ITEM_CLICK_STATE,
    uuid: uuid,
    clickState: clickState
  }
}

export function uiLoadStart() {
  return {
    type: ActionTypes.LOADING_START
  }
}

export function uiLoadEnd() {
  return {
    type: ActionTypes.LOADING_END
  }
}

