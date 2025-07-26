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

  const data = route.params?.data || {};
  const receiptData = data["Receipt Message"] || {};

  const [cardLast4, setCardLast4] = useState('');
  const [date, setDate] = useState('');
  const [imageURL, setImageURL] = useState('');
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
      const metadata = receiptData.metadata || {};
      const vendor = receiptData.vendor || {};

      setCardLast4(metadata.cardLast4 || '');
      setDate(metadata.date || '');
      setImageURL(metadata.imageURL || '');
      setPaymentMethod(metadata.paymentMethod || '');
      setSubTotal(metadata.subTotal || '');
      setTax(metadata.tax || '');
      setTime(metadata.time || '');
      setTotal(metadata.total || '');

      setStoreAddress(vendor.storeAddress || '');
      setStoreName(vendor.storeName || '');
      setStoreId(vendor.store_id || '');
    }
  }, [receiptData]);

  const { width } = Dimensions.get('window');
  const saveReceiptChanges = async (uri) =>{
    const formData = new FormData();
    const fileType = mime.getType(uri); 
    formData.append('imagefile', {
        uri,
        name: 'receipt.' + mime.getExtension(fileType), 
        type: fileType || 'image/*',
    });
    
    const token = await AsyncStorage.getItem('accessToken');
    formData.append('cardLast4', cardLast4);
    formData.append('date', date);
    formData.append('paymentMethod', paymentMethod);
    formData.append('subTotal', subTotal);
    formData.append('tax', tax);
    formData.append('time', time);
    formData.append('total', total);
    formData.append('storeAddress', storeAddress);
    formData.append('storeName', storeName);
    formData.append('storeId', storeId);
    const res = await fetch('http://10.0.0.197:5001/uploadsubmission', {
        method: 'POST',
        headers: {
        'Authorization': `Bearer ${token}`,
        },
        body: formData,
    });
console.log("Status:", res.status);
console.log("OK:", res.ok);

    // To print the JSON response body (if any)
    try {
    const data = await res.json();
    console.log("Response JSON:", data);
    } catch (err) {
    console.log("Failed to parse JSON:", err);
    const text = await res.text();
    console.log("Raw response text:", text);
    }
    navigation.navigate("MainScreen")
    
  }
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

        <TouchableOpacity onPress={() => saveReceiptChanges(route.params?.imageUri)}>
        <Text style={{ fontWeight: 'bold' }}>Submit Changes</Text>
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
            source={{ uri: route.params?.imageUri }}
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
