import React, { useState, useEffect, useMemo, useRef } from 'react';
import { PRODUCTS, VENDOR, TRIP_RULE, HUBS } from '../../constants';
import { BrickType } from '../../types';
import MapPicker from '../../components/MapPicker';
import { db, auth } from '../services/firebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import emailjs from '@emailjs/browser';
import qrCodeImage from "../assets/images/qr.jpeg";

// Haversine formula with your custom correction factors
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Earth's radius in km
  
  // Convert to radians
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  // Haversine formula
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const straightLineDistance = R * c;
  
  // YOUR CUSTOM CORRECTION FACTORS
  let correctionFactor = 2.1; // Default
  
  if (straightLineDistance < 2) {
    correctionFactor = 4.8;
  } else if (straightLineDistance < 5) {
    correctionFactor = 4.1;
  } else if (straightLineDistance < 15) {
    correctionFactor = 1.7;
  } else if (straightLineDistance < 25) {
    correctionFactor = 1.8;
  } else {
    correctionFactor = 2.1;
  }
  
  // Calculate road distance
  const roadDistance = straightLineDistance * correctionFactor;
  
  return roadDistance;
};

// Calculate delivery charge based on distance brackets
const calculateDeliveryCharge = (distance: number, trips: number): number => {
  if (distance <= 18) {
    return 0; // Free delivery within 18km
  } else if (distance <= 25) {
    return 1000 * trips; // Rs. 1000 per trip for 18-25km
  } else if (distance <= 29.9) {
    return 1500 * trips; // Rs. 1500 per trip for 25-29.9km
  } else {
    return 2000 * trips; // Rs. 2000 per trip for 30km+
  }
};

