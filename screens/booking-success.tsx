import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

export default function BookingSuccessScreen() {
  const router = useRouter();

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
      </View>

      {/* Success Content */}
      <View style={styles.content}>
        {/* Success Icon */}
        <View style={styles.successIcon}>
          <Ionicons name="checkmark" size={48} color="#fff" />
        </View>

        {/* Success Message */}
        <ThemedText style={styles.title}>Successfully{'\n'}Reserved Your Table!</ThemedText>
        
        {/* Reservation ID */}
        <View style={styles.reservationId}>
          <ThemedText style={styles.idLabel}>Reservation ID : </ThemedText>
          <ThemedText style={styles.idValue}>RSV5232</ThemedText>
        </View>

        {/* Booking Details */}
        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <View style={styles.detailColumn}>
              <ThemedText style={styles.label}>Name</ThemedText>
              <ThemedText style={styles.value}>Esther Howard</ThemedText>
            </View>
            <View style={styles.detailColumn}>
              <ThemedText style={styles.label}>Date</ThemedText>
              <ThemedText style={styles.value}>Jan 04, 2024</ThemedText>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailColumn}>
              <ThemedText style={styles.label}>Time</ThemedText>
              <ThemedText style={styles.value}>17:00 PM</ThemedText>
            </View>
            <View style={styles.detailColumn}>
              <ThemedText style={styles.label}>Duration</ThemedText>
              <ThemedText style={styles.value}>60 Mins</ThemedText>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailColumn}>
              <ThemedText style={styles.label}>No. of Guests</ThemedText>
              <ThemedText style={styles.value}>04</ThemedText>
            </View>
            <View style={styles.detailColumn}>
              <ThemedText style={styles.label}>Table Number</ThemedText>
              <ThemedText style={styles.value}>T-02</ThemedText>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailColumn}>
              <ThemedText style={styles.label}>Floor</ThemedText>
              <ThemedText style={styles.value}>1st</ThemedText>
            </View>
            <View style={styles.detailColumn}>
              <ThemedText style={styles.label}>Occasion</ThemedText>
              <ThemedText style={styles.value}>Birthday</ThemedText>
            </View>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.primaryButton}
          onPress={() => {
            router.push('/e-ticket');
          }}
        >
          <ThemedText style={styles.primaryButtonText}>View E-Ticket</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={() => {
            router.push({
              pathname: '/my-orders',
              params: { tab: 'active' }
            });
          }}
        >
          <ThemedText style={styles.secondaryButtonText}>View Bookings</ThemedText>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#6B4EFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
  },
  reservationId: {
    flexDirection: 'row',
    marginBottom: 32,
  },
  idLabel: {
    fontSize: 14,
    color: '#666',
  },
  idValue: {
    fontSize: 14,
    color: '#6B4EFF',
    fontWeight: '500',
  },
  detailsContainer: {
    width: '100%',
    gap: 24,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailColumn: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  value: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  footer: {
    padding: 16,
    gap: 16,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#6B4EFF',
    paddingVertical: 16,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#6B4EFF',
    fontSize: 16,
    fontWeight: '500',
  },
}); 