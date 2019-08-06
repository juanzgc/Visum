// Loading constants
import * as LoadingConstants from '../redux/LoadingStateConstants';
import * as ModelTypes from '../redux/reducers/modelTypes';

var POSITION_OFFSET = .05 // 5 cm

// *** IMPORTANT *** Index of ModelItems corresponds to the ModelTypes name/index
var WatsonModels = [
    // Model Type: Sticky Note
    {
        "path": require("../res/audio/microwave.wav"),
    },
    {
        "path": require("../res/audio/tryAgain.mp3"),
    },
    {
        "path": require("../res/audio/writeDown.mp3"),
    },
    {
        "path": require("../res/audio/coffee.mp3"),
    },
    {
        "path": require("../res/audio/okaySave.mp3"),
    }
]

module.exports = {
    getWatsonVoice: function() {
      return WatsonModels;
    }
  };