/**
 * Copyright (c) 2017-present, Viro, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Icon } from 'react-native-elements';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { ViroARSceneNavigator } from 'react-viro';
import TimerMixin from 'react-timer-mixin';

import {ARTrackingInitialized, addModelWithType, removeModelWithUUID, removeAllModels, toggleModelSelection, changeModelLoadState, changeItemClickState} from './js/redux/actions/index';

import ARInitializationUI from './js/components/ARInitializationUI';
import ButtonComponent from './js/components/ButtonComponent';
import ModelButtonComponent from './js/components/ModelButtonComponent';
import renderIf from './js/helpers/renderIf';
import ContextMenuButton from './js/components/ContextMenuButton';
import * as ModelTypes from './js/redux/reducers/modelTypes';
// import {AudioRecorder, AudioUtils} from 'react-native-audio';
import Sound from 'react-native-sound';
import AudioRecord from 'react-native-audio-record';
import * as Intents from './js/helpers/intents';

import * as WatsonAudio from './js/helpers/watsonAudio';
import writeDownAudio from './js/res/audio/writeDown.mp3';
import tryAgain from './js/res/audio/tryAgain.mp3';
import okaySave from './js/res/audio/okaySave.mp3';
import coffee from './js/res/audio/coffee.mp3';
import detectedKings from './js/res/audio/detectedKings.mp3';

// Enable playback in silence mode


/*
 TODO: Insert your API key below
 */
var sharedProps = {
  apiKey:"5C9B7C95-A210-46E9-B24B-26B07E992613",
}

// Sets the default scene you want for AR and VR
var InitialARScene = require('./js/VisumScene.js');


export default class VisumApp2 extends Component {
  constructor() {
    super();

    this.state = {
      viroAppProps: {loadingObjectCallback: this._onListItemLoaded, clickStateCallback: this._onItemClickedInScene},
      isWatsonEnabled: false,
      audioPath: '',
      screenshot_count: 0,
      connected: false // Socket Connection
    }

    this._setARNavigatorRef = this._setARNavigatorRef.bind(this);

  }

  componentDidMount() {
    const options = {
      sampleRate: 22050,
      channels: 1,
      wavFile: 'test.wav'
    }
    AudioRecord.init(options);

    AudioRecord.on('data', data => {
      // console.log("WAV File data", data);
    })

  }

  // Replace this function with the contents of _getVRNavigator() or _getARNavigator()
  // if you are building a specific type of experience.
  render() {
    return (

      <View style={localStyles.outer}>

        <ViroARSceneNavigator style={localStyles.arView} 
          apiKey={sharedProps.apiKey}
          initialScene={{scene: InitialARScene}}  
          ref={this._setARNavigatorRef} 
          viroAppProps={this.state.viroAppProps}
        />

        {/* AR Initialization animation shown to the user for moving device around to get AR Tracking working*/}
        <ARInitializationUI style={{position: 'absolute', top: 20, left: 0, right: 0, width: '100%', height: 140, flexDirection:'column', justifyContent: 'space-between', alignItems: 'center'}}/>
        
        {/* Bottom Left Menu Render Buttons */}
        {this._renderButtonLeftMenu()}

        {/* Close Button Top Right Corner */}
        {this._renderContextMenu()}

        {/* Render Watson Assistant */}
        {this._renderWatsonAssistant()}

        {/* Render Activitiy Indicator (Loading) if Model is Loading */}
        {renderIf(this.props.isLoading,
          <ActivityIndicator size="large" style={{position: 'absolute', top: 160, left: 0, right: 0, width: '100%', height: 140, flexDirection:'column', justifyContent: 'space-between', alignItems: 'center'}} />
        )}
      </View>
    )

  }

  /**
   * Handle Watson Assistant - begin/end audio recording
   */
  _onPressWatsonAssistant = () => {
    if (this.state.isWatsonEnabled) {
      // Pressed to stop watson assistant
      this._stopRecording();

      // Want to stop audio and Post the audio data to IBM Speech To Text -> IBM Watson Assistant
      console.log("Ending recording");
    }
    else {
      // Pressed to start watson assistant
      this._startRecording();

      // Beginning recording of the audio
      console.log("Beginning recording");

    }
  }

  /**
   * Begin Recording
   */
  async _startRecording() {
    if (this.state.isWatsonEnabled) {
      return;
    }

    this.setState({
      isWatsonEnabled: true
    })
    AudioRecord.start();
  }

