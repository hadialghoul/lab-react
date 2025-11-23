import { StyleSheet, Text, View } from 'react-native'
import React from 'react'

export default function InvisalignScreen() {
  return (
    <View style={styles.container}>
      <Text>InvisalignScreen</Text>
    </View>
  )
}

const styles = StyleSheet.create({
    container:{
        flex:1,
        justifyContent:"center",
        alignItems:"center"
    }
})