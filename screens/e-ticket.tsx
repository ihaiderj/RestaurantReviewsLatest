import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { BarCodeScanner } from 'expo-barcode-scanner';
import Svg, { Rect } from 'react-native-svg';

export default function ETicketScreen() {
  const router = useRouter();
  const bookingData = "RSV5232-T02-04012024";

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
        <ThemedText style={styles.headerTitle}>E-Ticket</ThemedText>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Ticket Content */}
        <View style={styles.content}>
          {/* QR Code Section */}
          <View style={styles.qrSection}>
            <View style={styles.qrCode}>
              <Svg width={200} height={200}>
                <Rect
                  x={0}
                  y={0}
                  width={200}
                  height={200}
                  fill="white"
                  stroke="black"
                  strokeWidth={1}
                />
                {/* Simple QR code representation */}
                <Rect x={50} y={50} width={100} height={100} fill="black" />
              </Svg>
            </View>
            <ThemedText style={styles.qrText}>
              Please scan your QR Code on the{'\n'}scanner machine in Restaurant.
            </ThemedText>
          </View>

          {/* Booking Details Card */}
          <View style={styles.detailsCard}>
            <View style={styles.detailsHeader}>
              <ThemedText style={styles.detailsTitle}>Booking Details</ThemedText>
            </View>

            <View style={styles.detailsContent}>
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

              <View style={styles.divider} />

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

              <View style={styles.divider} />

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

              <View style={styles.divider} />

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
        </View>
      </ScrollView>

      {/* Bottom Navigation Button */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.navigateButton}
          onPress={() => {
            // Handle navigation to restaurant
          }}
        >
          <ThemedText style={styles.navigateButtonText}>
            Navigate to Restaurant
          </ThemedText>
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
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 100, // Extra padding for footer
  },
  qrSection: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  qrCode: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
  },
  qrText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
  },
  detailsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  detailsHeader: {
    padding: 16,
    backgroundColor: '#F8F8F8',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  detailsContent: {
    padding: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
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
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 8,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  navigateButton: {
    backgroundColor: '#6B4EFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  navigateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 