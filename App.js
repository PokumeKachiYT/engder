import { Dimensions } from 'react-native'
const { width, height } = Dimensions.get('window')

import { useFonts } from "expo-font"
import { StatusBar } from 'expo-status-bar'
import { StyleSheet, Text, View } from 'react-native'
import { PanResponder, Animated } from 'react-native'
import React, { useState, useEffect, useRef, useReducer } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import {LinearGradient} from 'expo-linear-gradient';

let words = null

let panning = false
let viewDef = false

let posX = 0.0
let gradRed = 0.0
let gradGreen = 0.0
let rotation = 0

let isWord = false
const normalColor = '#920050'
let textColor = normalColor

let word = "Swipe right for the next word, left for definition"

const MAX_ROTATION = 20
const MAX_PAN = 0.05
const MAX_GRAD_OPACITY = 0.25

const API_KEY = "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"

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
  fetch('https://websites.umich.edu/~jlawler/wordlist')
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

const nextWord = () => {
  word = words[~~(Math.random() * words.length)]
  textColor = '#6200EE'
  isWord = true
}

const lerp = (start, end, alpha) => ((1.0 - alpha) * start + alpha * end)

export default function App() {
  const [, forceUpdate] = useReducer(x => x + 1, 0);


  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => {
        panning = true
        return true
      },
      onPanResponderMove: (event, gestureState) => {
        const xValue = gestureState.dx
        const xRatio = xValue / width

        posX = xValue / 2.0 * Math.abs(xRatio)

        rotation = Math.max(-MAX_ROTATION,Math.min(MAX_ROTATION,
          xValue / 30.0 * Math.abs(xRatio)
        ))
        
        if (xRatio >= MAX_PAN) {
          gradGreen = Math.min(MAX_GRAD_OPACITY,(xRatio - MAX_PAN))
        } else {
          gradGreen = 0.0
        }

        if (xRatio <= -MAX_PAN) {
          gradRed = Math.min(MAX_GRAD_OPACITY,(MAX_PAN - xRatio)/2)
        } else {
          gradRed = 0.0
        }

        forceUpdate()
      },
      onPanResponderRelease: (event, gestureState) => {
        const xValue = posX
        const xRatio = xValue / width

        const intervalID = setInterval(() => {
          let update = false

          if (Math.abs(posX) > 0.2) {
            posX = lerp(posX,0.0,0.1)
            update = true
          }

          if (Math.abs(rotation) > 0.1) {
            rotation = lerp(rotation,0,0.1)
            update = true
          }
      
          if (Math.abs(gradGreen) > 0.01) {
            gradGreen = lerp(gradGreen,0,0.05)
            update = true
          }

          if (Math.abs(gradRed) > 0.01) {
            gradRed = lerp(gradRed,0,0.05)
            update = true
          }

          if (!update) clearInterval(intervalID)

          forceUpdate()
        }, 10);

        if (xRatio >= MAX_PAN) {
          nextWord()

          forceUpdate()
        }
        if (xRatio <= -MAX_PAN) {
          const body = {
            "model": "gpt-3.5-turbo",
            "messages" : [
              {"role": "user","content": "define " + word + " in english in 7 words say nothing else"}
            ],
            "temperature": 0.7
          }

          /*fetch("https://api.openai.com/v1/chat/completions",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + API_KEY,
              },
              body: JSON.stringify(body),
            }).then(
              (res) => {
                if (res.ok) {
                  console.log(res)
                } else {
                  setWord(words[~~(Math.random() * words.length)])
                }
              }
            )*/

          if (isWord) {
            textColor = normalColor
            fetch("https://api.dictionaryapi.dev/api/v2/entries/en/" + word).then(
              (res) => {
                if (res.ok) {
                  res.json().then(
                    (data) => {
                      word = data[0].meanings[0].definitions[0].definition
                      forceUpdate()
                    }
                  )
                } else {
                  nextWord()
                }
              }
            )

            isWord = false
          } else {
            nextWord()
          }


          forceUpdate()
        }
      },
    }),
  ).current

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
        colors={[`rgba(255,50,50,${gradRed ? gradRed : 0.0})`,`transparent','rgba(50,255,50,${gradGreen ? gradGreen : 0.0})`,]}
      />

      <Animated.View
        style={{
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
              {translateX: posX},
              {translateY: -Math.abs(posX) * 0.1},
              {rotateZ: rotation + 'deg'},
            ],

            color: textColor,

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
