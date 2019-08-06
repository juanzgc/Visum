import React, { Component } from 'react';
import PropTypes from 'prop-types';
import renderIf from '../helpers/renderIf';
import * as ModelData from  '../model/ModelItems';
import * as WatsonModels from '../model/WatsonModels';
import * as ModelTypes from '../redux/actions/actionTypes.js';
import * as LoadingConstants from '../redux/LoadingStateConstants.js';
import TimerMixin from 'react-timer-mixin';
import Sound from 'react-native-sound';


import {
    ViroMaterials,
    ViroNode,
    Viro3DObject,
    ViroSpotLight,
    ViroQuad,
    ViroAmbientLight
  } from 'react-viro';
  

export default class ModelItemRender extends Component {
    constructor(props) {
        super(props);

        // @TODO onClickStateCallback - remove item type


        this.state = {
            scale: ModelData.getModelArray()[this.props.modelIDProps.modelType].scale,
            rotation: [0, 0, 0],
            nodeIsVisible: false,
            position: [0, 10, 1], // make it appear initially high in the sky
            itemClickedDown: false,
        }
    }


    render() {
        var modelItem = ModelData.getModelArray()[this.props.modelIDProps.modelType];
        return (
            <ViroNode
                key={this.props.modelIDProps.uuid}
                ref={this._setARNodeRef}
                position={this.state.position}
                scale={this.state.scale}
                rotation={this.state.rotation}
                onDrag={()=>{}}
                dragType="FixedToWorld"            
            >
                {/* This spotlight is placed directly above the 3D Object, directed straight down, is responsible for prodviding lighting */}
                <ViroSpotLight
                    ref={component => {this.spotlight = component}}
                    intensity={modelItem.lighting_mode == "IBL" ? 100 : 1000}
                    innerAngle={5}
                    outerAngle={20}
                    direction={[0,-1,0]}
                    position={[0, 6, 0]}
                    color="#ffffff"
                    castsShadow={false}
                />

                {/* @TODO May need to remove ViroNode */}
                <ViroAmbientLight color="#ffffb8" intensity={250} />

                <ViroNode>
                    <Viro3DObject
                        source={modelItem.source}
                        type={modelItem.type}
                        resources={modelItem.resources}
                        onClickState={this._onClickState(this.props.modelIDProps.uuid)}
                        onClick={()=>{}}
                        onRotate={this._onRotate}
                        onPinch={this._onPinch}
                        onLoadStart={this._onObjectLoadStart(this.props.modelIDProps.uuid)}
                        onLoadEnd={this._onObjectLoadEnd(this.props.modelIDProps.uuid)}
                        onError={this._onError(this.props.modelIDProps.uuid)}
                        // materials={["pbr"]}
                        materials={"pbr"}

                    />
                </ViroNode>

                <ViroQuad
                    rotation={[-90, 0, 0]}
                    position={[0, -.001, 0]}
                    width={2.5} 
                    height={2.5}
                    ignoreEventHandling={true}
                />

            </ViroNode>
        )
    }

    _setARNodeRef = (component) => {
        this.arNodeRef = component;
    }


    /**
     * This method handles various state changes that happen when a user "Clicks" a model in the scene. For every "click" on a model, 
     * 
     * Each "click" is comprised of mainlty two events - ClickDown : trigged when the user's finger touches the screen and a ClickUp: when the finger leaves the screen
     * 
     * CLICK STATES
     * 1. Click Down: Triggered when the user has performed a click down action while hovering on this control.
     * 2. Click Up: Triggered when the user has performed a click up action while hovering on this control.
     * 3. Clicked: Triggered when the user has performed both a click down and click up action on this control sequentially, thereby having "Clicked" the object.
     * 
     * A user can have different intentions:
     *   - a quick tap to bring up the contextmenu
     *   - a long tap where the intention is actually "drag" the model to reposition it
     */
    _onClickState = (uuid) => {
        var audioPath = WatsonModels.getWatsonVoice()[this.props.modelIDProps.audio].path;
        console.log("Audio path: ", audioPath);
        return (clickState, position, source) => {
            if (clickState == 1) { 
                // clickState == 1 -> "ClickDown", we set the state itemClickedDown = true here,
                // which gets "reset" in 200 miliseconds. If a "ClickUp" happens in these 200 ms then
                // the user most likely just wanted to click the model (handled in the clickState == 2). 
                //After 200 ms, most likely the user intended to "drag" the object.
                this.setState({
                  itemClickedDown : true,
                });
                TimerMixin.setTimeout(
                  () => {
                    this.setState({
                      itemClickedDown: false,
                    });
                  },
                  200
                );
            }
    
            if (clickState == 2) { // clickstate == 2 -> "ClickUp"
                // As explained above, within 200 ms, the user's intention is to "tap" the model -> toggle the animation start/stop
                if (this.state.itemClickedDown && audioPath != null) {
                    {this._playAudio(audioPath)}
                }
                
                // Irrespective of 200 ms, we call the callback provided in props -> this brings up the context menu on top right
                this.props.onClickStateCallback(uuid, clickState);
            }
        }
    }

    _playAudio = (path) => {

        // These timeouts are a hacky workaround for some issues with react-native-sound.
        // See https://github.com/zmxv/react-native-sound/issues/89.
        console.log("Play recording");
        setTimeout(() => {
        var sound = new Sound(path, '', (error) => {
            if (error) {
            console.log('failed to load the sound', error);
            }
        });

        sound.setVolume(1);
        sound.setCategory("Playback");

        setTimeout(() => {
            sound.play((success) => {
            if (success) {
                console.log('successfully finished playing');
            } else {
                console.log('playback failed due to audio decoding errors');
            }
            });
        }, 100);

        }, 100);
  
    }

