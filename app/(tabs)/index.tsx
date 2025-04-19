import React from 'react';
import { View } from 'react-native';
import { createStackNavigator } from "@react-navigation/stack";
import NotesListScreen from '../../src/screens/NotesListScreen';
import DrawingScreen from '../../src/screens/DrawingScreen';
import PdfPickerScreen from '@/src/screens/PdfPickerScreen';


const Stack = createStackNavigator();


    function TabsScreen() {
        return (

          <View style={{ flex: 1 }}>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
              <Stack.Screen name="Drawing" component={DrawingScreen} />
              <Stack.Screen name="NotesList" component={NotesListScreen} />
              <Stack.Screen name="PdfPicker" component={PdfPickerScreen}/>
            </Stack.Navigator>
          </View>
        );
      }

export default TabsScreen;