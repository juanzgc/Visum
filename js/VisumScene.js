'use strict';

import React, { Component } from 'react';
import { StyleSheet } from 'react-native';
import { connect } from 'react-redux';

import * as LoadingConstants from './redux/LoadingStateConstants';

import {
    ViroARScene,
    ViroConstants,
    ViroScene,
    ViroAmbientLight,
    ViroDirectionalLight,
    ViroARPlane,
    ViroMaterials,
    ViroNode,
    ViroUtils,
    ViroQuad,
    ViroSpotLight,
    Viro3DObject,
    ViroAnimations,
    ViroText
} from 'react-viro';

import renderIf from './helpers/renderIf';
import { ARTrackingInitialized, uiLoadStart, uiLoadEnd } from './redux/actions';
import ModelItemRender from './components/ModelItemRender'
/**
 * AR Scene shown in the App. All 3d Viro Componentes handeled and rendered here.
 */
export default class Visum extends Component {
    constructor(props) {
        super(props);

        this.state = {
            isLoading: false,
        }
    }


    render() {
        // fetch all models to be loaded in the AR Scene
        let models = this._renderModels(this.props.modelItems);

        return (
            <ViroARScene ref="arscene" physicsWorld={{gravity:[0, -9.81, 0]}} onTrackingUpdated={this._onTrackingUpdated}>
                <ViroAmbientLight color="#ffffff" intensity={20}/>
                
                {/* DirectionalLight with the direction away from the user, pointed upwards, to light up the "face" of the model */}
                <ViroDirectionalLight color="#ffffff" direction={[0,-1,-.2]}/>

                {/* Spotlight on top of the model to highlight this model*/}
                <ViroSpotLight
                    innerAngle={5}
                    outerAngle={90}
                    direction={[0,1,0]}
                    position={[0, -7, 0]}
                    color="#ffffff"
                    intensity={250}
                />

                {/* All Models */}
                {models}

                {/* <Viro3DObject
                    source={require("./res/paper/note_A4_OBJ(3ds_Max_2013__Default_Scanline).obj")}
                    resources={[require("./res/paper/note_A4_OBJ(3ds_Max_2013__Default_Scanline).mtl")]}
                    position={[0, 10, 1]}
                    dragType="FixedToWorld" onDrag={()=>{}}
                    scale={[.2, .2, .2]}
                    type="OBJ"
                /> */}

            </ViroARScene>
        )
    }

    // Callback fired when the app receives AR Tracking state changes from ViroARScene.
    // If the tracking state is not NORMAL -> show the user AR Initialization animation 
    // to guide them to move the device around to get better AR tracking.
    _onTrackingUpdated = (state, reason) => {
        var trackingNormal = false;
        if (state == ViroConstants.TRACKING_NORMAL) {
            trackingNormal = true;
        }
        this.props.dispatchARTrackingInitialized(trackingNormal);
    }

    
    // Render models added to the scene. 
    // modelItems - list of models added by user; comes from redux, see js/redux/reducers/arobjects.js
    _renderModels = (modelItems) => {
        var renderedObjects = [];
        if(modelItems) {
            var root = this;
            Object.keys(modelItems).forEach(function(currentKey) {
                if(modelItems[currentKey] != null && modelItems[currentKey] != undefined) {
                    renderedObjects.push(
                        <ModelItemRender key={modelItems[currentKey].uuid}
                        modelIDProps={modelItems[currentKey]}
                        hitTestMethod={root._performARHitTest}
                        onLoadCallback={root._onLoadCallback}
                        onClickStateCallback={root._onModelsClickStateCallback} />
                    );
                }
            });
        }
        return renderedObjects;
    }

    // Performed to find the correct position where to place a new object being added to the scene
    // Get's camera's current orientation, and performs an AR Hit Test with Ray along the camera's orientation
    // the object is then placed at the intersection of the Ray and identified AR point returned by the system
    // along that ray.
    _performARHitTest = (callback) => {
        this.refs["arscene"].getCameraOrientationAsync().then((orientation) => {
            this.refs["arscene"].performARHitTestWithRay(orientation.forward).then((results)=>{
                callback(orientation.position, orientation.forward, results);
            })
        });
    }

    // Set Load Status callback of an individual model
    _onLoadCallback = (uuid, loadState) => {
        this.props.arSceneNavigator.viroAppProps.loadingObjectCallback(uuid, loadState);

        // When Model is Loading set the isLoading to true in (js/redux/reducers/ui.js)
        if (loadState == LoadingConstants.LOADING) {
            this.props.dispatchUILoadStart();
        }
        // When Model is Done Loading set the isLoading to false in (js/redux/reducers/ui.js)
        else if (loadState == LoadingConstants.LOADED) {
            this.props.dispatchUILoadEnd();
        }
    }

    // Remove the item type
    _onModelsClickStateCallback = (uuid, clickState) => {
        this.props.arSceneNavigator.viroAppProps.clickStateCallback(uuid, clickState);
    }
}

const mapStateToProps = (store) => {
    return {
        modelItems: store.arobjects.modelItems
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
        dispatchARTrackingInitialized: (trackingNormal) => dispatch(ARTrackingInitialized(trackingNormal)),
        dispatchUILoadStart: () => dispatch(uiLoadStart()),
        dispatchUILoadEnd: () => dispatch(uiLoadEnd())
    }
}

module.exports = connect(mapStateToProps, mapDispatchToProps)(Visum);