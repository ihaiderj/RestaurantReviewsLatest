import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

interface BookingSummaryProps {
  bookingDetails: {
    restaurantName: string;
    restaurantImage: string;
    cuisine: string;
    location: string;
    duration: string;
    name: string;
    email: string;
    phone: string;
    bookingDate: string;
    occasion: string;
    bookingTime: string;
    guests: number;
    tableNumber: string;
    floor: string;
  };
}

export default function BookingSummaryScreen() {
  const router = useRouter();
  
  // In a real app, this would come from navigation params or state management
  const bookingDetails = {
    restaurantName: 'LibertyBite Bistro',
    restaurantImage: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=200&h=200&q=80',
    cuisine: 'Italian',
    location: '1012 Ocean avanue, New y..',
    duration: '15 min',
    name: 'Esther Howard',
    email: 'example@gmail.com',
    phone: '+1 (208) 555-0112',
    bookingDate: 'Jan 04, 2024 | 10:00 AM',
    occasion: 'Birthday',
    bookingTime: 'Jan 04, 2024 | 17:00 PM',
    guests: 4,
    tableNumber: 'T-02',
    floor: '1st Floor'
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Review Summary</ThemedText>
      </View>

      {/* Restaurant Info */}
      <View style={styles.restaurantInfo}>
        <Image 
          source={{ uri: bookingDetails.restaurantImage }}
          style={styles.restaurantImage}
        />
        <View style={styles.restaurantDetails}>
          <ThemedText style={styles.restaurantName}>
            {bookingDetails.restaurantName}
          </ThemedText>
          <View style={styles.detailRow}>
            <Ionicons name="time-outline" size={16} color="#6B4EFF" />
            <ThemedText style={styles.detailText}>{bookingDetails.duration}</ThemedText>
            <ThemedText style={styles.dot}>•</ThemedText>
            <Ionicons name="restaurant-outline" size={16} color="#6B4EFF" />
            <ThemedText style={styles.detailText}>{bookingDetails.cuisine}</ThemedText>
          </View>
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={16} color="#666" />
            <ThemedText style={styles.locationText}>{bookingDetails.location}</ThemedText>
          </View>
        </View>
      </View>

      {/* Booking Details */}
      <View style={styles.bookingDetails}>
        <DetailItem label="Name" value={bookingDetails.name} />
        <DetailItem label="Email" value={bookingDetails.email} />
        <DetailItem label="Phone Number" value={bookingDetails.phone} />
        <DetailItem label="Booking Date" value={bookingDetails.bookingDate} />
        <DetailItem label="Occasion" value={bookingDetails.occasion} />
        <DetailItem label="Booking for" value={bookingDetails.bookingTime} />
        <DetailItem label="Number of Guests" value={bookingDetails.guests.toString()} />
        <DetailItem label="Table Number" value={bookingDetails.tableNumber} />
        <DetailItem label="Floor" value={bookingDetails.floor} />
      </View>

      {/* Confirm Button */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.confirmButton}
          onPress={() => {
            router.push('/booking-success');
          }}
        >
          <ThemedText style={styles.confirmText}>Confirm Booking</ThemedText>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// Helper component for detail items
const DetailItem = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.detailItem}>
    <ThemedText style={styles.detailLabel}>{label}</ThemedText>
    <ThemedText style={styles.detailValue}>{value}</ThemedText>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    padding: 4,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  restaurantInfo: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  restaurantImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginRight: 16,
  },
  restaurantDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  restaurantName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
  },
  dot: {
    color: '#666',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  locationText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  bookingDetails: {
    padding: 16,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  confirmButton: {
    backgroundColor: '#6B4EFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 