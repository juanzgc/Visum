// Loading constants
import * as LoadingConstants from '../redux/LoadingStateConstants';
import * as ModelTypes from '../redux/reducers/modelTypes';

var POSITION_OFFSET = .05 // 5 cm

// *** IMPORTANT *** Index of ModelItems corresponds to the ModelTypes name/index
var ModelItems = [
    // Model Type: Sticky Note
    {
        "name": "sticky-note",
        "selected": "false",
        "loading": LoadingConstants.NONE,
        "source": require("../res/paper/note_A4_OBJ(3ds_Max_2013__Default_Scanline).obj"),
        "resources": [require("../res/paper/note_A4_OBJ(3ds_Max_2013__Default_Scanline).mtl")],
        "scale": [.001, .001, .001],
        "type": "OBJ",
        "ref_pointer": undefined
    }
]

module.exports = {
    getModelArray: function() {
      return ModelItems;
    }
  };