    /*
      Rotation should be relative to its current rotation *not* set to the absolute
      value of the given rotationFactor.
     */
    _onRotate = (rotateState, rotationFactor, source) => {
        if (rotateState == 3) {
            this.setState({
                rotation: [this.state.rotation[0], this.state.rotation[1] + rotationFactor, this.state.rotation[2]]
            });
            this.props.onClickStateCallback(this.props.modelIDProps.uuid, rotateState);
            return;
        }
        this.arNodeRef.setNativeProps({rotation:[this.state.rotation[0], this.state.rotation[1] + rotationFactor, this.state.rotation[2]]});
    }

    /*
      Pinch scaling should be relative to its last value *not* the absolute value of the
      scale factor. So while the pinching is ongoing set scale through setNativeProps
      and multiply the state by that factor. At the end of a pinch event, set the state
      to the final value and store it in state.
     */
    _onPinch = (pinchState, scaleFactor, source) => {
        var newScale = this.state.scale.map((x)=>{return x * scaleFactor})

        if (pinchState == 3) {
            this.setState({
                scale : newScale
            });
            this.props.onClickStateCallback(this.props.modelIDProps.uuid, pinchState);
            return;
        }
        this.arNodeRef.setNativeProps({scale:newScale});
    }

    // Set Model loading status to: Loading (Beginning Loading)
    _onObjectLoadStart = (uuid) => {
        return () => {
            this.props.onLoadCallback(uuid, LoadingConstants.LOADING);
        }
    }

    // Set Model loading status to: Loaded (Finished Loading)
    _onObjectLoadEnd = (uuid) => {
        return () => {
            this.props.onLoadCallback(uuid, LoadingConstants.LOADED);
            this.props.hitTestMethod(this._onARHitTestResults);

        }
    }

    _onError = (uuid) => {
        return () => {
            this.props.onLoadCallback(uuid, LoadingConstants.LOAD_ERROR);
        };
    }


        /**
     * This method is executed once a model finishes loading. The arguments position, forward and results are used to
     * find the correct position of the model. position, forward and results are calculated when user adds a model to 
     * the scene by performing an AR Hit Test (see https://docs.viromedia.com/docs/viroarscene). arguments:
     * position - intersection of a Ray going out from the camera in the forward direction and the AR point returned by underlying AR platform
     * forward - forward vector of the ray
     * results - All feature points returned
     */
    _onARHitTestResults = (position, forward, results) => {
        // default position is just 3 forward of the user
        let newPosition = [forward[0] * 1.5, forward[1]* 1.5, forward[2]* 1.5];
  
        // try to find a more informed position via the hit test results
        if (results.length > 0) {
          let hitResultPosition = undefined;
          // Go through all the hit test results, and find the first AR Point that's close to the position returned by the AR Hit Test
          // We'll place our object at that first point
          for (var i = 0; i < results.length; i++) {
            let result = results[i];
            if (result.type == "ExistingPlaneUsingExtent" || result.type == "FeaturePoint" && !hitResultPosition) {
              // Calculate distance of the "position" from this hit test result
              // math = Sqr root {(x1-x2)^2 + (y1-y2)^2 + (z1-z2)^2} ->regular "distance" calculation
              var distance = Math.sqrt(((result.transform.position[0] - position[0]) * (result.transform.position[0] - position[0])) + ((result.transform.position[1] - position[1]) * (result.transform.position[1] - position[1])) + ((result.transform.position[2] - position[2]) * (result.transform.position[2] - position[2])));
              if(distance > .2 && distance < 10) {
                hitResultPosition = result.transform.position;
                break;
              }
            } 
          }
  
          // If we found a hitResultPosition above after doing the distance math, set the position to this new place
          if (hitResultPosition) {
            newPosition = hitResultPosition;
          }
        }
  
        this._setInitialPlacement(newPosition);
    }


    // we need to set the position before making the node visible because of a race condition
    // in the case of models, this could cause the model to appear where the user is before
    // moving to it's location causing the user to accidentally be "inside" the model.
    // This sets an initial timeout of 500 ms to avoid any race condition in setting 
    // position and rotation while the object is being loaded.
    _setInitialPlacement = (position) => {
        this.setState({
            position: position,
        });
        
        // this.setTimeout(() =>{this._updateInitialRotation()}, 500);
        TimerMixin.setTimeout(() =>{this._updateInitialRotation()}, 500);

    }


    // This function gets the rotation transform of the parent ViroNode that was placed in the scene by the user
    // and applies that rotation to the model inside the ViroNode (by setting state). This is done to ensure that
    // the portal faces the user at it's initial placement.
    _updateInitialRotation() {
        this.arNodeRef.getTransformAsync().then((retDict)=>{
            let rotation = retDict.rotation;
            let absX = Math.abs(rotation[0]);
            let absZ = Math.abs(rotation[2]);
  
            let yRotation = (rotation[1]);
  
            // if the X and Z aren't 0, then adjust the y rotation.
            if (absX > 1 && absZ > 1) {
                yRotation = 180 - (yRotation);
            }
            this.setState({
                rotation : [0,yRotation,0],
                nodeIsVisible: true,
            });
        });
    }


}

ViroMaterials.createMaterials({
    pbr: {
      lightingModel: "PBR",
    },
});

ModelItemRender.propTypes = {
    modelIDProps: PropTypes.any,
    hitTestMethod: PropTypes.func,
    onLoadCallback: PropTypes.func,
    onClickStateCallback: PropTypes.func
};

module.exports = ModelItemRender;