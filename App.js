import { Dimensions } from 'react-native'
const { width, height } = Dimensions.get('window')

import { useFonts } from "expo-font"
import { StatusBar } from 'expo-status-bar'
import { StyleSheet, Text, View } from 'react-native'
import { PanResponder, Animated } from 'react-native'
import React, { useState, useEffect, useRef } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import {LinearGradient} from 'expo-linear-gradient';

let panning = false
let canPan = false
let words = null

const MAX_ROTATION = 60
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

export default function App() {
  const [rotateY, setRotateY] = useState('0deg')
  const [offsetX, setOffsetX] = useState(0)
  const [gradRed, setGradRed] = useState(0)
  const [gradGreen, setGradGreen] = useState(0)
  const [word, setWord] = useState("Swipe if you...\n< don't know this word\nknow this word >")

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
        const xValue = pan.x.__getValue()
        const xRatio = xValue / width

        panEvent(event, gestureState)
        setRotateY(
          Math.max(-MAX_ROTATION,Math.min(MAX_ROTATION,
            xValue * Math.abs(xValue / 2 / width)
          )) + 'deg'
        )

        if (xRatio >= MAX_PAN) {
          setGradGreen(Math.min(MAX_GRAD_OPACITY,(xRatio - MAX_PAN)))
        } else {
          setGradGreen(0)
        }

        if (xRatio <= -MAX_PAN) {
          setGradRed(Math.max(-MAX_GRAD_OPACITY,(MAX_PAN - xRatio) / 2))
        } else {
          setGradRed(0)
        }
      },

      onPanResponderRelease: () => {
        const xValue = pan.x.__getValue()
        const xRatio = xValue / width

        panning = false
        setRotateY('0deg')
        canPan = ~canPan
        setGradGreen(0)
        setGradRed(0)

        pan.setValue({ x: 0, y: 0 });

        pan.extractOffset()

        if (xRatio >= MAX_PAN) {
          setWord(words[~~(Math.random() * words.length)])
        }
      },
    }),
  ).current

  useEffect( () => {
    if (panning) {
      setOffsetX(
        -pan.x.__getValue() * Math.min(1,Math.abs(pan.x.__getValue() / 1.5 / width))
      )
    } else {
      setOffsetX(0)
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
