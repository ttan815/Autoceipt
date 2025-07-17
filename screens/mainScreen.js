import React from 'react';
import * as ImagePicker from 'expo-image-picker';
import { StyleSheet, Text, View, SafeAreaView, TextInput, TouchableOpacity, Image, Dimensions } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useDeviceOrientation } from '@react-native-community/hooks';

import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme , Linking, Alert} from 'react-native';
import { Camera, CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import AsyncStorage from '@react-native-async-storage/async-storage';



export default function SignUpScreen() {
    const navigation = useNavigation();
    const deviceOrientation = useDeviceOrientation();
    const windowWidth = Dimensions.get('window').width;
    const windowHeight = Dimensions.get('window').height;
    

    const buttonWidth = Math.min(Math.max(windowWidth * 0.6, 200), 400);
    const buttonHeight = Math.min(Math.max(windowHeight * 0.06, 48), 64);

    const appLogoWidth = windowWidth*.28
    const titleFontSize = Math.min(Math.max(windowWidth * 0.08, 30), 32); 
    const recentReceiptFontSize = Math.min(Math.max(windowWidth * 0.08, 20), 24); 
    const categoryFontSize = Math.min(Math.max(windowWidth * 0.08, 24), 26); 
    const wordFontSize = Math.min(Math.max(windowWidth * 0.08, 20), 21); 
    const navBarFontSize = Math.min(Math.max(windowWidth * 0.08, 22), 24); 
    const insets = useSafeAreaInsets();
    const scheme = useColorScheme();
    const homeIcon =
  scheme === 'light'
    ? require('../assets/homeIcon.png')
    : require('../assets/homeIcon.png');
    const receiptIcon =
  scheme === 'light'
    ? require('../assets/receiptIcon.png')
    : require('../assets/receiptIcon.png');
    const cameraIcon =
  scheme === 'light'
    ? require('../assets/cameraIcon.png')
    : require('../assets/cameraIcon.png');
    const analyticsIcon =
  scheme === 'light'
    ? require('../assets/analyticsIcon.png')
    : require('../assets/analyticsIcon.png');
    const settingsIcon =
  scheme === 'light'
    ? require('../assets/settingsIcon.png')
    : require('../assets/settingsIcon.png');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    
    // Camera Settings
    const [statusCameraAccess, requestPermissionCamera] = ImagePicker.useCameraPermissions();
    const [statusMediaLibraryAccess, requestPermissionMediaLibrary] = ImagePicker.useMediaLibraryPermissions();

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

const ensureCameraPermission = async () => {
  // If permanently denied already
  if (statusCameraAccess && !statusCameraAccess.granted && !statusCameraAccess.canAskAgain) {
      Alert.alert(
        "Camera Access Needed",
        "You’ve previously denied camera access. Please enable it in Settings to scan receipts.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Open Settings", onPress: () => Linking.openSettings() }
        ]
      );

    return false;
  }

  // Try requesting permission (if allowed to ask)
  if (!statusCameraAccess?.granted) {
    const permissionResponse = await requestPermissionCamera();

    if (!permissionResponse.granted) {
      if (!permissionResponse.canAskAgain) {
        Alert.alert(
          "Camera Access Needed",
          "You’ve previously denied camera access. Please enable it in Settings to scan receipts.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Open Settings", onPress: () => Linking.openSettings() }
          ]
        );
      } else {
        alert("Camera permission is required to use this feature.");
      }
      return false;
    }
    
  }

  return true;
};

