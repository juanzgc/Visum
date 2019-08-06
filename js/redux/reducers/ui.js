import *  as UIConstants from '../UIConstants';
import * as ActionTypes from '../actions/actionTypes';

const initialState = {
  currentScreen: UIConstants.SHOW_MAIN_SCREEN,
  currentItemSelectionUUID: -1,
  currentItemClickState: '',
  arTrackingInitialized: false,
  isLoading: false
}

function ui(state = initialState, action) {
  switch (action.type) {

    case ActionTypes.AR_TRACKING_INITIALIZED:
      return {
        ...state,
        arTrackingInitialized:action.trackingNormal,
      }

    case ActionTypes.CHANGE_ITEM_CLICK_STATE:
      return {
        ...state,
        currentItemSelectionUUID: action.uuid,
        currentItemClickState: action.clickState,
      }
    
    case ActionTypes.LOADING_START:
      return {
        ...state,
        isLoading: true
      }

    case ActionTypes.LOADING_END:
      return {
        ...state,
        isLoading: false
      }
    default:
      return state;
  }
}

module.exports = ui;
