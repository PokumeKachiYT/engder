import { Dimensions } from 'react-native'
const { width, height } = Dimensions.get('window')

import { useFonts } from "expo-font"
import { StatusBar } from 'expo-status-bar'
import { StyleSheet, Text, View } from 'react-native'
import { PanResponder, Animated } from 'react-native'
import React, { useState, useEffect, useRef } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'

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
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (event, gestureState) => {
        panEvent(event, gestureState)
        const panX = pan.x.__getValue()
        setRotateY(
          panX / width * 150 + 'deg'
        )
      },

      onPanResponderRelease: () => {
        pan.extractOffset()
      },
    }),
  ).current

  const words = useRef([])

  useEffect( () => {
    getData('100000-data')
    .then( (arr) => {
      words.current = arr
      
      if (words.current === null) {
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
      <Animated.View
        style={{
          //backgroundColor: "#000000",

          transform: [
            {translateX: pan.x},
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
        >life roblox</Text>
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
