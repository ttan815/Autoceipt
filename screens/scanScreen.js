import React from 'react';
import * as ImagePicker from 'expo-image-picker';
import { StyleSheet, Text, View, SafeAreaView, TextInput, TouchableOpacity, Image, Dimensions } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useDeviceOrientation } from '@react-native-community/hooks';

import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme , Linking, Alert} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ScanScreen() {
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
            const response = await fetch('http://localhost:5001/checkToken', {
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
  const handleTakePhoto = async () => {
    // Insert camera logic here
    console.log("Taking a photo...");
  };

  const handleUploadPhoto = async () => {
    // Insert upload logic here
    console.log("Uploading from gallery...");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Scan Receipt</Text>

        <TouchableOpacity style={styles.takePhotoBtn} onPress={handleTakePhoto}>
          <Image
            source={require('../assets/cameraIcon.png')}
            style={styles.icon}
          />
          <Text style={styles.buttonText}>Take a Photo</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.uploadBtn} onPress={handleUploadPhoto}>
          <Image
            source={require('../assets/galleryIcon.png')}
            style={styles.icon}
          />
          <Text style={styles.buttonText}>Upload from Gallery</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
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
  uploadBtn: {
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
});

