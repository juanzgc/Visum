import React, { Component } from 'react';
import { Animated, Text, View, StyleSheet, TouchableHighlight, Image} from 'react-native';
import PropTypes from 'prop-types';

// For more information on Animation Scaling see: https://iwritecodesometimes.net/2019/04/17/react-native-scale-on-press-animations-made-easy/

export default class ModelButtonComponent extends Component {
    constructor(props) {
        super(props);

        this.scaleInAnimated = new Animated.Value(0);
        this.scaleOutAnimated = new Animated.Value(0);
    }

    
    pressInAnimation = (animated) => {
        let duration = 150;

        animated.setValue(0);
        Animated.timing(animated, {
          toValue: 1,
          duration,
          useNativeDriver: true,
        }).start();
    }

    pressOutAnimation = (animated) => {
        let duration = 150;

        animated.setValue(1);
        Animated.timing(animated, {
          toValue: 0,
          duration,
          useNativeDriver: true,
        }).start();
    }

    getScaleTransformationStyle = (animated, startSize, endSize) => {
        const interpolation = animated.interpolate({
            inputRange: [0, 1],
            outputRange: [startSize, endSize],
        });
        return {
            transform: [
                { scale: interpolation },
            ],
        };
    }

    render() {
        return (
            <TouchableHighlight 
                underlayColor="#00000000"
                onPress={this.props.onPress}
                onPressIn={() => this.pressInAnimation(this.scaleInAnimated)}
                onPressOut={() => this.pressOutAnimation(this.scaleInAnimated)}
                // style={this.getScaleTransformationStyle(this.scaleInAnimated, 1, 1.05)}
            >
                <View>
                    <Image source={require("../res/btn_transparent.png")}/>
                    <Animated.Image
                        source={this.props.stateImage}
                        style={this.props.style}
                    />
                </View>

            </TouchableHighlight>
        )
    }
}

ModelButtonComponent.propTypes = {
    onPress: PropTypes.func.isRequired,
    style: PropTypes.any,
    stateImage: PropTypes.any.isRequired
}

module.exports = ModelButtonComponent;