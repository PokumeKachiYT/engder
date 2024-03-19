import { Dimensions } from 'react-native'
const { width, height } = Dimensions.get('window')

import { useFonts } from "expo-font"
import { StatusBar } from 'expo-status-bar'
import { StyleSheet, Text, View } from 'react-native'
import { PanResponder, Animated } from 'react-native'
import React, { useState, useEffect, useRef } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { LinearGradient } from 'expo-linear-gradient';

let panning = false
let canPan = false
let words = null
const maxRotation = 60

let lastUpdate = Date.now()

const saveData = async (key, value) => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.error('Error saving data:', error)
  }
}

const getData = async (key) => {
  try {
    const jsonValue = await AsyncStorage.getItem(key)
    return jsonValue != null ? JSON.parse(jsonValue) : null
  } catch (error) {
    console.error('Error retrieving data:', error)
  }
}

export default function App() {
  const [rotateY, setRotateY] = useState('0deg')
  const [offsetX, setOffsetX] = useState(0)
  const [word, setWord] = useState('Swipe if\n< this is a new word\nyou have already known this >')

  const pan = useRef(new Animated.ValueXY()).current
  
  const panEvent = Animated.event(
    [
      null,
      {dx: pan.x, dy: pan.y}
    ],
    {useNativeDriver: false}
  )

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => {
        panning = true
        return true
      },
      onPanResponderMove: (event, gestureState) => {
        panEvent(event, gestureState)
        setRotateY(
          Math.max(-maxRotation,Math.min(maxRotation,
            pan.x.__getValue() * Math.abs(pan.x.__getValue() / 2 / width)
          )) + 'deg'
        )
      },

      onPanResponderRelease: () => {
        panning = false
        setRotateY('0deg')
        if (pan.x.__getValue() / width >= 0.15) {
          setWord(
            words[~~(Math.random() * words.length)]
          )
        }
        pan.setValue({ x: 0, y: 0 });
        pan.extractOffset()
      },
    }),
  ).current

  useEffect( () => {
    if (panning) {
      //console.log('panning')

      setOffsetX(
        -pan.x.__getValue() * Math.min(Math.abs(pan.x.__getValue() / 1.5 / width),1)
      )
    } else {
      //console.log('nah')

      setOffsetX(0)

    }
  })


  useEffect( () => {
    getData('10000-data')
    .then( (arr) => {words = arr} )
    
    if (words === null) {
      console.log('fetching data')
      fetch('https://www.mit.edu/~ecprice/wordlist.10000')
      .then( (res) => {
        if (res.ok) {
          return res.text()
        } else {
          return 'holy shit bug found'
        }
      } )
      .then( (data) => {
        words = data.split('\n')
        saveData('10000-data',words)
        console.log('got data!')
      } )
      .catch( (error) => console.log(error) )
    }
  }, [])

  const [fontsLoaded] = useFonts({
    'JetBrains': require('./assets/fonts/JetBrains.ttf'),
    'SoftRegular': require('./assets/fonts/SoftRegular.ttf'),
    'SoftBold': require('./assets/fonts/SoftBold.ttf'),
  })

  if (!fontsLoaded) {
    return <Text>Loading...</Text>
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['rgba(0,1,0,0)', 'transparent']}
        style={{
          /*transform: [
            {translateX: -width},
          ]*/
        }}
      />

      <Animated.View
        style={{
          transform: [
            {translateX: pan.x.__getValue() + offsetX},
            //{translateY: pan.y},
          ],
          width: '100%',
          height: '100%',
        }}
        {...panResponder.panHandlers}>
        
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          style={{
            fontSize: 32,
            fontFamily: 'SoftBold',
            
            transform: [
              {rotateY: rotateY},
            ],

            color: '#6200EE',

            alignSelf: 'center',
            textAlign: 'center',
            textAlignVertical: 'center',
            width: '100%',
            height: '100%',
          }}
        >{word}</Text>
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#9955FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
})