// Get delivery bracket color and label
const getDeliveryBracketInfo = (distance: number) => {
  if (distance <= 18) {
    return { 
      color: 'text-green-600', 
      bg: 'bg-green-100', 
      border: 'border-green-200', 
      label: 'FREE DELIVERY', 
      rate: 'No Charge',
      icon: 'fa-check-circle'
    };
  } else if (distance <= 25) {
    return { 
      color: 'text-blue-600', 
      bg: 'bg-blue-100', 
      border: 'border-blue-200', 
      label: 'STANDARD RATE', 
      rate: 'Rs. 1,000 per trip',
      icon: 'fa-road'
    };
  } else if (distance <= 29.9) {
    return { 
      color: 'text-yellow-600', 
      bg: 'bg-yellow-100', 
      border: 'border-yellow-200', 
      label: 'EXTENDED RATE', 
      rate: 'Rs. 1,500 per trip',
      icon: 'fa-mountain'
    };
  } else {
    return { 
      color: 'text-red-600', 
      bg: 'bg-red-100', 
      border: 'border-red-200', 
      label: 'PREMIUM RATE', 
      rate: 'Rs. 2,000 per trip',
      icon: 'fa-truck-loading'
    };
  }
};

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
  const [distanceToHub, setDistanceToHub] = useState<number>(0);

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

  // Calculate distance to hub when coordinates change
  useEffect(() => {
    const calculateHubDistance = async () => {
      const hub = HUBS[formData.brickType === BrickType.CM ? 'CM' : '101'];
      
      // Calculate road distance
      const roadDistance = calculateDistance(
        formData.coordinates.lat,
        formData.coordinates.lng,
        hub.lat,
        hub.lng
      );
      
      setDistanceToHub(roadDistance);
    };

    calculateHubDistance();
  }, [formData.coordinates, formData.brickType]);

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
      finalUnitPrice = unitPrice * 0.95; // 5% bulk discount
    }
    
    const brickCost = finalUnitPrice * formData.quantity;
    const trips = Math.ceil(formData.quantity / TRIP_RULE.bricksPerTrip);
    
    // Calculate delivery charge based on distance
    const deliveryCharge = calculateDeliveryCharge(distanceToHub, trips);
    
    return {
      unitPrice: finalUnitPrice,
      brickCost,
      deliveryCharge,
      total: brickCost + deliveryCharge,
      trips,
      hasBulkDiscount: formData.quantity >= 50000,
      distance: distanceToHub
    };
  }, [formData.brickType, formData.quantity, distanceToHub]);

  const bracketInfo = getDeliveryBracketInfo(distanceToHub);

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
        setFormData(prev => ({ 
          ...prev, 
          coordinates: { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) } 
        }));
      }
    } catch (error) { 
      console.error('Geocoding failed:', error); 
    }
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
    
    const user = auth.currentUser;
    if (!user) {
      alert("You must be signed in to place an order.");
      return;
    }

    setIsProcessing(true);

    try {
      await addDoc(collection(db, "orders"), {
        userId: auth.currentUser?.uid,              
        customerName: formData.name,
        phone: formData.phone,
        email: formData.email || user.email,
        brickType: formData.brickType,
        quantity: formData.quantity,
        location: formData.location,
        coordinates: formData.coordinates,
        distanceToHub: distanceToHub,
        totalAmount: priceBreakdown.total,
        paymentMethod: formData.paymentMethod,
        status: 'pending',
        createdAt: serverTimestamp()
      });

      const templateParams = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        quantity: formData.quantity,
        brick_type: formData.brickType === '101' ? '101 High Grade' : 'C.M. Special',
        location: formData.location,
        distance: distanceToHub.toFixed(1),
        total_price: priceBreakdown.total,
        payment_method: formData.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Bank Transfer'
      };

      await emailjs.send(
        import.meta.env.VITE_EMAILJS_SERVICE_ID, 
        import.meta.env.VITE_EMAILJS_TEMPLATE_ID, 
        templateParams, 
        import.meta.env.VITE_EMAILJS_PUBLIC_KEY
      );

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
      <div className="max-w-4xl mx-auto px-4 py-12 sm:py-20 text-center animate-fadeIn">
        <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-12 border border-green-100">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl sm:text-4xl">
            <i className="fas fa-check"></i>
          </div>
          <h2 className="text-2xl sm:text-4xl font-oswald font-bold text-gray-800 mb-4 uppercase">Order Placed Successfully!</h2>
          <p className="text-gray-600 text-base sm:text-lg mb-8 max-w-md mx-auto">
            Sachin Gupta will contact you within 30 minutes to confirm delivery.
          </p>
          
          {/* Bank Transfer Info Display if selected */}
          {formData.paymentMethod === 'bank' && (
            <div className="bg-blue-50 rounded-2xl p-4 sm:p-6 mb-8 max-w-2xl mx-auto border border-blue-200">
              <h3 className="font-bold text-blue-900 text-lg sm:text-xl mb-4 flex items-center gap-2 justify-center">
                <i className="fas fa-university"></i>
                Bank Transfer Details
              </h3>
              <div className="flex flex-col md:flex-row items-center gap-6 sm:gap-8">
                {/* QR Code Image */}
                <div className="flex-shrink-0">
                  <div className="bg-white p-3 sm:p-4 rounded-xl shadow-inner border border-blue-100">
                    <img 
                      src={qrCodeImage} 
                      alt="Bank QR Code" 
                      className="w-36 h-36 sm:w-48 sm:h-48 object-contain rounded-lg"
                    />
                    <p className="text-xs text-gray-600 mt-2 text-center">Scan to Pay</p>
                  </div>
                </div>
                
                {/* Bank Information */}
                <div className="flex-1 text-left w-full">
                  <div className="space-y-3 sm:space-y-4">
                    <div className="bg-white p-3 sm:p-4 rounded-xl border border-blue-100">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                          <i className="fas fa-landmark"></i>
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm text-gray-600">Bank Name</p>
                          <p className="font-bold text-gray-800 text-sm sm:text-lg">Citizens Bank International Ltd.</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white p-3 sm:p-4 rounded-xl border border-blue-100">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                          <i className="fas fa-credit-card"></i>
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm text-gray-600">Account Number</p>
                          <p className="font-bold text-gray-800 text-sm sm:text-lg">0400100002228045</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white p-3 sm:p-4 rounded-xl border border-blue-100">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                          <i className="fas fa-user"></i>
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm text-gray-600">Account Holder</p>
                          <p className="font-bold text-gray-800 text-sm sm:text-lg">Sachin Gupta</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-yellow-50 p-3 sm:p-4 rounded-xl border border-yellow-200 mt-4">
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <i className="fas fa-exclamation-circle text-sm"></i>
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm text-yellow-800 font-semibold">Important:</p>
                          <p className="text-xs sm:text-sm text-yellow-700">
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
          
          <div className="bg-gray-50 rounded-2xl p-4 sm:p-6 text-left mb-8 max-w-lg mx-auto border border-gray-200">
            <h3 className="font-bold text-brick-900 border-b pb-2 mb-4 uppercase text-sm sm:text-base">Order Summary</h3>
            <div className="space-y-2 text-xs sm:text-sm">
              <div className="flex justify-between"><span>Customer:</span><span className="font-bold">{formData.name}</span></div>
              <div className="flex justify-between"><span>Brick Type:</span><span className="font-bold uppercase">{formData.brickType === '101' ? '101 High Grade' : 'C.M. Special'}</span></div>
              <div className="flex justify-between"><span>Distance:</span><span className="font-bold">{distanceToHub.toFixed(1)} km</span></div>
              <div className="flex justify-between"><span>Total Units:</span><span className="font-bold">{formData.quantity.toLocaleString()}</span></div>
              <div className="flex justify-between"><span>Delivery to:</span><span className="font-bold text-right max-w-[150px] sm:max-w-[200px] truncate">{formData.location}</span></div>
              <div className="flex justify-between"><span>Payment:</span><span className="font-bold uppercase">{formData.paymentMethod === 'cod' ? 'CASH ON DELIVERY' : 'BANK TRANSFER'}</span></div>
              <div className="flex justify-between text-brick-700 border-t pt-2 mt-2 font-black">
                <span>Total Amount:</span>
                <span>Rs. {priceBreakdown.total.toLocaleString()}</span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
            <a href={`https://wa.me/${VENDOR.whatsapp}?text=Order Confirmed: ${formData.quantity} ${formData.brickType === '101' ? '101 High Grade' : 'C.M. Special'} Bricks. Distance: ${distanceToHub.toFixed(1)}km. Total: Rs. ${priceBreakdown.total}. Customer: ${formData.name}, Phone: ${formData.phone}, Location: ${formData.location}`} target="_blank" rel="noopener noreferrer" className="bg-green-600 text-white px-6 py-3 sm:px-8 sm:py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-green-700 transition shadow-lg text-sm sm:text-base">
              <i className="fab fa-whatsapp text-lg sm:text-xl"></i> WhatsApp Confirmation
            </a>
            <a href="#/" className="bg-gray-200 text-gray-800 px-6 py-3 sm:px-8 sm:py-4 rounded-xl font-bold hover:bg-gray-300 transition text-sm sm:text-base">Return Home</a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
      {/* Hero Header */}
      <div className="text-center mb-8 sm:mb-12">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-oswald font-bold text-brick-900 uppercase tracking-tighter">Book Your Bricks</h1>
        <p className="text-gray-600 mt-2 sm:mt-4 text-sm sm:text-base">Get quality bricks delivered to your construction site</p>
        <div className="w-20 h-1 bg-heritage-gold mx-auto mt-3 sm:mt-4"></div>
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
                className="w-full bg-gray-50 border rounded-xl px-4 py-3 outline-none focus:border-brick-500 text-sm sm:text-base"
              />
              {showSuggestions && locationSuggestions.length > 0 && (
                <div className="absolute w-full mt-2 bg-white border rounded-xl shadow-2xl z-[10002] max-h-60 overflow-y-auto">
                  {locationSuggestions.map((s, i) => (
                    <button key={i} onMouseDown={() => selectSuggestion(s)} className="w-full text-left p-3 hover:bg-gray-100 border-b last:border-0 text-sm sm:text-base">{s}</button>
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

      <div className="grid lg:grid-cols-3 gap-8 sm:gap-12">
        {/* Left Side: Product Selection */}
        <div className="lg:col-span-1 space-y-6 sm:space-y-8">
          {/* Brick Selection Card */}
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-3xl shadow-2xl p-6 sm:p-8 border border-gray-100">
            <h3 className="text-xl sm:text-2xl font-oswald font-bold mb-6 text-gray-800 flex items-center gap-2">
              <i className="fas fa-cube text-brick-600"></i>
              Brick Type
            </h3>
            
            <div className="space-y-3 sm:space-y-4">
              {PRODUCTS.map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, brickType: p.id }))}
                  className={`w-full p-4 sm:p-5 rounded-2xl border-2 transition-all flex items-center gap-4 text-left group ${
                    formData.brickType === p.id 
                    ? 'border-brick-600 bg-gradient-to-r from-brick-50 to-yellow-50 shadow-inner scale-[1.02]' 
                    : 'border-gray-200 hover:border-brick-200 hover:bg-gray-50'
                  }`}
                >
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center transition-all ${formData.brickType === p.id ? 'bg-gradient-to-br from-brick-600 to-brick-800 text-white shadow-lg' : 'bg-gray-100 text-gray-600 group-hover:bg-brick-100'}`}>
                    <i className="fas fa-cubes text-lg sm:text-xl"></i>
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-base sm:text-lg">{p.name}</div>
                    <div className="text-xs sm:text-sm text-gray-600">Rs. {p.pricePerUnit.toLocaleString()}/unit</div>
                    {p.isRecommended && (
                      <div className="inline-block bg-gradient-to-r from-heritage-gold to-yellow-400 text-white text-xs font-bold px-2 py-1 rounded-full mt-1 shadow-sm">
                        RECOMMENDED
                      </div>
                    )}
                  </div>
                  {formData.brickType === p.id && (
                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-500 text-white rounded-full flex items-center justify-center animate-pulse">
                      <i className="fas fa-check text-xs sm:text-sm"></i>
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* Quantity Selector */}
            <div className="mt-6 sm:mt-8">
              <label className="text-sm font-bold text-gray-600 uppercase mb-3 block">Quantity (Units)</label>
              <div className="relative">
                <input
                  type="number"
                  min="500"
                  step="100"
                  value={formData.quantity === 0 ? '' : formData.quantity} 
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData(prev => ({ 
                      ...prev, 
                      quantity: val === '' ? 0 : parseInt(val) 
                    }));
                  }}
                  className="w-full bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-200 rounded-2xl px-5 py-4 text-lg sm:text-xl font-bold text-brick-900 focus:border-brick-500 focus:outline-none transition-all"
                />
                <div className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm sm:text-base">Units</div>
              </div>
              
              {/* Quantity Quick Select */}
              <div className="grid grid-cols-4 gap-2 mt-4">
                {[500, 1000, 2000, 5000].map(qty => (
                  <button
                    key={qty}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, quantity: qty }))}
                    className={`py-2 sm:py-3 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                      formData.quantity === qty
                        ? 'bg-gradient-to-r from-brick-600 to-brick-800 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {qty.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            {/* Distance & Delivery Card */}
            <div className={`mt-6 p-4 sm:p-5 rounded-2xl ${bracketInfo.bg} ${bracketInfo.border} transition-all duration-500 shadow-lg`}>
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center ${bracketInfo.color.replace('text-', 'bg-')} bg-opacity-20`}>
                  <i className={`fas ${bracketInfo.icon} ${bracketInfo.color} text-lg sm:text-xl`}></i>
                </div>
                <div>
                  <h4 className="font-bold text-gray-800 text-base sm:text-lg">Delivery Details</h4>
                  <p className="text-xs sm:text-sm text-gray-600">From {formData.brickType === 'CM' ? 'C.M. Factory' : '101 Factory'}</p>
                </div>
              </div>
              
              {/* Distance Display */}
              <div className="text-center mb-4">
                <div className="inline-block bg-gradient-to-r from-white to-gray-50 rounded-2xl px-6 py-4 shadow-inner border border-gray-200">
                  <p className="text-xs sm:text-sm text-gray-600 mb-1">Road Distance</p>
                  <p className="text-3xl sm:text-4xl font-bold text-brick-800">{distanceToHub.toFixed(1)} <span className="text-lg sm:text-xl text-gray-600">km</span></p>
                </div>
              </div>
              
              {/* Delivery Rate Display */}
              <div className="bg-gradient-to-r from-white to-gray-50 rounded-2xl p-4 border border-gray-200 shadow-inner">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-700 text-sm sm:text-base">{bracketInfo.label}</p>
                    <p className={`text-xs sm:text-sm font-bold ${bracketInfo.color}`}>{bracketInfo.rate}</p>
                  </div>
                  <div className={`px-3 py-2 rounded-lg ${bracketInfo.bg} ${bracketInfo.color} font-bold text-xs sm:text-sm`}>
                    {distanceToHub <= 18 ? 'FREE' :
                     distanceToHub <= 25 ? 'Rs. 1k/trip' :
                     distanceToHub <= 29.9 ? 'Rs. 1.5k/trip' : 'Rs. 2k/trip'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Order Policies Section */}
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-3xl shadow-2xl p-6 sm:p-8 border border-gray-100">
            <h3 className="text-xl sm:text-2xl font-oswald font-bold mb-6 text-gray-800 flex items-center gap-2">
              <i className="fas fa-info-circle text-brick-600"></i>
              Order Policies
            </h3>
            
            <div className="space-y-4">
              <div className="flex gap-3 items-start p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-500 text-white rounded-lg flex items-center justify-center flex-shrink-0">
                  <i className="fas fa-truck text-sm sm:text-base"></i>
                </div>
                <div>
                  <h4 className="font-bold text-blue-900 text-sm sm:text-base">Minimum Order</h4>
                  <p className="text-xs sm:text-sm text-blue-800">Normal: 2,000 bricks minimum</p>
                  <p className="text-xs sm:text-sm text-blue-800">Booking: 50,000 bricks minimum</p>
                </div>
              </div>
              
              <div className="flex gap-3 items-start p-4 bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-xl border border-yellow-200">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-yellow-500 text-white rounded-lg flex items-center justify-center flex-shrink-0">
                  <i className="fas fa-exclamation-triangle text-sm sm:text-base"></i>
                </div>
                <div>
                  <h4 className="font-bold text-yellow-900 text-sm sm:text-base">Small Quantity Warning</h4>
                  <p className="text-xs sm:text-sm text-yellow-800">Orders of 500 or 1000 bricks have significantly higher delivery costs</p>
                </div>
              </div>
                            
              <div className="flex gap-3 items-start p-4 bg-gradient-to-r from-red-50 to-red-100 rounded-xl border border-red-200">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-red-500 text-white rounded-lg flex items-center justify-center flex-shrink-0">
                  <i className="fas fa-clock text-sm sm:text-base"></i>
                </div>
                <div>
                  <h4 className="font-bold text-red-900 text-sm sm:text-base">Delivery Timing</h4>
                  <p className="text-xs sm:text-sm text-red-800">Inside Ring Road: Delivery after 7 PM only</p>
                  <p className="text-xs sm:text-sm text-red-800">1 Trip = 2,000 Bricks exactly</p>
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
        <div className="lg:col-span-2 space-y-6 sm:space-y-8">
          <form onSubmit={handleSubmit} className="bg-gradient-to-br from-white to-gray-50 rounded-3xl shadow-2xl p-6 sm:p-8 border border-gray-100 space-y-8 sm:space-y-10">
            {/* Step 1: Personal Info */}
            <div className="space-y-4 sm:space-y-6">
              <h3 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center gap-3">
                <span className="bg-gradient-to-br from-brick-800 to-brick-900 text-heritage-gold w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-sm shadow-md">01</span>
                Personal Information
              </h3>
              <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-2">
                  <input required type="text" placeholder="Full Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-100 rounded-2xl px-4 sm:px-5 py-3 sm:py-4 focus:border-brick-500 outline-none transition-all text-sm sm:text-base" />
                </div>
                <div className="space-y-2">
                  <input required type="tel" placeholder="Phone (98XXXXXXXX)" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-100 rounded-2xl px-4 sm:px-5 py-3 sm:py-4 focus:border-brick-500 outline-none transition-all text-sm sm:text-base" />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <input type="email" placeholder="Email Address (Optional)" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-100 rounded-2xl px-4 sm:px-5 py-3 sm:py-4 focus:border-brick-500 outline-none transition-all text-sm sm:text-base" />
                </div>
              </div>
            </div>

            {/* Step 2: Delivery Location */}
            <div className="space-y-4 sm:space-y-6">
              <h3 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center gap-3">
                <span className="bg-gradient-to-br from-brick-800 to-brick-900 text-heritage-gold w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-sm shadow-md">02</span>
                Delivery Location
              </h3>
              
              {/* Search Bar */}
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
                    className="w-full bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-200 rounded-2xl px-4 sm:px-5 py-3 sm:py-4 focus:border-brick-500 outline-none transition-all text-sm sm:text-base pr-12"
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
                    <i className="fas fa-location-arrow text-lg"></i>
                  </button>
                  
                  {/* Location Suggestions Dropdown */}
                  {showSuggestions && locationSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl max-h-60 overflow-y-auto">
                      {locationSuggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          type="button"
                          onMouseDown={() => selectSuggestion(suggestion)}
                          className="w-full text-left px-4 py-3 hover:bg-brick-50 border-b border-gray-100 last:border-b-0 transition-colors text-sm sm:text-base"
                        >
                          <div className="flex items-center gap-3">
                            <i className="fas fa-map-marker-alt text-brick-600 text-xs sm:text-sm"></i>
                            <span className="font-medium">{suggestion}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Selected Location Display - UPDATED to remove FREE DELIVERY section */}
                {formData.location && (
                  <div className="mt-4 bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <i className="fas fa-check-circle text-green-600 text-lg"></i>
                        <div>
                          <p className="font-bold text-green-800 text-sm sm:text-base">Selected Location</p>
                          <p className="text-green-700 text-xs sm:text-sm truncate max-w-[200px] sm:max-w-none">{formData.location}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`px-2 py-1 rounded text-xs font-bold ${bracketInfo.bg} ${bracketInfo.color}`}>
                              {distanceToHub.toFixed(1)} km • {bracketInfo.label}
                            </span>
                          </div>
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

              {/* Map Preview */}
              <div 
                onClick={() => setFormData(p => ({...p, fullScreenMap: true}))}
                className="h-64 sm:h-80 md:h-96 rounded-2xl overflow-hidden border-2 border-gray-200 relative cursor-pointer group hover:border-brick-400 transition-all"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent z-10 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                    <div className="bg-gradient-to-r from-brick-600 to-brick-800 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg text-sm sm:text-base">
                      <i className="fas fa-expand-arrows-alt"></i> Click to Open Full Map
                    </div>
                  </div>
                </div>
                <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                  <div className="text-center">
                    <i className="fas fa-map-marker-alt text-3xl sm:text-4xl text-brick-600 mb-3 sm:mb-4"></i>
                    <p className="font-bold text-gray-700 text-sm sm:text-base">Click to Pin Precise Location</p>
                    {formData.location && (
                      <p className="text-xs sm:text-sm text-green-600 mt-2 px-4 truncate">{formData.location}</p>
                    )}
                  </div>
                </div>
                <div className="absolute top-3 sm:top-4 right-3 sm:right-4 bg-white/90 backdrop-blur-sm shadow-lg rounded-xl px-2 sm:px-3 py-1 sm:py-2 text-xs text-gray-600 z-20 pointer-events-none">
                  <i className="fas fa-info-circle mr-1 text-brick-600"></i>
                  Click to expand
                </div>
              </div>
            </div>

            {/* Step 3: Price Breakdown */}
            <div className="space-y-4 sm:space-y-6">
              <h3 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center gap-3">
                <span className="bg-gradient-to-br from-brick-800 to-brick-900 text-heritage-gold w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-sm shadow-md">03</span>
                Price Summary
              </h3>
              
              {/* Price Summary */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-4 sm:p-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-600 uppercase">Unit Price</label>
                    <div className="bg-white p-3 rounded-xl border border-gray-200 h-20 sm:h-24 flex flex-col justify-center">
                      <p className="text-lg sm:text-xl font-bold text-brick-800">
                        Rs. {priceBreakdown.unitPrice.toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500">per brick</p>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-600 uppercase">Total Units</label>
                    <div className="bg-white p-3 rounded-xl border border-gray-200 h-20 sm:h-24 flex flex-col justify-center">
                      <p className="text-lg sm:text-xl font-bold text-brick-800">{formData.quantity.toLocaleString()}</p>
                      <p className="text-xs text-gray-500">bricks</p>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-600 uppercase">Trips</label>
                    <div className="bg-white p-3 rounded-xl border border-gray-200 h-20 sm:h-24 flex flex-col justify-center">
                      <p className="text-lg sm:text-xl font-bold text-brick-800">{priceBreakdown.trips}</p>
                      <p className="text-xs text-gray-500">truck loads</p>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-600 uppercase">Distance</label>
                    <div className="bg-white p-3 rounded-xl border border-gray-200 h-20 sm:h-24 flex flex-col justify-center">
                      <p className="text-lg sm:text-xl font-bold text-brick-800">{distanceToHub.toFixed(1)} km</p>
                      <p className="text-xs text-gray-500">road distance</p>
                    </div>
                  </div>
                </div>
                
                {/* Cost Calculation */}
                <div className="mt-4 sm:mt-6 bg-white rounded-xl p-4 sm:p-6 border border-gray-200 shadow-inner">
                  <h4 className="font-bold text-gray-700 mb-3 sm:mb-4 text-base sm:text-lg">Cost Breakdown</h4>
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="font-medium text-sm sm:text-base">Brick Cost</span>
                        <p className="text-xs text-gray-500">{formData.quantity.toLocaleString()} units × Rs. {priceBreakdown.unitPrice.toFixed(2)}</p>
                      </div>
                      <span className="font-bold text-sm sm:text-base">Rs. {priceBreakdown.brickCost.toLocaleString()}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="font-medium text-sm sm:text-base">Delivery Charge</span>
                        <p className="text-xs text-gray-500">
                          {priceBreakdown.trips} trip{priceBreakdown.trips > 1 ? 's' : ''} • {distanceToHub.toFixed(1)}km
                        </p>
                      </div>
                      <span className={`font-bold text-sm sm:text-base ${priceBreakdown.deliveryCharge === 0 ? 'text-green-600' : ''}`}>
                        {priceBreakdown.deliveryCharge === 0 ? 'FREE' : `Rs. ${priceBreakdown.deliveryCharge.toLocaleString()}`}
                      </span>
                    </div>
                    
                    {priceBreakdown.hasBulkDiscount && (
                      <div className="flex justify-between items-center bg-gradient-to-r from-green-50 to-green-100 p-3 rounded-lg border border-green-200">
                        <div>
                          <span className="font-medium text-green-700 text-sm sm:text-base">Bulk Discount</span>
                          <p className="text-xs text-green-600">5% off on orders ≥50,000 units</p>
                        </div>
                        <span className="font-bold text-green-600 text-sm sm:text-base">-5% Applied</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between text-brick-800 border-t pt-3 sm:pt-4 mt-3 sm:mt-4 font-bold text-lg sm:text-xl">
                      <span>Total Amount</span>
                      <span className="text-xl sm:text-2xl">Rs. {priceBreakdown.total.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Payment Options */}
              <div className="mt-4 sm:mt-6">
                <h4 className="font-bold text-gray-700 mb-3 sm:mb-4 text-base sm:text-lg">Payment Method</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
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
                      className={`flex flex-col items-center gap-3 p-4 border-2 rounded-2xl transition-all text-center group ${
                        formData.paymentMethod === p.id 
                        ? 'border-brick-600 bg-gradient-to-r from-brick-50 to-yellow-50 shadow-inner scale-[1.02]' 
                        : 'border-gray-100 bg-gradient-to-r from-gray-50 to-gray-100 hover:bg-white hover:border-brick-200'
                      }`}
                    >
                      <i className={`fas ${p.icon} text-xl sm:text-2xl ${formData.paymentMethod === p.id ? 'text-brick-600' : 'text-gray-400 group-hover:text-brick-500'}`}></i>
                      <div>
                        <span className="text-xs sm:text-sm font-black uppercase tracking-tight block">{p.label}</span>
                        <span className="text-xs text-gray-500 mt-1 block">{p.description}</span>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Bank Transfer Details Display */}
                {formData.paymentMethod === 'bank' && (
                  <div className="mt-4 sm:mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4 sm:p-6 border-2 border-blue-200 shadow-inner">
                    <div className="flex items-center gap-3 mb-3 sm:mb-4">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-xl flex items-center justify-center">
                        <i className="fas fa-qrcode"></i>
                      </div>
                      <div>
                        <h5 className="font-bold text-blue-900 text-base sm:text-lg">Bank Transfer Details</h5>
                        <p className="text-xs sm:text-sm text-blue-700">Scan QR or use bank details below</p>
                      </div>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
                      {/* QR Code Section */}
                      <div className="bg-white p-3 sm:p-4 rounded-xl border border-blue-100 shadow-sm">
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
                      <div className="space-y-3 sm:space-y-4">
                        <div className="bg-white p-3 sm:p-4 rounded-xl border border-blue-100">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                              <i className="fas fa-landmark"></i>
                            </div>
                            <div>
                              <p className="text-xs sm:text-sm text-gray-600">Bank Name</p>
                              <p className="font-bold text-gray-800 text-sm sm:text-base">Citizens Bank International Ltd.</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-white p-3 sm:p-4 rounded-xl border border-blue-100">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                              <i className="fas fa-credit-card"></i>
                            </div>
                            <div>
                              <p className="text-xs sm:text-sm text-gray-600">Account Number</p>
                              <p className="font-bold text-gray-800 text-sm sm:text-base">0400100002228045</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-white p-3 sm:p-4 rounded-xl border border-blue-100">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                              <i className="fas fa-user"></i>
                            </div>
                            <div>
                              <p className="text-xs sm:text-sm text-gray-600">Account Holder</p>
                              <p className="font-bold text-gray-800 text-sm sm:text-base">Sachin Gupta</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-3 sm:mt-4 bg-gradient-to-r from-yellow-50 to-yellow-100 p-3 sm:p-4 rounded-xl border border-yellow-200">
                      <div className="flex items-start gap-3">
                        <i className="fas fa-exclamation-circle text-yellow-600 mt-0.5"></i>
                        <div>
                          <p className="text-xs sm:text-sm text-yellow-800 font-semibold">Important Notice:</p>
                          <p className="text-xs sm:text-sm text-yellow-700">
                            After making the payment, please send the transaction screenshot to WhatsApp for order confirmation.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Final Submit Section */}
            <div className="pt-4 sm:pt-6 border-t border-gray-100">
              <div className="flex flex-col sm:flex-row justify-between items-center bg-gradient-to-r from-gray-50 to-gray-100 p-4 sm:p-6 rounded-2xl border-2 border-dashed border-gray-200 mb-4 sm:mb-6 gap-4">
                <div className="text-center sm:text-left">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Final Amount</p>
                  <h4 className="text-2xl sm:text-3xl font-oswald font-bold text-brick-800">
                    Rs. {priceBreakdown.total.toLocaleString(undefined, { 
                      minimumFractionDigits: 2, 
                      maximumFractionDigits: 2 
                    })}
                  </h4>
                  <div className="flex items-center justify-center sm:justify-start gap-2 mt-2">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${bracketInfo.bg} ${bracketInfo.color}`}>
                      {distanceToHub.toFixed(1)} km
                    </span>
                    <span className="text-xs text-gray-500">• {priceBreakdown.trips} trip{priceBreakdown.trips > 1 ? 's' : ''}</span>
                  </div>
                </div>
                <div className="text-center sm:text-right">
                  <p className="text-xs text-gray-500 font-bold">{formData.quantity.toLocaleString()} Units</p>
                  <p className="text-xs text-gray-500 font-bold">
                    {formData.brickType === '101' ? '101 High Grade' : 'C.M. Special'}
                  </p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mt-2 hidden sm:block">
                    Delivery to: {formData.location.substring(0, 15)}...
                  </p>
                </div>
              </div>

              <button 
                disabled={isProcessing} 
                type="submit"
                className="w-full bg-gradient-to-r from-brick-800 to-brick-900 text-heritage-gold py-4 sm:py-6 rounded-2xl font-black text-lg sm:text-xl hover:from-brick-900 hover:to-brick-950 transition-all shadow-2xl disabled:opacity-50 flex items-center justify-center gap-3 uppercase tracking-[0.1em] sm:tracking-[0.2em] transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {isProcessing ? (
                  <><i className="fas fa-circle-notch fa-spin"></i> Processing...</>
                ) : (
                  <><i className="fas fa-lock"></i> Confirm Order</>
                )}
              </button>
              
              <p className="text-center text-xs text-gray-500 mt-3 sm:mt-4">
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