const ensureMediaLibraryPermission = async () => {
  // If permanently denied already
  if (statusMediaLibraryAccess && !statusMediaLibraryAccess.granted && !statusMediaLibraryAccess.canAskAgain) {
      Alert.alert(
        "Camera Access Needed",
        "You’ve previously denied camera access. Please enable it in Settings to scan receipts.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Open Settings", onPress: () => Linking.openSettings() }
        ]
      );

    return false;
  }

  // Try requesting permission (if allowed to ask)
  if (!statusMediaLibraryAccess?.granted) {
    const permissionResponse = await requestPermissionMediaLibrary();

    if (!permissionResponse.granted) {
      if (!permissionResponse.canAskAgain) {
        Alert.alert(
          "Media Library Recommended",
          "You’ve previously denied media library access. Please enable it in Settings to upload receipts.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Open Settings", onPress: () => Linking.openSettings() }
          ]
        );
      } else {
        alert("Media Library permission is required to use this feature.");
      }
      return false;
    }
    
  }

  return true;
};
return (
    <SafeAreaView style={styles.container}>
    <View style={styles.viewContainer}>
        <Text style={[styles.appTitle,{fontSize:titleFontSize}, styles.appLogo]}>Autoceipts</Text>
    <View style={{ flexDirection: 'row', marginTop: 15 }}>
    </View>
    <View style={[styles.viewContainer, styles.recentReceiptsContainer]}>
        <Text style={{fontSize:recentReceiptFontSize}}>Most Recent Receipts</Text>
        <View style={styles.recentReceiptItem}> 
            <View>
            <Text style={{fontSize:wordFontSize, fontWeight:'600'}}>Cosoqweiuq...</Text>
            <Text style={{fontSize:wordFontSize}}>08-15-2003</Text>
            <Text style={{fontSize:wordFontSize, fontWeight:'500'}}>$15.00</Text>
            </View>
            {/* <View style={{ flex: .8 }} /> */}
            <View style={styles.recentReceiptItemDetail}>
            <TouchableOpacity>
                <Text style={[{fontSize:wordFontSize}]}>
                Details
                </Text>
            </TouchableOpacity>
            </View>
        </View>
        
    </View>
    <View style={[styles.navBarContainer, { backgroundColor:'gray',height:windowHeight*.08}]}>

    <TouchableOpacity style={{ flex: 1, alignItems: 'center', textAlign:"center" }} onPress={() => navigation.navigate('Login')}>
        <View style={{flexDirection:'column'}}>
            <Image source={homeIcon} style={{ width: 24, height: 24, alignSelf:'center' }} />
            <Text>
            Home
            </Text>
        </View>
    </TouchableOpacity>
        <TouchableOpacity style={{ flex: 1, alignItems: 'center', textAlign:"center" }} onPress={() => navigation.navigate('Login')}>
        <View style={{flexDirection:'column'}}>
            <Image source={receiptIcon} style={{ width: 24, height: 24, alignSelf:'center' }} />
            <Text>
            Receipt
            </Text>
        </View>
    </TouchableOpacity>
        <TouchableOpacity style={{ flex: 1, alignItems: 'center', textAlign:"center" }}  
        onPress={async () => {
            const hasPermissionForCamera = await ensureCameraPermission();
            if (hasPermissionForCamera) {
              const hasPermissionForMediaLibrary = await ensureMediaLibraryPermission();
              if (hasPermissionForMediaLibrary){
                navigation.navigate("Scan")
              }
            }
            }}
        >
        <View style={{flexDirection:'column'}}>
            <Image source={cameraIcon} style={{ width: 24, height: 24, alignSelf:'center' }} />
            <Text>
              Scan
            </Text>
        </View>
    </TouchableOpacity>
            <TouchableOpacity style={{ flex: 1, alignItems: 'center', textAlign:"center" }} onPress={() => navigation.navigate('Login')}>
        <View style={{flexDirection:'column'}}>
            <Image source={analyticsIcon} style={{ width: 24, height: 24, alignSelf:'center' }} />
            <Text>
            Analytics
            </Text>
        </View>
    </TouchableOpacity>
            <TouchableOpacity style={{ flex: 1, alignItems: 'center', textAlign:"center" }} onPress={() => navigation.navigate('Login')}>
        <View style={{flexDirection:'column'}}>
            <Image source={settingsIcon} style={{ width: 24, height: 24, alignSelf:'center' }} />
            <Text>
            Settings
            </Text>
        </View>
    </TouchableOpacity>
    </View>


    </View>
    <View>
        <StatusBar style="auto" />
    </View>
    </SafeAreaView>
    );
}


const styles = StyleSheet.create({
    container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    },
    viewContainer:{
    flex:1,
    flexDirection:'column',
    alignItems:'center',
    justifyContent:'center'
    },
    appLogo:{
    position:"absolute",
    top:15,
    },
    appTitle:{
    // backgroundColor:'red',
    position:'relative',
    top:-90,
    fontWeight:'600',
    textAlign:'center',
    },
    fontColor:{
    color:"#1C1C1E"
    },
    navBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    position: 'absolute',
    bottom: 0,
    backgroundColor: '#FDFBF9',
    width: '90%',
    height: 50,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    borderRadius:15,
    // paddingHorizontal: 16, // or 20 for more space

    },
    recentReceiptsContainer: {
    position: 'absolute',
    top: 80,
    width: '100%',
    paddingHorizontal: 50,
    alignItems: 'flex-start',
    },
    recentReceiptItem:{
        paddingTop:15,
        paddingBottom:15,
        paddingLeft:15,
        flexDirection:'row',
        backgroundColor:'white',
        borderWidth:1,
        borderRadius:15,
        width:'100%',
        marginTop:'8',
    },
    recentReceiptItemDetail:{
  paddingVertical: 6,
  paddingHorizontal: 12,
  borderWidth: 1,
  borderColor: '#D1D5DB',
  borderRadius: 8,
  justifyContent: 'center',
  alignItems: 'center',
  alignSelf: 'center',
  position:'absolute',
  right:15,
    }
});