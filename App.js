import { Dimensions } from 'react-native'
const { width, height } = Dimensions.get('window')

import { useFonts } from "expo-font"
import { StatusBar } from 'expo-status-bar'
import { StyleSheet, Text, View } from 'react-native'
import { PanResponder, Animated } from 'react-native'
import React, { useState, useEffect, useRef, useReducer } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import {LinearGradient} from 'expo-linear-gradient';

let panning = false
let canPan = false
let words = null
let offsetX = 0.0

const MAX_ROTATION = 45
const MAX_PAN = 0.1
const MAX_GRAD_OPACITY = 0.25

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

const fetchData = () => {
  fetch('https://www.mit.edu/~ecprice/wordlist.10000')
    .then( (res) => res.text() )
    .then( (data) => {
      words = data.split('\n')
            
      for (let i = 0 ; i < words.length ; ++i) {
        if (words[i].length <= 2) {
          words.splice(i,1)
        }
      }

      saveData('10000-data',words)
    } ) 
}

const lerp = (start, end, alpha) => {
  //return (1 - alpha) * start + alpha * end
  return start + (end - start) * alpha
}

export default function App() {
  const [, forceUpdate] = useReducer(x => x + 1, 0);

  const [rotation, setRotation] = useState('0deg')
  const [gradRed, setGradRed] = useState(0)
  const [gradGreen, setGradGreen] = useState(0)
  const [word, setWord] = useState("Swipe if you...\n< don't know this word\nknow this word >")

  const [garbase, reset] = useState(0)

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

        const xValue = pan.x.__getValue()
        const xRatio = xValue / width

        setRotation(
          Math.max(-MAX_ROTATION,Math.min(MAX_ROTATION,
            xValue / 10.0 * Math.abs(xRatio)
          )) + 'deg'
        )
        
        if (xRatio >= MAX_PAN) {
          setGradGreen(Math.min(MAX_GRAD_OPACITY,(xRatio - MAX_PAN)))
        } else {
          setGradGreen(0)
        }

        if (xRatio <= -MAX_PAN) {
          setGradRed(Math.max(-MAX_GRAD_OPACITY,(MAX_PAN - xRatio)/2))
        } else {
          setGradRed(0)
        }

        offsetX = - xValue / 2.0 * Math.abs(xRatio)

        forceUpdate()
      },
      onPanResponderRelease: () => {
        const xValue = pan.x.__getValue()
        const xRatio = xValue / width

        panning = false
        setRotation('0deg')
        canPan = ~canPan
        setGradGreen(0)
        setGradRed(0)
        offsetX = 0

        pan.extractOffset()

        if (xRatio >= MAX_PAN) {
          setWord(words[~~(Math.random() * words.length)])
        }
      },
    }),
  ).current

  useEffect( () => {
    if (panning) {

    } else {
      pan.setValue({ x: lerp(pan.x.__getValue(), 0, .1), y: 0 });

      if (Math.abs(pan.x.__getValue()) > 0.1) {
        console.log(pan.x.__getValue())
        forceUpdate()
      }
    }
  })

  useEffect( () => {
    getData('10000-data')
      .then( (arr) => {
        words = arr

        if (words === null) {
          fetchData()
        }
      } )
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
        start={{x: 0,y: 0}}
        end={{x: 1,y: 0}}
        style={styles.linearGradient}
        colors={['rgba(255,50,50,' + gradRed + ')','transparent','rgba(50,255,50,' + gradGreen + ')',]}
      />

      <Animated.View
        style={{
          transform: [
            {translateX: pan.x.__getValue() + offsetX},
            {translateY: -Math.abs(pan.x.__getValue()) * 0.1},
          ],
          width: '100%',
          height: '100%',
        }}
        {...panResponder.panHandlers}>
        
        <Text
          adjustsFontSizeToFit
          style={{
            fontSize: 32,
            fontFamily: 'SoftBold',
            
            transform: [
              {rotateZ: rotation},
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
    alignItems: 'initial',
    justifyContent: 'center',
  },
  linearGradient: {
    flex: 1,
    backgroundColor: 'transparent',
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
})
