import React from 'react';
import { StyleSheet, Text, View, SafeAreaView, TextInput, TouchableOpacity, Image, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useDeviceOrientation } from '@react-native-community/hooks';
import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SignUpScreen() {
    const navigation = useNavigation();
    const deviceOrientation = useDeviceOrientation();
    const windowWidth = Dimensions.get('window').width;
    const windowHeight = Dimensions.get('window').height;

    const buttonWidth = Math.min(Math.max(windowWidth * 0.6, 200), 400);
    const buttonHeight = Math.min(Math.max(windowHeight * 0.06, 48), 64);

    const appLogoWidth = windowWidth*.28
    const titleFontSize = Math.min(Math.max(windowWidth * 0.08, 28), 36); 

    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const verifyAccount = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!username || !email || !password || !confirmPassword) {
        alert("Please fill in all fields.");
        return;
    }
    if (!emailRegex.test(email)) {
        alert("Please enter a valid email address.");
        return;
    }
    if (password !== confirmPassword) {
        alert("Passwords do not match.");
        return;
    }

    try {
        const response = await fetch("http://10.0.0.197:5001/register", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            name: username,  // Flask expects "name"
            email: email,
            password: password,
            confirmPassword: confirmPassword,
        }),
        });
        const data = await response.json();
        

        if (response.ok && data.status === true) {
        // Success - do something (e.g. navigate or store token)
        await AsyncStorage.setItem("accessToken", data.access_token);
        navigation.navigate('MainScreen')
        } else {
        // Handle known errors
        alert("An error occured, please try again later.");
        }
    } catch (error) {
        console.error("Error during registration:", error);
        alert("An error occurred while connecting to the server.");
    }
    };

return (
    <SafeAreaView style={styles.container}>
    <View style={styles.viewContainer}>
        <Image
        source={require('../assets/autoceiptIcon.png')} 
        style={[{ width: appLogoWidth, height: appLogoWidth }, styles.appLogo]}
        />
        <Text style={[styles.appTitle,{fontSize:titleFontSize}]}>Autoceipt</Text>
        <TextInput
            style={[styles.loginTop,{width:buttonWidth, height:buttonHeight}]}
            placeholder='Username'
            autoCapitalize="none"
            placeholderTextColor="#555"
            value={username}
            onChangeText={setUsername}
        />
        <TextInput
            style={[styles.loginMiddle,{width:buttonWidth, height:buttonHeight}]}
            placeholder='Email'
            autoCapitalize="none"
            placeholderTextColor="#555"
            value={email}
            onChangeText={setEmail}
        />
        <TextInput
            style={[styles.loginMiddle,{width:buttonWidth,height:buttonHeight}]}
            placeholder='Password'
            placeholderTextColor="#555"
            secureTextEntry={true}
            value={password}
            onChangeText={setPassword}
        />
        <TextInput
            style={[styles.loginBottom,{width:buttonWidth, height:buttonHeight}]}
            placeholder='Confirm Password'
            autoCapitalize="none"
            placeholderTextColor="#555"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
        />
        <TouchableOpacity
        activeOpacity={0.6}
        style={[styles.loginButton, { width: buttonWidth, height: buttonHeight }]}
        onPress={verifyAccount}
        >
        <Text style={styles.buttonText}>Create Account</Text>
        </TouchableOpacity>



    <View style={{ flexDirection: 'row', marginTop: 15 }}>
    <Text style={{ fontSize: 16, fontWeight: '300', color: '#333' }}>
        Already have an account?
    </Text>
    <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={{ fontSize: 16, fontWeight: '500', color: '#007AFF', marginLeft: 5 }}>
        Log In
        </Text>
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
    position:"relative",
    top:-90,
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
    loginButton: {
    alignItems: 'center',
    backgroundColor: '#FDFBF9',
    padding: 10,
    justifyContent: 'center',
    position:'relative',
    top:-40,
    borderWidth:1,
    borderRadius:15
    },
    signUpButton:{
    alignItems: 'center',
    // backgroundColor: '#0A84FF',
    padding: 10,
    justifyContent: 'center',
    position:'relative',
    top:15,
    borderWidth:1,
    borderRadius:15
    },
    forgotPasswordButton:{
    alignItems: 'center',
    padding: 10,
    color:'#000000',
    justifyContent: 'center',
    position:'relative',
    top:-40,
    fontWeight:'bold',
    },
    buttonText: {
    color: 'black',
    fontSize: 16,
    fontWeight: '600',
},
    loginTop: {
    borderColor:'#B0B0B0',
    borderWidth:2,
    padding:8,
    borderBottomWidth:0,
    borderTopLeftRadius:10,
    borderTopRightRadius:10,
    position:'relative',
    top:-65,
    },
    loginMiddle: {
    borderColor:'#B0B0B0',
    borderWidth:2,
    padding:8,
    borderTopWidth:2,
    borderBottomWidth:0,
    position:'relative',
    top:-65,
    },
    loginBottom: {
    borderColor:'#B0B0B0',
    borderWidth:2,
    padding:8,
    borderBottomLeftRadius:10,
    borderBottomRightRadius:10,
    position:'relative',
    top:-65,
    },
});