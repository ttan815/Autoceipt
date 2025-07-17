import React from 'react';
import * as ImagePicker from 'expo-image-picker';
import { StyleSheet, Text, View, SafeAreaView, TextInput, TouchableOpacity, Image, Dimensions, Button } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useDeviceOrientation } from '@react-native-community/hooks';

import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme , Linking, Alert} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';

export default function ScanCameraScreen() {
    const [facing, setFacing] = useState('back');
    const [permission, requestPermission] = useCameraPermissions();
    const insets = useSafeAreaInsets();
    const windowHeight = Dimensions.get('window').height;
    const scheme = useColorScheme();
    const rotateCameraIcon =
    scheme === 'light'
    ? require('../assets/rotateCameraIcon.png')
    : require('../assets/rotateCameraIcon.png');
    const cameraCaptureIcon =
    scheme === 'light'
    ? require('../assets/cameraCaptureIcon.png')
    : require('../assets/cameraCaptureIcon.png');

    if (!permission) return <View><Text>Camera access required to scan</Text></View>;
    if (!permission.granted) {
        return (
        <View style={styles.container}>
            <Text style={styles.message}>Camera access is required</Text>
            <Image></Image>
            <Button onPress={requestPermission} title="Grant Permission" />
        </View>
        );
    }

    function toggleCameraFacing() {
        setFacing((current) => (current === 'back' ? 'front' : 'back'));
    }

  return (
    <View style={{ flex: 1 }}>
    <CameraView style={{ flex: 1 }} facing={facing} />

    <View style={[styles.overlay,styles.cameraUI]}>
        <TouchableOpacity onPress={toggleCameraFacing}>
                <Image source={rotateCameraIcon} style={{width:'64', height:'64', backgroundColor:'red'}}></Image>
        </TouchableOpacity>
        <TouchableOpacity>
                <Image source={cameraCaptureIcon} style={{width:'64', height:'64', }}></Image>
        </TouchableOpacity>
    </View>
    </View>

  );
}



const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    marginBottom: 40,
  },
  cameraUI:{
    flexDirection:'row',
    alignItems:'center',
    backgroundColor:'blue',
  },
  takePhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DFF1FF',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    width: '90%',
    marginBottom: 20,
  },
  gallaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8FAE9',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    width: '90%',
  },
  icon: {
    width: 24,
    height: 24,
    marginRight: 12,
    resizeMode: 'contain',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#1C1C1E',
  },
  overlay: {
    lex:1,
    justifyContent:'center',
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    padding: 12,
    borderRadius: 8,
    width:'75%'
},
text: {
  color: 'white',
  fontSize: 18,
  textAlign:'center',
}

});

