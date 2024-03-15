import { Dimensions } from 'react-native';
const { width, height } = Dimensions.get('window');

const guidelineBaseWidth = 350;
const guidelineBaseHeight = 680;

const scale = size => width / guidelineBaseWidth * size;
const verticalScale = size => height / guidelineBaseHeight * size;
const moderateScale = (size, factor = 0.5) => size + ( scale(size) - size ) * factor;

//export {scale, verticalScale, moderateScale};

import { useFonts } from "expo-font";
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { PanResponder, Animated } from 'react-native';
import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const saveData = async (key, value) => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Error saving data:', error);
  }
};

const getData = async (key) => {
  try {
    const jsonValue = await AsyncStorage.getItem(key);
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (error) {
    console.error('Error retrieving data:', error);
  }
};

export default function App() {
  const [pan] = useState(new Animated.ValueXY()) // Animated value to track pan position

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: Animated.event([
      null,
      { dx: pan.x, dy: pan.y } // Update pan position on move
    ]),
    onPanResponderRelease: () => {
      // You can perform actions when the pan gesture is released
    }
  });

  const [posts, setPosts] = useState([])
  const [words,setWords] = useEffect([])

  useEffect( () => {
    getData('100000-data')
    .then( (arr) => {
      setWords(arr)
      console.log('fonud data')
      
      if (words === null) {
        console.log('data invalid, fetching new data')

        fetch('https://www.mit.edu/~ecprice/wordlist.100000')
        .then( (res) => {
          if (res.ok) {
            return res.text()
          } else {
            return 'holy shit bug found'
          }
        } )
        .then( (data) => {
          saveData('100000-data',data.split('\n'))
        } )
      }
    } )
  }, []);

  const [fontsLoaded] = useFonts({
    'JetBrains': require('./assets/fonts/JetBrains.ttf')
  });

  if (!fontsLoaded) {
    return <Text>Loading...</Text>;
  }

  return (
    <View style={styles.container}>
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        style={styles.word_box}
      >life roblox</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#7700FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  word_box: {
    fontSize: 64,
    fontFamily: 'JetBrains',

    backgroundColor: '#9955FF',
    color: '#6200EE',

    alignSelf: 'center',
    textAlign: 'center',
    width: '80%',
  },
});
