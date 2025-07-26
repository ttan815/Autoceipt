import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  Dimensions,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCameraPermissions } from 'expo-camera';
import { useRoute, useNavigation } from '@react-navigation/native';
import mime from 'mime';

export default function EditImageScreen() {
  const [facing, setFacing] = useState('back');
  const [permission, requestPermission] = useCameraPermissions();
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();
  const route = useRoute();


  const receiptData = route.params?.data || {};

  const [cardLast4, setCardLast4] = useState('');
  const [date, setDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [subTotal, setSubTotal] = useState('');
  const [tax, setTax] = useState('');
  const [time, setTime] = useState('');
  const [total, setTotal] = useState('');
  const [storeAddress, setStoreAddress] = useState('');
  const [storeName, setStoreName] = useState('');
  const [storeId, setStoreId] = useState('');
  const navigation = useNavigation();
    useEffect(() => {
    if (receiptData) {
        setCardLast4(receiptData.cardLast4 || '');
        setDate(receiptData.date || '');
        setPaymentMethod(receiptData.paymentMethod || '');
        setSubTotal(receiptData.subTotal || '');
        setTax(receiptData.tax || '');
        setTime(receiptData.time || '');
        setTotal(receiptData.total || '');
        setStoreAddress(receiptData.storeAddress || '');
        setStoreName(receiptData.storeName || '');
        setStoreId(receiptData.id?.toString() || '');
    }
    }, [receiptData]);



  return (
    <View style={styles.contentWrapper}>
      <View style={styles.topBlock} />

      <View style={{ flex: 2 }}>
        <ScrollView
          contentContainerStyle={styles.editFields}
          keyboardShouldPersistTaps="handled"
        >
         <Text style={styles.sectionHeader}>Purchase Details</Text>

        <Text style={styles.inputLabel}>Card Last 4</Text>
        <TextInput style={styles.input} value={cardLast4} onChangeText={setCardLast4} placeholder="Card Last 4" />

        <Text style={styles.inputLabel}>Purchase Date</Text>
        <TextInput style={styles.input} value={date} onChangeText={setDate} placeholder="Date" />

        <Text style={styles.inputLabel}>Payment Method</Text>
        <TextInput style={styles.input} value={paymentMethod} onChangeText={setPaymentMethod} placeholder="Payment Method" />

        <Text style={styles.inputLabel}>Subtotal</Text>
        <TextInput style={styles.input} value={subTotal} onChangeText={setSubTotal} placeholder="Subtotal" />

        <Text style={styles.inputLabel}>Tax</Text>
        <TextInput style={styles.input} value={tax} onChangeText={setTax} placeholder="Tax" />

        <Text style={styles.inputLabel}>Time of Purchase</Text>
        <TextInput style={styles.input} value={time} onChangeText={setTime} placeholder="Time" />

        <Text style={styles.inputLabel}>Total</Text>
        <TextInput style={styles.input} value={total} onChangeText={setTotal} placeholder="Total" />

        <Text style={styles.sectionHeader}>Store Information</Text>

        <Text style={styles.inputLabel}>Store Address</Text>
        <TextInput style={styles.input} value={storeAddress} onChangeText={setStoreAddress} placeholder="Store Address" />

        <Text style={styles.inputLabel}>Store Name</Text>
        <TextInput style={styles.input} value={storeName} onChangeText={setStoreName} placeholder="Store Name" />

        <Text style={styles.inputLabel}>Store ID</Text>
        <TextInput style={styles.input} value={storeId} onChangeText={setStoreId} placeholder="Store ID" />
        <TouchableOpacity onPress={()=>navigation.navigate("MainScreen")}>
            <Text>Go Back</Text>
        </TouchableOpacity>
        </ScrollView>
      </View>

      <View style={{ flex: 3.2 }}>
        <ScrollView
          contentContainerStyle={styles.zoomImageContainer}
          maximumZoomScale={4}
          minimumZoomScale={1}
          pinchGestureEnabled={true}
          horizontal={true}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          bouncesZoom={true}
        >

        <Image
        source={{ uri: route.params?.imageURL }}
        style={styles.image}
        />

        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  contentWrapper: {
    flex: 1,
    backgroundColor: '#fff',
  },
  zoomImageContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: Dimensions.get('window').width,
    height: '100%',
    resizeMode: 'contain',
  },
  topBlock: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 50,
    backgroundColor: '#f9fafb',
    zIndex: 1000,
  },
  editFields: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingTop: 40,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    alignSelf: 'center',
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 12,
    width: '85%',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  inputLabel: {
  alignSelf: 'flex-start',
  marginLeft: '7.5%',
  marginBottom: 4,
  fontWeight: '600',
  color: '#333',
},

});