  /**
   * Stop Recording
   */
  async _stopRecording() {
    if (!this.state.isWatsonEnabled) {
      // Not recording
      return;
    }

    this.setState({
      isWatsonEnabled: false
    })

    try {
      const audioPath = await AudioRecord.stop();

      this._sendAudio(audioPath);


      this.setState({
        audioPath: audioPath
      })
      return audioPath;
    }
    catch (e) {
      console.log("Error: ", e);
    }
  }

  /**
   * Plays the recording
   */
  async _playRecording(path) {
    if (this.state.isWatsonEnabled) {
      await this._startRecording();
    }

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

  /**
   * Send Audio
   */
  async _sendAudio(audioPath) {
    let body = new FormData();
    console.log("Sending audio: ", audioPath);

    body.append('upload', {
      uri: audioPath,
      name: `test.wav`, // notice the use of "ulaw" here
      type: `audio/wav` // and here it is also "ulaw"
    });

    console.log("Sending audio");

    fetch('https://visumfoundryapp.mybluemix.net/postSpeech', {
      method: 'POST',
      body: body,
      // headers: {
      //   'Accept': 'audio/wav',
      // }
    })
    .then(res => res.json())
    .then(data => {
      console.log("Data: ", data);
      console.log("Intent: ", data.intent);
      this._handleWatsonResponse(data);
      return data;
    })

  }

  /**
   * Handle Watson Intent Responds
   * 
   * Includes: Create sticky note with data, Generic Welcome, Watson Does not understand
   */
  _handleWatsonResponse = (data) => {
    var that = this;
    var length = Object.keys(this.props.modelItems).length;
    // this._playRecording(data)
    switch(data.intent) {
      case Intents.AWAIT_STICKY_RESPONSE:
        // this._playRecording(writeDownAudio);
          this._playRecording(require("./js/res/audio/writeDown.mp3"));
        break;
      case Intents.TRY_AGAIN:
        this._playRecording(tryAgain);
        break;
      case Intents.CREATE_STICKY:
        console.log("Create sticky");
        console.log("model length: ", length);
        if (length >= 1) {
          // coffee example
          console.log("Coffee");
          this._playRecording(coffee);
          this.props.dispatchAddModelWithType(ModelTypes.STICKY_NOTE, WatsonAudio.COFFEE)
        }
        else {
          // Microwave example
          console.log("microwave");
          this._playRecording(okaySave);
          this.props.dispatchAddModelWithType(ModelTypes.STICKY_NOTE, WatsonAudio.MICROWAVE)
        }
        break;
      case Intents.DETECT_FACES:
        this._playRecording(detectedKings);
      default:
        break;

    }
  }

  // Helper function called while initializing <ViroARSceneNavigator>
  _setARNavigatorRef(ARNavigator){
    this._arNavigator = ARNavigator;
  }

  // Handle Load State of the Model
  _onListItemLoaded = (uuid, loadState) => {
    this.props.dispatchChangeModelLoadState(uuid, loadState);
  }

  _onItemClickedInScene = (uuid, clickState) => {
    this.props.dispatchChangeItemClickState(uuid, clickState);
  }

  /**
   * Add Model to the AR Scene of type: modelType
   */
  _onLeftButtonMenuPress = (modelType) => {
    this.props.dispatchAddModelWithType(modelType, null);
  }

  /*
  _takeScreenShot = () => {
    this._arNavigator._takeScreenshot("figment_still_" + this.state.screenshot_count, false).then((retDict)=>{
      if (!retDict.success) {
        console.log("permissions error");
        
      }
      else {
        let currentCount = this.state.screenshot_count + 1;
        this.setState({
          screenshot_count: currentCount
        })
        let img = "file://" + retDict.url;
        console.log("Image: ", img);
        
        // this.setState({
        //   videoUrl: "file://" + retDict.url,
        //   haveSavedMedia : false,
        //   playPreview : false,
        //   previewType: kPreviewTypePhoto,
        //   screenshot_count: currentCount,
        // });
      }

    });
  }
*/

  // Remove model of the current selected uuid
  _onContextMenuRemoveModelPressed = () => {
    var selectedItemUUID = this.props.currentItemSelectionUUID;
    var clickState = this.props.currentItemClickState;

    if (selectedItemUUID != -1 && clickState != '') {
      // Remove Model with UUID
      this.props.dispatchRemoveModelWithUUID(selectedItemUUID);

      // Reset state of objects
      this.props.dispatchChangeItemClickState(-1, '');
    }
  }

  // @TODO REMOVE ALL MODELS

  /**
   * Context Menu is the collection of buttons on the top right screen: "Remove Object" & "Clear All"
   * 
   * All Click States can be found in (js/components/ModelItemRender.js)
   */
  _renderContextMenu = () => {
    var selectedItemUUID = this.props.currentItemSelectionUUID;
    var clickState = this.props.currentItemClickState;

    if (selectedItemUUID != -1 && clickState == 2) {
      // If a valid model was clicked and the user has clicked up, reset the items "click state" after 3.5 seconds
      // so that a model can be clicked again
      TimerMixin.setTimeout(
        () => {
          this.props.dispatchChangeItemClickState(-1, '');
        },
        4000
      );
    }
    return (
      <View style={{flex:1, position:'absolute', flexDirection:'column', justifyContent: 'space-between', alignItems: 'flex-end', top:'10%', right:10,width:80, height:80}}>    
        {renderIf(selectedItemUUID != -1,
          <Icon 
            name="trash"
            type='evilicon'
            color="white"
            size={40}
            onPress={this._onContextMenuRemoveModelPressed}
          />
        )}

      </View>
    )
  }

  /**
   * Render Button Menu in Bottom Left Corner
   * 
   * Used to display all Model Buttons which can be pressed in order to Add a new model to the scene
   */
  _renderButtonLeftMenu = () => {
    var buttons = [];

    
    buttons.push(
      <ModelButtonComponent key="sticky_note"
        onPress={() => this._onLeftButtonMenuPress(ModelTypes.STICKY_NOTE)}
        stateImage={require("./js/res/sticky-note.png")}
        style={localStyles.screenIcon}
      />
    )
    
    // buttons.push(
    //   <ModelButtonComponent key="facial_recognition"
    //     onPress={() => this._takeScreenShot()}
    //     stateImage={require("./js/res/faceRecognition.png")}
    //     style={localStyles.screenIcon}
    //   />
    // )
    

  //  buttons.push(
  //     <ModelButtonComponent key="sticky_note"
  //       onPress={() => this._onLeftButtonMenuPress(ModelTypes.STICKY_NOTE)}
  //       stateImage={require("./js/res/sticky-note.png")}
  //       style={localStyles.screenIcon}
  //     />
  //   )
    return (
      <View style={{position:'absolute', flexDirection:'column', justifyContent: 'space-around',left:10, bottom:70, width:70, height:160, flex:1}}>
        {buttons}
      </View>
    );
  }

  /**
   * Renders Watson Assistant in the bottom right corner
   */
  _renderWatsonAssistant = () => {
    return (
      <View style={{flex:1, position:'absolute', flexDirection:'column', justifyContent: 'space-between', alignItems: 'flex-end', bottom:'5%', right:5,width:80, height:60}}>
        {/* Watson is enabled */}
        {renderIf(this.state.isWatsonEnabled,
          <ModelButtonComponent key="watson_assistant"
            onPress={() => this._onPressWatsonAssistant()}
            stateImage={require("./js/res/watson-on-2.png")}
            style={localStyles.watsonIcon}
          />
        )}

        {/* Watson is disabled */}
        {renderIf(!this.state.isWatsonEnabled,
          <ModelButtonComponent key="watson_assistant"
            onPress={() => this._onPressWatsonAssistant()}
            stateImage={require("./js/res/watson-off-2.png")}
            style={localStyles.watsonIcon}
          />
        )}
      </View>
    )
  }

}

var localStyles = StyleSheet.create({
  outer : {
    flex : 1,
  },

  arView: {
    flex:1,
  },
  buttons : {
    height: 80,
    width: 80,
    paddingTop:20,
    paddingBottom:20,
    marginTop: 10,
    marginBottom: 10,
    backgroundColor:'#00000000',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ffffff00',
  },
  screenIcon: {
    position : 'absolute',
    // height: 58,
    // width: 58,
  },
  watsonIcon: {
    position: "absolute",
    // width: 58
  },
  previewScreenButtonClose: {
    position:'absolute',
    height: 23,
    width: 23,
  },
  previewScreenButtons: {
    height: 30,
    width: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

const mapStateToProps = (store) => {
  return {
    modelItems: store.arobjects.modelItems,
    currentItemSelectionUUID: store.ui.currentItemSelectionUUID,
    currentItemClickState: store.ui.currentItemClickState,
    isLoading: store.ui.isLoading,
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    dispatchChangeModelLoadState: (uuid, loadState) => dispatch(changeModelLoadState(uuid, loadState)),
    dispatchChangeItemClickState: (uuid, clickState) => dispatch(changeItemClickState(uuid, clickState)),
    dispatchRemoveModelWithUUID: (uuid) => dispatch(removeModelWithUUID(uuid)),
    dispatchAddModelWithType: (modelType, audio) => dispatch(addModelWithType(modelType, audio))
  }
}

module.exports = connect(mapStateToProps, mapDispatchToProps)(VisumApp2);
