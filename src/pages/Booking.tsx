import React, { useState, useEffect, useMemo, useRef } from 'react';
import { PRODUCTS, VENDOR, TRIP_RULE } from '../../constants';
import { BrickType } from '../../types';
import MapPicker from '../../components/MapPicker';
import { db, auth } from '../services/firebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import emailjs from '@emailjs/browser';

import qrCodeImage from "../assets/images/qr.jpeg";

const Booking: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    brickType: BrickType.CM,
    quantity: 2000,
    location: '',
    paymentMethod: 'cod',
    coordinates: { lat: 27.7172, lng: 85.3240 },
    isOutsideRingRoad: false,
    fullScreenMap: false
  });

  const [orderComplete, setOrderComplete] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [locationPermissionAsked, setLocationPermissionAsked] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const locationInputRef = useRef<HTMLInputElement>(null);

  // Common locations for Kathmandu Valley
  const commonLocations = [
  // Kathmandu - Central & Prime Areas
  "Balkhu, Kathmandu", "Kalanki, Kathmandu", "Koteshwor, Kathmandu",
  "New Baneshwor, Kathmandu", "Old Baneshwor, Kathmandu", "Thamel, Kathmandu",
  "Durbar Marg, Kathmandu", "Maharajgunj, Kathmandu", "Chabahil, Kathmandu",
  "Gaushala, Kathmandu", "Maitidevi, Kathmandu", "Sanepa, Lalitpur",
  "Pulchowk, Lalitpur", "Jawalakhel, Lalitpur", "Kumaripati, Lalitpur",
  "Bhaktapur Durbar Square", "Suryabinayak, Bhaktapur", "Madhyapur Thimi, Bhaktapur",
  "Tokha, Kathmandu", "Budhanilkantha, Kathmandu", "Gokarna, Kathmandu",
  "Boudha, Kathmandu", "Swayambhu, Kathmandu", "Pashupatinath, Kathmandu",
  
  // Kathmandu - Core City Centers
  "Baluwatar, Kathmandu", "Lazimpat, Kathmandu", "Naxal, Kathmandu",
  "Gyaneshwar, Kathmandu", "Dilli Bazar, Kathmandu", "Kamal Pokhari, Kathmandu",
  "Bagbazar, Kathmandu", "New Road, Kathmandu", "Asan, Kathmandu",
  "Tripureshwor, Kathmandu", "Teku, Kathmandu", "Thapathali, Kathmandu",
  "Maitighar, Kathmandu", "Babarmahal, Kathmandu", "Minbhawan, Kathmandu",
  "Tinkune, Kathmandu", "Sinamangal, Kathmandu", "Gairidhara, Kathmandu",
  
  // Kathmandu - North & West Expansion
  "Samakhushi, Kathmandu", "Basundhara, Kathmandu", "Dhapasi, Kathmandu",
  "Banasthali, Kathmandu", "Balaju, Kathmandu", "Nayabazar, Kathmandu",
  "Shorakhutte, Kathmandu", "Lainchaur, Kathmandu", "Dallu, Kathmandu",
  "Chhauni, Kathmandu", "Sitapaila, Kathmandu", "Syuchatar, Kathmandu",
  "Kuleshwor, Kathmandu", "Kalimati, Kathmandu", "Tahachal, Kathmandu",
  "Bhimsensthan, Kathmandu", "Ichangu Narayan, Kathmandu",
  
  // Kathmandu - East & Emerging Suburbs
  "Kapan, Kathmandu", "Mandikhatar, Kathmandu", "Hattigounda, Kathmandu",
  "Bansbari, Kathmandu", "Golfutar, Kathmandu", "Jorpati, Kathmandu",
  "Mulpani, Kathmandu", "Nayabasti, Kathmandu", "Pepsicola, Kathmandu",
  "Jadibuti, Kathmandu", "Kandaghari, Kathmandu", "Thali, Kathmandu",
  "Sankhu, Kathmandu", "Sundarijal, Kathmandu", "Daxinkali, Kathmandu",
  
  // Lalitpur - Major Urban Hubs
  "Jhamsikhel, Lalitpur", "Bakhundole, Lalitpur", "Kupondole, Lalitpur",
  "Patan Durbar Square", "Mangalbazar, Lalitpur", "Lagankhel, Lalitpur",
  "Satdobato, Lalitpur", "Gwarko, Lalitpur", "Balkumari, Lalitpur",
  "Imadol, Lalitpur", "Lubhu, Lalitpur", "Tikathali, Lalitpur",
  "Dhapakhel, Lalitpur", "Sunakothi, Lalitpur", "Thecho, Lalitpur",
  "Godawari, Lalitpur", "Badegaun, Lalitpur", "Thaiba, Lalitpur",
  "Bhainsepati, Lalitpur", "Bungamati, Lalitpur", "Khokana, Lalitpur",
  "Sainbu, Lalitpur", "Hattiban, Lalitpur", "Harisiddhi, Lalitpur",
  
  // Bhaktapur - Traditional & Expanding Areas
  "Sallaghari, Bhaktapur", "Jagati, Bhaktapur", "Kamalbinayak, Bhaktapur",
  "Changu Narayan, Bhaktapur", "Nagarkot, Bhaktapur", "Duwakot, Bhaktapur",
  "Jhaukhel, Bhaktapur", "Balkot, Bhaktapur", "Kaushaltar, Bhaktapur",
  "Lokanthali, Bhaktapur", "Gaththaghar, Bhaktapur", "Sipadol, Bhaktapur",
  "Nankhel, Bhaktapur", "Tathali, Bhaktapur", "Sudal, Bhaktapur",
  "Bageshwori, Bhaktapur", "Nagadesh, Bhaktapur", "Bode, Bhaktapur",
  
  // Valley Periphery & Growth Corridors
  "Thankot, Kathmandu", "Nagdhunga, Kathmandu", "Gurjudhara, Kathmandu",
  "Naikap, Kathmandu", "Ramkot, Kathmandu", "Goldhunga, Kathmandu",
  "Kirtipur, Kathmandu", "Panga, Kathmandu", "Chobhar, Kathmandu",
  "Machhegaun, Kathmandu", "Bishnu Devi, Kathmandu", "Matatirtha, Kathmandu",
  
  // Kathmandu - Historic Toles & Commercial Nodes
  "Ason Bazar, Kathmandu", "Indrachowk, Kathmandu", "Jyatha, Kathmandu", 
  "Bhotahity, Kathmandu", "Kilagal, Kathmandu", "Wotu, Kathmandu", 
  "Makhan, Kathmandu", "Pako, Kathmandu", "Khichapokhari, Kathmandu", 
  "Dharmapath, Kathmandu", "Kamalpokhari, Kathmandu", "Nagpokhari, Kathmandu", 
  "Bhatbhateni, Kathmandu", "Tusal, Kathmandu", "Chuchepati, Kathmandu", 
  "Mahakaltar, Kathmandu", "Kappan Height, Kathmandu", "Akashedhara, Kathmandu", 
  "Faika, Kathmandu", "Milanchowk, Kapan", "Thunankoop, Kathmandu", 
  "Simantal, Kathmandu", "Narayanthan, Kathmandu", "Deuba Chowk, Kathmandu", 
  "Taulung, Kathmandu", "Jitpur Phedi, Kathmandu", "Sangla, Kathmandu", 
  "Kavresthali, Kathmandu", "Phutung, Kathmandu", "Dharmasthali, Kathmandu", 
  "Tarkeshwor, Kathmandu", "Manamaiju, Kathmandu", "Gongabu Chowk, Kathmandu", 
  "Baniyatar, Kathmandu", "Jarankhu, Kathmandu", "Lola, Kathmandu", 
  "Swayambhu Thulo Bharyang, Kathmandu", "Halchowk, Kathmandu", 
  "Nagarjun, Kathmandu", "Raniban, Kathmandu", "Radhe Radhe Chowk, Kathmandu", 
  "White Gumba Area, Kathmandu", "Bafal, Kathmandu", "Solteemode, Kathmandu", 
  "Ravi Bhawan, Kathmandu", "Sanepa Height, Lalitpur",
  
  // Lalitpur - Interior Residential Zones
  "Patan Dhoka, Lalitpur", "Gabahal, Lalitpur", "Sundhara, Lalitpur", 
  "Chyasal, Lalitpur", "Hakha, Lalitpur", "Saugal, Lalitpur", 
  "Kobahal, Lalitpur", "Manbhawan, Lalitpur", "Ekantakuna, Lalitpur", 
  "Kusunti, Lalitpur", "Talchikhel, Lalitpur", "Nakhu, Lalitpur", 
  "Bhaisepati Height, Lalitpur", "Chhampi, Lalitpur", "Dukuchhap, Lalitpur", 
  "Devichaur, Lalitpur", "Lele, Lalitpur", "Nallu, Lalitpur", 
  "Gotikhel, Lalitpur", "Ghyampe Danda, Lalitpur", "Lubhu Lamatar, Lalitpur", 
  "Changathali, Lalitpur", "Ghampe-Danda, Bhaktapur",
  
  // Bhaktapur - Cultural & Residential Pockets
  "Byasi, Bhaktapur", "Inacho, Bhaktapur", "Golmadhi, Bhaktapur", 
  "Tachapal, Bhaktapur", "Dattatraya, Bhaktapur", "Kwashya, Bhaktapur", 
  "Bhelukhel, Bhaktapur", "Ramite, Bhaktapur", "Siddhapokhari, Bhaktapur", 
  "Dudhpati, Bhaktapur", "Liwali, Bhaktapur", "Taudaha, Kathmandu", 
  "Pharping, Kathmandu", "Sitalchowk, Bhaktapur", "Khamayayee, Bhaktapur", 
  "Katunje, Bhaktapur", "Srijana Nagar, Bhaktapur", "Pandubazar, Bhaktapur", 
  "Gundhu, Bhaktapur", "Dadhikot, Bhaktapur", "Sirutar, Bhaktapur", 
  "Ghamtedanda, Bhaktapur", "Chittapol, Bhaktapur",
  
  // Industrial & Special Zones
  "Balaju Industrial Area, Kathmandu", "Patan Industrial Estate, Lalitpur", 
  "Bhaktapur Industrial Estate, Bhaktapur", "Taudaha Lake Area, Kathmandu", 
  "Adinath Lokeshwar, Chobhar", "Champadevi Area, Kathmandu", 
  "Chandragiri Hills Area, Kathmandu", "Tinthana, Kathmandu", 
  "Dahachowk, Kathmandu", "Badhbharyang, Kathmandu", "Ramkot Dada, Kathmandu", 
  "Bhimdhunga, Kathmandu", "Mudkhu, Kathmandu", "Teenpiple, Kathmandu", 
  "Sivapuri National Park Entrance, Kathmandu", "Sundarijal Water Dam Area, Kathmandu", 
  "Mulpani Cricket Ground Area, Kathmandu", "Gothatar, Kathmandu", 
  "Dumakhal, Kathmandu", "Nilopul, Kathmandu", "Fikkal Chowk, Kapan", 
  "Pasikot, Kathmandu", "Saptagandaki Marga, Kathmandu", 
  "Siddhartha Colony, Budhanilkantha", "Hattigauda Main Road, Kathmandu", 
  "Chappal Karkhana, Kathmandu", "Narayan Gopal Chowk, Kathmandu", 
  "Teaching Hospital Area, Kathmandu", "Shankha Park Area, Kathmandu", 
  "Dhumbarahi, Kathmandu", "Sukedhara, Kathmandu", "Mandikhatar Height, Kathmandu", 
  "Khumaltar, Lalitpur", "Radio Nepal Area, Lalitpur", "Nagdaha, Lalitpur", 
  "Dhobighat, Lalitpur", "Medicity Area, Lalitpur", "Nakhipot, Lalitpur", 
  "Little Angels School Area, Lalitpur", "GEMS School Area, Lalitpur", 
  "Karmanasa, Lalitpur", "Harisiddhi Height, Lalitpur",
  
  // NEW ADDITIONS - Rapidly Developing Areas
  
  // Northern Valley Expansion (High Demand)
  "Bhimsen Marga, Tokha", "Chilaune, Kathmandu", "Mahakali Marga, Budhanilkantha",
  "Tilganga Heights, Kathmandu", "Samakhusi Chowk, Kathmandu", "Shivapuri Height, Budhanilkantha",
  "Nayapati, Kathmandu", "Baad Bhanjyang, Kathmandu", "Dhapasi Chowk, Kathmandu",
  
  // Eastern Corridor Development
  "Boudha Stupa Area, Kathmandu", "Jorpati Chowk, Kathmandu", "Mulpani Chowk, Kathmandu",
  "Kapan Chowk, Kathmandu", "Asona, Jorpati", "Khotang Bazar, Kapan",
  "Hattiban, Kapan", "Shankhamul Marga, Kapan", "Buddhanagar, Kapan",
  
  // Western Growth Corridors
  "Satdobato Chowk, Lalitpur", "Gwarko Chowk, Lalitpur", "Ekantakuna Chowk, Lalitpur",
  "Balkhu Chowk, Kathmandu", "Kalanki Chowk, Kathmandu", "Kuleshwor Chowk, Kathmandu",
  "Nayabazar Chowk, Kathmandu", "Naikap Chowk, Kathmandu", "Thankot Chowk, Kathmandu",
  
  // Southern Lalitpur Expansion
  "Godawari Chowk, Lalitpur", "Chapagaun, Lalitpur", "Bajrabarahi Chowk, Lalitpur",
  "Thaiba Chowk, Lalitpur", "Harisiddhi Chowk, Lalitpur", "Bungamati Chowk, Lalitpur",
  "Khokana Chowk, Lalitpur", "Lele Chowk, Lalitpur",
  
  // Bhaktapur Urban Sprawl
  "Thimi Chowk, Bhaktapur", "Lokanthali Chowk, Bhaktapur", "Suryabinayak Chowk, Bhaktapur",
  "Kaushaltar Chowk, Bhaktapur", "Gatthaghar Chowk, Bhaktapur", "Bode Chowk, Bhaktapur",
  "Tathali Chowk, Bhaktapur", "Sipadol Chowk, Bhaktapur",
  
  // Major Road Corridors & Highways
  "Ring Road, Kathmandu", "Arnika Highway, Kathmandu", "Tribhuvan Highway, Kathmandu",
  "Prithvi Highway, Kathmandu", "Kanti Path, Kathmandu", "Siddhartha Marga, Kathmandu",
  "Madan Bhandari Road, Kathmandu", "Chakrapath, Kathmandu", "Bishnumati Link Road, Kathmandu",
  
  // Educational & Institutional Areas
  "Tribhuvan University Area, Kirtipur", "Nepal Engineering College Area, Changunarayan",
  "IOE Pulchowk Campus Area", "St. Xavier's College Area, Maitighar",
  "Kathmandu Medical College Area, Sinamangal", "B.P. Koirala Memorial Hospital Area, Chabahil",
  
  // Major Hospital Vicinities
  "Bir Hospital Area, Kathmandu", "Teaching Hospital Area, Maharajgunj",
  "Nepal Police Hospital Area, Maharajgunj", "Grande Hospital Area, Tokha",
  "Norvic Hospital Area, Thapathali", "Medicare Hospital Area, Chabahil",
  
  // Shopping & Commercial Hubs
  "Labim Mall Area, Pulchowk", "Civil Mall Area, Sundhara", "Bhatbhateni Supermarket Area",
  "Big Mart Area, Tripureshwor", "Salesberry Department Store Area, Maharajgunj",
  
  // Diplomatic & Government Zones
  "Embassy Area, Maharajgunj", "Singha Durbar Area, Kathmandu", "Nepal Rastra Bank Area, Baluwatar",
  "Supreme Court Area, Ramshahpath", "Nepal Police Headquarters Area, Naxal",
  
  // Religious & Cultural Sites
  "Boudhanath Stupa Area", "Swayambhunath Stupa Area", "Pashupatinath Temple Area",
  "Budhanilkantha Temple Area", "Changunarayan Temple Area", "Dakshinkali Temple Area",
  
  // Parks & Recreational Areas
  "Ratna Park Area, Kathmandu", "Narayanhiti Museum Garden Area", "Garden of Dreams Area, Thamel",
  "Taudaha Lake Area", "Godawari Botanical Garden Area", "Nagarkot View Tower Area",
  
  // Airport & Transport Hubs
  "Tribhuvan International Airport Area", "Old Bus Park Area, Gongabu",
  "New Bus Park Area, Gongabu", "Kalanki Bus Park Area", "Koteshwor Bus Park Area",
  
  // Major Chowks & Intersections
  "Putalisadak Chowk, Kathmandu", "Jamal Chowk, Kathmandu", "Bhadrakali Chowk, Kathmandu",
  "Chakrapath Chowk, Kathmandu", "Maitighar Chowk, Kathmandu", "Anamnagar Chowk, Kathmandu",
  "Mahabouddha Chowk, Lalitpur", "Pulchowk Chowk, Lalitpur", "Jawalakhel Chowk, Lalitpur"
];

  // Request user's location on mount
  useEffect(() => {
    if (!locationPermissionAsked && navigator.geolocation) {
      setIsLoadingLocation(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setFormData(prev => ({
            ...prev,
            coordinates: { lat: latitude, lng: longitude },
            location: `Current Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`
          }));
          setSearchQuery(`Current Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`);
          setIsLoadingLocation(false);
        },
        () => setIsLoadingLocation(false),
        { enableHighAccuracy: true, timeout: 5000 }
      );
      setLocationPermissionAsked(true);
    }
  }, [locationPermissionAsked]);

  // Price Calculation Logic
  const priceBreakdown = useMemo(() => {
    const selectedProduct = PRODUCTS.find(p => p.id === formData.brickType);
    const unitPrice = selectedProduct ? selectedProduct.pricePerUnit : 0;
    
    let finalUnitPrice = unitPrice;
    if (formData.quantity >= 50000) {
      finalUnitPrice = unitPrice * 0.95;
    }
    
    const brickCost = finalUnitPrice * formData.quantity;
    const trips = Math.ceil(formData.quantity / TRIP_RULE.bricksPerTrip);
    
    let deliveryCharge = 0;
    if (formData.isOutsideRingRoad) {
      deliveryCharge = trips * 1500;
    } else if (formData.quantity < 2000) {
      deliveryCharge = 2500;
    }
    
    return {
      unitPrice: finalUnitPrice,
      brickCost,
      deliveryCharge,
      total: brickCost + deliveryCharge,
      trips,
      hasBulkDiscount: formData.quantity >= 50000
    };
  }, [formData.brickType, formData.quantity, formData.isOutsideRingRoad]);

  const handleLocationSearch = (value: string) => {
    setSearchQuery(value);
    if (value.length > 1) {
      const filtered = commonLocations.filter(loc => loc.toLowerCase().includes(value.toLowerCase()));
      setLocationSuggestions(filtered.slice(0, 8));
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const selectSuggestion = async (suggestion: string) => {
    setFormData(prev => ({ ...prev, location: suggestion }));
    setSearchQuery(suggestion);
    setShowSuggestions(false);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(suggestion + ', Nepal')}&limit=1`);
      const data = await response.json();
      if (data && data[0]) {
        setFormData(prev => ({ ...prev, coordinates: { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) } }));
      }
    } catch (error) { console.error('Geocoding failed:', error); }
  };

  const handleLocationSelect = (lat: number, lng: number, address?: string) => {
    setFormData(prev => ({
      ...prev,
      coordinates: { lat, lng },
      location: address || `Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
    }));
    if (address) setSearchQuery(address);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 1. Check if user is logged in
    const user = auth.currentUser;
    if (!user) {
      alert("You must be signed in to place an order.");
      return;
    }

    setIsProcessing(true);

    try {
      // 2. Save order to Firebase WITH userId
      await addDoc(collection(db, "orders"), {
        userId: auth.currentUser?.uid,              
        customerName: formData.name,
        phone: formData.phone,
        email: formData.email || user.email, // Use form email or auth email
        brickType: formData.brickType,
        quantity: formData.quantity,
        location: formData.location,
        totalAmount: priceBreakdown.total,
        paymentMethod: formData.paymentMethod,
        status: 'pending',             // Initial status for My Orders page
        createdAt: serverTimestamp()   // Used for "orderBy" sorting
      });

      // 3. Automated Email 
      const templateParams = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        quantity: formData.quantity,
        brick_type: formData.brickType === '101' ? '101 High Grade' : 'C.M. Special',
        location: formData.location,
        total_price: priceBreakdown.total,
        payment_method: formData.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Bank Transfer'
      };

      await emailjs.send(
        import.meta.env.VITE_EMAILJS_SERVICE_ID, 
        import.meta.env.VITE_EMAILJS_TEMPLATE_ID, 
        templateParams, 
        import.meta.env.VITE_EMAILJS_PUBLIC_KEY
      );

      // WhatsApp logic has been removed from here

      setIsProcessing(false);
      setOrderComplete(true);
    } catch (error) {
      console.error("Error saving order:", error);
      setIsProcessing(false);
      alert("There was an error saving your order. Please try again.");
    }
  };

  if (orderComplete) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center animate-fadeIn">
        <div className="bg-white rounded-3xl shadow-2xl p-12 border border-green-100">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">
            <i className="fas fa-check"></i>
          </div>
          <h2 className="text-4xl font-oswald font-bold text-gray-800 mb-4 uppercase">Order Placed Successfully!</h2>
          <p className="text-gray-600 text-lg mb-8 max-w-md mx-auto">
            Sachin Gupta will contact you within 30 minutes to confirm delivery.
          </p>
          
          {/* Bank Transfer Info Display if selected */}
          {formData.paymentMethod === 'bank' && (
            <div className="bg-blue-50 rounded-2xl p-6 mb-8 max-w-2xl mx-auto border border-blue-200">
              <h3 className="font-bold text-blue-900 text-xl mb-4 flex items-center gap-2">
                <i className="fas fa-university"></i>
                Bank Transfer Details
              </h3>
              <div className="flex flex-col md:flex-row items-center gap-8">
                {/* QR Code Image */}
                <div className="flex-shrink-0">
                  <div className="bg-white p-4 rounded-xl shadow-inner border border-blue-100">
                    <img 
                      src={qrCodeImage} 
                      alt="Bank QR Code" 
                      className="w-48 h-48 object-contain rounded-lg"
                    />
                    <p className="text-xs text-gray-600 mt-2 text-center">Scan to Pay</p>
                  </div>
                </div>
                
                {/* Bank Information */}
                <div className="flex-1 text-left">
                  <div className="space-y-4">
                    <div className="bg-white p-4 rounded-xl border border-blue-100">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                          <i className="fas fa-landmark"></i>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Bank Name</p>
                          <p className="font-bold text-gray-800 text-lg">Citizens Bank International Ltd.</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white p-4 rounded-xl border border-blue-100">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                          <i className="fas fa-credit-card"></i>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Account Number</p>
                          <p className="font-bold text-gray-800 text-lg">0400100002228045</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white p-4 rounded-xl border border-blue-100">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                          <i className="fas fa-user"></i>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Account Holder</p>
                          <p className="font-bold text-gray-800 text-lg">Sachin Gupta</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200 mt-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <i className="fas fa-exclamation-circle"></i>
                        </div>
                        <div>
                          <p className="text-sm text-yellow-800 font-semibold">Important:</p>
                          <p className="text-sm text-yellow-700">
                            Please send payment proof to WhatsApp after transfer. Your order will be processed only after payment confirmation.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div className="bg-gray-50 rounded-2xl p-6 text-left mb-8 max-w-lg mx-auto border border-gray-200">
            <h3 className="font-bold text-brick-900 border-b pb-2 mb-4 uppercase">Order Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span>Customer:</span><span className="font-bold">{formData.name}</span></div>
              <div className="flex justify-between"><span>Brick Type:</span><span className="font-bold uppercase">{formData.brickType === '101' ? '101 High Grade' : 'C.M. Special'}</span></div>
              <div className="flex justify-between"><span>Total Units:</span><span className="font-bold">{formData.quantity.toLocaleString()}</span></div>
              <div className="flex justify-between"><span>Delivery Location:</span><span className="font-bold text-right max-w-[200px]">{formData.location}</span></div>
              <div className="flex justify-between"><span>Payment:</span><span className="font-bold uppercase">{formData.paymentMethod === 'cod' ? 'CASH ON DELIVERY' : 'BANK TRANSFER'}</span></div>
              <div className="flex justify-between text-brick-700 border-t pt-2 mt-2 font-black">
                <span>Total Amount:</span>
                <span>Rs. {priceBreakdown.total.toLocaleString()}</span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <a href={`https://wa.me/${VENDOR.whatsapp}?text=Order Confirmed: ${formData.quantity} ${formData.brickType === '101' ? '101 High Grade' : 'C.M. Special'} Bricks. Total: Rs. ${priceBreakdown.total}. Customer: ${formData.name}, Phone: ${formData.phone}, Location: ${formData.location}`} target="_blank" rel="noopener noreferrer" className="bg-green-600 text-white px-8 py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-green-700 transition shadow-lg">
              <i className="fab fa-whatsapp text-xl"></i> WhatsApp Confirmation
            </a>
            <a href="#/" className="bg-gray-200 text-gray-800 px-8 py-4 rounded-xl font-bold hover:bg-gray-300 transition">Return Home</a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-oswald font-bold text-brick-900 uppercase tracking-tighter">Secure Booking</h1>
        <div className="w-24 h-1 bg-heritage-gold mx-auto mt-4"></div>
      </div>

      {/* Full Screen Map Modal */}
      {formData.fullScreenMap && (
        <div className="fixed inset-0 z-[10000] bg-white flex flex-col">
          <div className="bg-white border-b p-4 shadow-lg z-[10001] flex items-center gap-4">
            <div className="flex-1 relative">
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => handleLocationSearch(e.target.value)}
                placeholder="Search location..."
                className="w-full bg-gray-50 border rounded-xl px-4 py-3 outline-none focus:border-brick-500"
              />
              {showSuggestions && locationSuggestions.length > 0 && (
                <div className="absolute w-full mt-2 bg-white border rounded-xl shadow-2xl z-[10002]">
                  {locationSuggestions.map((s, i) => (
                    <button key={i} onMouseDown={() => selectSuggestion(s)} className="w-full text-left p-3 hover:bg-gray-100 border-b last:border-0">{s}</button>
                  ))}
                </div>
              )}
            </div>
            <button onClick={() => setFormData(p => ({...p, fullScreenMap: false}))} className="bg-red-600 text-white p-3 rounded-xl"><i className="fas fa-times"></i></button>
          </div>
          <div className="flex-1 relative">
            <MapPicker 
              onLocationSelect={handleLocationSelect} 
              initialLocation={formData.coordinates} 
              fullScreen={true}
              onClose={() => setFormData(p => ({...p, fullScreenMap: false}))}
            />
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-12">
        {/* Left Side: Product Selection & Order Rules */}
        <div className="lg:col-span-1 space-y-8">
          {/* Brick Selection Card */}
          <div className="bg-white rounded-[2.5rem] shadow-2xl p-8 border border-gray-100">
            <h3 className="text-2xl font-oswald font-bold mb-6 text-gray-800 flex items-center gap-2">
              <i className="fas fa-cube text-brick-600"></i>
              Select Brick Type
            </h3>
            
            <div className="space-y-4">
              {PRODUCTS.map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, brickType: p.id }))}
                  className={`w-full p-5 rounded-2xl border-2 transition-all flex items-center gap-4 text-left ${
                    formData.brickType === p.id 
                    ? 'border-brick-600 bg-brick-50 shadow-inner' 
                    : 'border-gray-200 hover:border-brick-200 hover:bg-gray-50'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${formData.brickType === p.id ? 'bg-brick-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                    <i className="fas fa-cubes text-xl"></i>
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-lg">{p.name}</div>
                    <div className="text-sm text-gray-600">Rs. {p.pricePerUnit}/unit</div>
                    {p.isRecommended && (
                      <div className="inline-block bg-heritage-gold text-white text-xs font-bold px-2 py-1 rounded-full mt-1">
                        RECOMMENDED
                      </div>
                    )}
                  </div>
                  {formData.brickType === p.id && (
                    <i className="fas fa-check-circle text-brick-600 text-xl"></i>
                  )}
                </button>
              ))}
            </div>

            {/* Quantity Selector */}
            <div className="mt-8">
              <label className="text-sm font-bold text-gray-600 uppercase mb-3 block">Quantity (Units)</label>
              <div className="relative">
                 <input
                  type="number"
                  min="500"
                  step="100"
                  // FIX: If quantity is 0, show an empty string so the field looks empty
                  value={formData.quantity === 0 ? '' : formData.quantity} 
                  onChange={(e) => {
                    const val = e.target.value;
                    // FIX: Allow the state to be 0 (internally) if the field is empty
                    setFormData(prev => ({ 
                      ...prev, 
                      quantity: val === '' ? 0 : parseInt(val) 
                    }));
                  }}
                  className="w-full bg-gray-50 border-2 border-gray-200 rounded-2xl px-5 py-4 text-xl font-bold text-brick-900 focus:border-brick-500 focus:outline-none transition-all"
                  />
                  <div className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 font-bold">Units</div>
                </div>
              
              {/* Quantity Quick Select */}
              <div className="grid grid-cols-4 gap-2 mt-4">
                {[500, 1000, 2000, 5000].map(qty => (
                  <button
                    key={qty}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, quantity: qty }))}
                    className={`py-2 rounded-xl text-sm font-bold transition-all ${
                      formData.quantity === qty
                        ? 'bg-brick-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {qty.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            {/* Location Toggle */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 mt-6">
              <div>
                <h4 className="font-bold text-gray-700">Outside Ring Road?</h4>
                <p className="text-xs text-gray-500">Higher delivery cost applies</p>
              </div>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, isOutsideRingRoad: !prev.isOutsideRingRoad }))}
                className={`w-14 h-7 rounded-full transition-colors relative ${formData.isOutsideRingRoad ? 'bg-brick-600' : 'bg-gray-300'}`}
              >
                <div className={`absolute top-1 bg-white w-5 h-5 rounded-full transition-all ${formData.isOutsideRingRoad ? 'left-8' : 'left-1'}`}></div>
              </button>
            </div>
          </div>

          {/* Order Rules Section */}
          <div className="bg-white rounded-[2.5rem] shadow-2xl p-8 border border-gray-100">
            <h3 className="text-2xl font-oswald font-bold mb-6 text-gray-800 flex items-center gap-2">
              <i className="fas fa-info-circle text-brick-600"></i>
              Order Rules & Policies
            </h3>
            
            <div className="space-y-4">
              <div className="flex gap-3 items-start p-3 bg-blue-50 rounded-xl border border-blue-100">
                <i className="fas fa-truck text-blue-600 mt-0.5"></i>
                <div>
                  <h4 className="font-bold text-blue-900">Minimum Order</h4>
                  <p className="text-sm text-blue-800">Normal order: 2,000 bricks minimum</p>
                  <p className="text-sm text-blue-800">Booking: 50,000 bricks minimum</p>
                </div>
              </div>
              
              <div className="flex gap-3 items-start p-3 bg-yellow-50 rounded-xl border border-yellow-100">
                <i className="fas fa-exclamation-triangle text-yellow-600 mt-0.5"></i>
                <div>
                  <h4 className="font-bold text-yellow-900">Small Quantity Warning</h4>
                  <p className="text-sm text-yellow-800">Orders of 500 or 1000 bricks have significantly higher delivery costs</p>
                </div>
              </div>
              
              <div className="flex gap-3 items-start p-3 bg-green-50 rounded-xl border border-green-100">
                <i className="fas fa-cube text-green-600 mt-0.5"></i>
                <div>
                  <h4 className="font-bold text-green-900">Brick Quality Policy</h4>
                  <p className="text-sm text-green-800">Up to 5% broken bricks may be included as per standard industrial norms</p>
                </div>
              </div>
              
              <div className="flex gap-3 items-start p-3 bg-red-50 rounded-xl border border-red-100">
                <i className="fas fa-clock text-red-600 mt-0.5"></i>
                <div>
                  <h4 className="font-bold text-red-900">Delivery Timing</h4>
                  <p className="text-sm text-red-800">Inside Ring Road: Delivery after 7 PM only</p>
                  <p className="text-sm text-red-800">1 Trip = 2,000 Bricks exactly</p>
                </div>
              </div>
              
              <div className="text-center pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  <i className="fas fa-phone-alt mr-1"></i>
                  Need clarification? Call {VENDOR.phone}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Form & Summary */}
        <div className="lg:col-span-2 space-y-8">
          <form onSubmit={handleSubmit} className="bg-white rounded-[2.5rem] shadow-2xl p-8 border border-gray-100 space-y-10">
            {/* Step 1: Personal Info */}
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-3">
                <span className="bg-brick-800 text-heritage-gold w-8 h-8 rounded-lg flex items-center justify-center text-sm shadow-md">01</span>
                Personal Information
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <input required type="text" placeholder="Full Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-5 py-4 focus:border-brick-500 outline-none transition-all" />
                </div>
                <div className="space-y-2">
                  <input required type="tel" placeholder="Phone (98XXXXXXXX)" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-5 py-4 focus:border-brick-500 outline-none transition-all" />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <input type="email" placeholder="Email Address (Optional)" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-5 py-4 focus:border-brick-500 outline-none transition-all" />
                </div>
              </div>
            </div>

            {/* Step 2: Delivery Location with Search Bar */}
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-3">
                <span className="bg-brick-800 text-heritage-gold w-8 h-8 rounded-lg flex items-center justify-center text-sm shadow-md">02</span>
                Delivery Location
              </h3>
              
              {/* Search Bar - ABOVE the map */}
              <div className="relative">
                <div className="flex items-center gap-2 mb-3">
                  <i className="fas fa-search-location text-brick-600"></i>
                  <label className="text-sm font-bold text-gray-600">Search Location</label>
                  {isLoadingLocation && (
                    <span className="text-xs text-green-600 flex items-center gap-1">
                      <i className="fas fa-spinner fa-spin"></i>
                      Detecting location...
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input
                    ref={locationInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleLocationSearch(e.target.value)}
                    onFocus={() => searchQuery.length > 1 && setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    placeholder="Type location name (e.g., Balkhu, Thamel)..."
                    className="w-full bg-gray-50 border-2 border-gray-200 rounded-2xl px-5 py-4 focus:border-brick-500 outline-none transition-all pr-14"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (navigator.geolocation) {
                        setIsLoadingLocation(true);
                        navigator.geolocation.getCurrentPosition(
                          (position) => {
                            const { latitude, longitude } = position.coords;
                            setFormData(prev => ({
                              ...prev,
                              coordinates: { lat: latitude, lng: longitude },
                              location: `Current Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`
                            }));
                            setSearchQuery(`Current Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`);
                            setIsLoadingLocation(false);
                          },
                          () => setIsLoadingLocation(false),
                          { enableHighAccuracy: true, timeout: 5000 }
                        );
                      }
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-brick-600 hover:text-brick-800 transition"
                    title="Use my current location"
                  >
                    <i className="fas fa-location-arrow text-xl"></i>
                  </button>
                  
                  {/* Location Suggestions Dropdown */}
                  {showSuggestions && locationSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl max-h-80 overflow-y-auto">
                      {locationSuggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          type="button"
                          onMouseDown={() => selectSuggestion(suggestion)}
                          className="w-full text-left px-4 py-3 hover:bg-brick-50 border-b border-gray-100 last:border-b-0 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <i className="fas fa-map-marker-alt text-brick-600 text-sm"></i>
                            <span className="font-medium">{suggestion}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Selected Location Display */}
                {formData.location && (
                  <div className="mt-4 bg-green-50 border border-green-200 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <i className="fas fa-check-circle text-green-600 text-xl"></i>
                        <div>
                          <p className="font-bold text-green-800">Selected Location:</p>
                          <p className="text-green-700 text-sm">{formData.location}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, location: '' }));
                          setSearchQuery('');
                        }}
                        className="text-red-600 hover:text-red-800"
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Map Preview - Click to open full screen */}
              <div 
                onClick={() => setFormData(p => ({...p, fullScreenMap: true}))}
                className="h-96 rounded-2xl overflow-hidden border-2 border-gray-200 relative cursor-pointer group hover:border-brick-400 transition-all"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                    <div className="bg-brick-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg">
                      <i className="fas fa-expand-arrows-alt"></i> Click to Open Full Map
                    </div>
                  </div>
                </div>
                <div className="w-full h-full">
                  {/* Preview map - still shows location but is non-interactive */}
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                    <div className="text-center">
                      <i className="fas fa-map-marker-alt text-4xl text-brick-600 mb-4"></i>
                      <p className="font-bold text-gray-700">Click to Pin Precise Location</p>
                      {formData.location && (
                        <p className="text-sm text-green-600 mt-2 px-4">{formData.location}</p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="absolute top-4 right-4 bg-white shadow-lg rounded-xl px-3 py-2 text-xs text-gray-600 z-20 pointer-events-none">
                  <i className="fas fa-info-circle mr-1 text-brick-600"></i>
                  Click to expand map
                </div>
              </div>
            </div>

            {/* Step 3: Price Breakdown */}
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-3">
                <span className="bg-brick-800 text-heritage-gold w-8 h-8 rounded-lg flex items-center justify-center text-sm shadow-md">03</span>
                Price Breakdown & Payment
              </h3>
              
              {/* Detailed Price Breakdown */}
              <div className="bg-gray-50 rounded-2xl p-6">
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-600 uppercase">Unit Price</label>
                   <div className="bg-white p-4 rounded-xl border border-gray-200 min-h-[100px] flex flex-col justify-center">
                     <p className="text-2xl font-bold text-brick-800">
                    {/* FIX: Limits decimals to 2 places and adds commas */}
                       Rs. {priceBreakdown.unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-gray-500">per brick</p>
                  </div>
                </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-600 uppercase">Total Units</label>
                    <div className="bg-white p-4 rounded-xl border border-gray-200">
                      <p className="text-2xl font-bold text-brick-800">{formData.quantity.toLocaleString()}</p>
                      <p className="text-xs text-gray-500">bricks</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-600 uppercase">Required Trips</label>
                    <div className="bg-white p-4 rounded-xl border border-gray-200">
                      <p className="text-2xl font-bold text-brick-800">{priceBreakdown.trips}</p>
                      <p className="text-xs text-gray-500">truck loads</p>
                    </div>
                  </div>
                </div>
                
                {/* Detailed Price Calculation */}
                <div className="mt-6 bg-white rounded-xl p-4 border border-gray-200">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="font-medium">Brick Cost:</span>
                      <span className="font-bold">Rs. {priceBreakdown.brickCost.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Delivery Charge:</span>
                      <span className={`font-bold ${priceBreakdown.deliveryCharge === 0 ? 'text-green-600' : ''}`}>
                        {priceBreakdown.deliveryCharge === 0 ? 'FREE' : `Rs. ${priceBreakdown.deliveryCharge.toLocaleString()}`}
                      </span>
                    </div>
                    {priceBreakdown.hasBulkDiscount && (
                      <div className="flex justify-between text-green-600">
                        <span className="font-medium">Bulk Discount (5%):</span>
                        <span className="font-bold">Applied ✓</span>
                      </div>
                    )}
                    <div className="flex justify-between text-brick-800 border-t pt-3 mt-3 font-bold text-lg">
                      <span>Total Amount:</span>
                      <span>Rs. {priceBreakdown.total.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Payment Options */}
              <div className="mt-6">
                <h4 className="font-bold text-gray-700 mb-4">Payment Method</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { 
                      id: 'cod', 
                      label: 'Cash on Delivery', 
                      icon: 'fa-money-bill-wave',
                      description: 'Pay when bricks are delivered'
                    },
                    { 
                      id: 'bank', 
                      label: 'Bank Transfer', 
                      icon: 'fa-university',
                      description: 'Transfer to bank account'
                    },
                  ].map(p => (
                    <button key={p.id} type="button" onClick={() => setFormData({...formData, paymentMethod: p.id})}
                      className={`flex flex-col items-center gap-3 p-5 border-2 rounded-2xl transition-all text-center ${
                        formData.paymentMethod === p.id 
                        ? 'border-brick-600 bg-brick-50 shadow-inner' 
                        : 'border-gray-50 bg-gray-50 hover:bg-white'
                      }`}
                    >
                      <i className={`fas ${p.icon} text-2xl ${formData.paymentMethod === p.id ? 'text-brick-600' : 'text-gray-400'}`}></i>
                      <div>
                        <span className="text-sm font-black uppercase tracking-tight block">{p.label}</span>
                        <span className="text-xs text-gray-500 mt-1 block">{p.description}</span>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Bank Transfer Details Display (only when bank transfer is selected) */}
                {formData.paymentMethod === 'bank' && (
                  <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border-2 border-blue-200 shadow-inner">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center">
                        <i className="fas fa-qrcode"></i>
                      </div>
                      <div>
                        <h5 className="font-bold text-blue-900 text-lg">Bank Transfer Details</h5>
                        <p className="text-sm text-blue-700">Scan QR or use bank details below</p>
                      </div>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* QR Code Section */}
                      <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-sm">
                        <div className="aspect-square flex items-center justify-center bg-white p-2 rounded-lg">
                          <img 
                            src={qrCodeImage} 
                            alt="Bank QR Code" 
                            className="w-full h-full object-contain rounded-lg"
                          />
                        </div>
                        <p className="text-center text-xs text-gray-600 mt-2">Scan QR to Pay</p>
                      </div>
                      
                      {/* Bank Information */}
                      <div className="space-y-4">
                        <div className="bg-white p-4 rounded-xl border border-blue-100">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                              <i className="fas fa-landmark"></i>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Bank Name</p>
                              <p className="font-bold text-gray-800">Citizens Bank International Ltd.</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-white p-4 rounded-xl border border-blue-100">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                              <i className="fas fa-credit-card"></i>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Account Number</p>
                              <p className="font-bold text-gray-800">0400100002228045</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-white p-4 rounded-xl border border-blue-100">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                              <i className="fas fa-user"></i>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Account Holder</p>
                              <p className="font-bold text-gray-800">Sachin Gupta</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 bg-yellow-50 p-4 rounded-xl border border-yellow-200">
                      <div className="flex items-start gap-3">
                        <i className="fas fa-exclamation-circle text-yellow-600 mt-0.5"></i>
                        <div>
                          <p className="text-sm text-yellow-800 font-semibold">Important Notice:</p>
                          <p className="text-sm text-yellow-700">
                            After making the payment, please send the transaction screenshot to WhatsApp for order confirmation.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Final Submit Section - Replace from line 535 to 548 */}
<div className="pt-6 border-t border-gray-100">
  <div className="flex justify-between items-center bg-gray-50 p-6 rounded-2xl border-2 border-dashed border-gray-200 mb-6">
    <div>
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Final Amount</p>
      <h4 className="text-3xl font-oswald font-bold text-brick-800">
        {/* Forces exactly two decimal places, e.g., 13.29 */}
        Rs. {priceBreakdown.total.toLocaleString(undefined, { 
          minimumFractionDigits: 2, 
          maximumFractionDigits: 2 
        })}
      </h4>
    </div>
    <div className="text-right">
      <p className="text-xs text-gray-500 font-bold">{formData.quantity.toLocaleString()} Units</p>
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
        {priceBreakdown.trips} Trip{priceBreakdown.trips > 1 ? 's' : ''}
      </p>
    </div>
  </div>

  <button 
    disabled={isProcessing} 
    type="submit"
    className="w-full bg-brick-800 text-heritage-gold py-6 rounded-2xl font-black text-xl hover:bg-brick-900 transition-all shadow-2xl disabled:opacity-50 flex items-center justify-center gap-3 uppercase tracking-[0.2em]"
  >
    {isProcessing ? (
      <><i className="fas fa-circle-notch fa-spin"></i> Processing...</>
    ) : (
      <><i className="fas fa-lock"></i> Confirm Order</>
    )}
  </button>
  
  <p className="text-center text-xs text-gray-500 mt-4">
    <i className="fas fa-shield-alt mr-1"></i>
    Your information is secure and will only be used for delivery purposes
  </p>
</div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Booking;