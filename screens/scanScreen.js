import React from 'react';
import * as ImagePicker from 'expo-image-picker';
import { StyleSheet, Text, View, SafeAreaView, TextInput, TouchableOpacity, Image, Dimensions } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useDeviceOrientation } from '@react-native-community/hooks';
import mime from 'mime';
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
    const galleryIcon = scheme === 'light'
    ? require('../assets/galleryIcon.png')
    : require('../assets/galleryIcon.png')
const navigation = useNavigation();
    useFocusEffect(
      React.useCallback(() => {
        let intervalId = null;

        const checkToken = async () => {
          const token = await AsyncStorage.getItem("accessToken");

          if (!token) {
            alert("Your session has expired. Please log in again to continue.");
            navigation.navigate("Login");
            return;
          }

          try {
            const response = await fetch('http://10.0.0.197:5001/checkToken', {
              method: 'GET',
              headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/json',
                'Content-Type': 'application/json',
              },
            });

            if (!response.ok) {
              alert("Your session has expired. Please log in again to continue.");
              navigation.navigate("Login");
            } else {
              const data = await response.json();
              // console.log("Token is valid:", data.ValidToken);
            }
          } catch (err) {
            console.error("Error checking token:", err);
            navigation.navigate("Login");
          }
        };
        checkToken();
        
        intervalId = setInterval(() => {
          checkToken();
        }, 30000);

        return () => {
          clearInterval(intervalId);
        };
      }, [navigation])
    );
  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes:  ['images'],
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled) {
      const image = result.assets[0]; 
      const data = await uploadImage(image.uri); 
      navigation.navigate("Edit", { imageUri: image.uri, "data":  data});           
    }
  };

  const uploadImage = async (uri) => {
  const formData = new FormData();
  const fileType = mime.getType(uri); 

  formData.append('image', {
    uri,
    name: 'receipt.' + mime.getExtension(fileType), 
    type: fileType || 'image/*',
  });

  const token = await AsyncStorage.getItem('accessToken');
  const res = await fetch('http://10.0.0.197:5001/create', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'multipart/form-data',
    },
    body: formData,
  });

  const data = await res.json();
  return data
  // console.log(data);
};

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
        <TouchableOpacity onPress={pickPhoto}>
                <Image source={galleryIcon} style={styles.gallaryBtn}></Image>
        </TouchableOpacity>
        <TouchableOpacity>
                <Image source={cameraCaptureIcon} style={styles.takePhotoBtn}></Image>
        </TouchableOpacity>
                <TouchableOpacity onPress={toggleCameraFacing}>
                <Image source={rotateCameraIcon} style={styles.swapCameraRotationBtn}></Image>
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
cameraUI: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  backgroundColor: '#333333ff',
  width: '100%',           
  position:'relative',
  bottom:0,
  paddingBottom:'50'
},

  takePhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333333ff',
    borderRadius: 12,
    width: 64,
    height: 64,
  },
    swapCameraRotationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333333ff',
    borderRadius: 12,
    width: 64,
    height:64,
  },
  gallaryBtn: {
    flexDirection: 'row',
    alignSelf:'start',
    backgroundColor: '#333333ff',
    borderRadius: 12,
    width:64,
    height:64,
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
    justifyContent:'center',
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    padding: 12,
    // borderRadius: 8,
    width:'75%'
},
text: {
  color: 'white',
  fontSize: 18,
  textAlign:'center',
}

});

