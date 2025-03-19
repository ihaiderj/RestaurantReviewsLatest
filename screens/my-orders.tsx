import * as React from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Image, Switch } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { withProtectedRoute } from '@/utils/protected-route';

type TabType = 'Active' | 'Completed' | 'Cancelled';

interface OrderItem {
  id: string;
  restaurantName: string;
  image: string;
  duration: string;
  cuisine: string;
  address: string;
  status: TabType;
  rating?: number;
  bookingDate?: string;
  remindMe?: boolean;
}

const ORDERS: OrderItem[] = [
  {
    id: '1',
    restaurantName: 'LibertyBite Bistro',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500&h=300&q=80',
    duration: '15 min',
    cuisine: 'Italian',
    address: '1012 Ocean avenue, New y..',
    status: 'Active',
    rating: 4.8,
    bookingDate: 'Jan 04, 2023 - 17:00 PM',
    remindMe: true,
  },
  {
    id: '2',
    restaurantName: 'DelightDine Oasis',
    image: 'https://images.unsplash.com/photo-1537047902294-62a40c20a6ae?w=500&h=300&q=80',
    duration: '25 min',
    cuisine: 'Mexican',
    address: '1901 Thornridge Cir. Sh..',
    status: 'Active',
    rating: 5.0,
    bookingDate: 'Jan 07, 2023 - 18:00 PM',
    remindMe: false,
  },
  {
    id: '3',
    restaurantName: 'GourmetGrove Galore',
    image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=500&h=300&q=80',
    duration: '35 min',
    cuisine: 'European',
    address: '4517 Washington Ave..',
    status: 'Active',
    rating: 5.0,
    bookingDate: 'Jan 20, 2023 - 18:30 PM',
    remindMe: true,
  },
  {
    id: '4',
    restaurantName: 'GastronomicGrove',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500&h=300&q=80',
    duration: '20 min',
    cuisine: 'Italian',
    address: '8502 Preston Rd. Inglew..',
    status: 'Completed',
    rating: 4.8,
  },
  {
    id: '5',
    restaurantName: 'AmbrosiaArcade',
    image: 'https://images.unsplash.com/photo-1537047902294-62a40c20a6ae?w=500&h=300&q=80',
    duration: '10 min',
    cuisine: 'Mexican',
    address: '6391 Elgin St. Celina, De..',
    status: 'Completed',
    rating: 4.4,
  },
  {
    id: '6',
    restaurantName: 'TasteTrove Tavern',
    image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=500&h=300&q=80',
    duration: '12 min',
    cuisine: 'Mexican',
    address: '3891 Ranchview Dr. Rich..',
    status: 'Completed',
    rating: 4.3,
  },
  {
    id: '7',
    restaurantName: 'RadiantRepast',
    image: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=500&h=300&q=80',
    duration: '25 min',
    cuisine: 'Italian',
    address: '1901 Thornridge Cir. Sh..',
    status: 'Completed',
    rating: 4.9,
  },
  {
    id: '8',
    restaurantName: 'CulinaryCanvas',
    image: 'https://images.unsplash.com/photo-1544148103-0773bf10d330?w=500&h=300&q=80',
    duration: '30 min',
    cuisine: 'French',
    address: '2464 Rockford Mountain..',
    status: 'Completed',
    rating: 4.7,
  },
  {
    id: '9',
    restaurantName: 'SavorySymphony',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500&h=300&q=80',
    duration: '15 min',
    cuisine: 'Mediterranean',
    address: '3891 Preston Rd. Oakland..',
    status: 'Completed',
    rating: 4.6,
  },
  {
    id: '10',
    restaurantName: 'EpicureanEcho',
    image: 'https://images.unsplash.com/photo-1537047902294-62a40c20a6ae?w=500&h=300&q=80',
    duration: '22 min',
    cuisine: 'Asian Fusion',
    address: '4517 Washington Lane..',
    status: 'Completed',
    rating: 4.5,
  },
  {
    id: '11',
    restaurantName: 'BistroBliss',
    image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=500&h=300&q=80',
    duration: '18 min',
    cuisine: 'Continental',
    address: '2715 Ash Dr. San Diego..',
    status: 'Completed',
    rating: 5.0,
  },
  {
    id: '12',
    restaurantName: 'SereneSavories',
    image: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=500&h=300&q=80',
    duration: '28 min',
    cuisine: 'International',
    address: '1901 Thornridge Cir. NY..',
    status: 'Completed',
    rating: 4.8,
  },
  {
    id: '13',
    restaurantName: 'GastronomicGrove',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500&h=300&q=80',
    duration: '32 min',
    cuisine: 'Italian',
    address: '2118 Thornridge Cir. Syracuse, Co..',
    status: 'Cancelled',
  },
  {
    id: '14',
    restaurantName: 'GastronomicGrove',
    image: 'https://images.unsplash.com/photo-1537047902294-62a40c20a6ae?w=500&h=300&q=80',
    duration: '45 min',
    cuisine: 'Italian',
    address: '2715 Ash Dr. San Jose, S..',
    status: 'Cancelled',
  },
  {
    id: '15',
    restaurantName: 'GastronomicGrove',
    image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=500&h=300&q=80',
    duration: '20 min',
    cuisine: 'Italian',
    address: '3517 W. Gray St. Utica, P..',
    status: 'Cancelled',
  },
  {
    id: '16',
    restaurantName: 'GastronomicGrove',
    image: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=500&h=300&q=80',
    duration: '15 min',
    cuisine: 'Italian',
    address: '6391 Elgin St. Celina, De..',
    status: 'Cancelled',
  },
];

function MyOrdersScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = React.useState<TabType>('Completed');

  const filteredOrders = ORDERS.filter(order => order.status === activeTab);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>My Orders</ThemedText>
      </View>

      <View style={styles.tabsContainer}>
        {(['Active', 'Completed', 'Cancelled'] as TabType[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <ThemedText style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.content}>
        {filteredOrders.map((order) => (
          <View key={order.id} style={styles.orderCard}>
            {order.status === 'Active' && (
              <View style={styles.bookingDate}>
                <ThemedText style={styles.dateText}>{order.bookingDate}</ThemedText>
                <View style={styles.remindContainer}>
                  <ThemedText style={styles.remindText}>Remind me</ThemedText>
                  <Switch
                    value={order.remindMe}
                    onValueChange={() => {/* Handle remind toggle */}}
                    trackColor={{ false: '#E0E0E0', true: '#6B4EFF33' }}
                    thumbColor={order.remindMe ? '#6B4EFF' : '#fff'}
                    style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                  />
                </View>
              </View>
            )}
            <View style={styles.orderHeader}>
              <Image source={{ uri: order.image }} style={styles.restaurantImage} />
              <View style={styles.orderInfo}>
                <View style={styles.restaurantHeader}>
                  <ThemedText style={styles.restaurantName}>{order.restaurantName}</ThemedText>
                  {order.rating && (
                    <View style={styles.ratingContainer}>
                      <Ionicons name="star" size={16} color="#FFB800" />
                      <ThemedText style={styles.ratingText}>{order.rating}</ThemedText>
                    </View>
                  )}
                </View>
                <View style={styles.detailsRow}>
                  <View style={styles.detail}>
                    <Ionicons name="time-outline" size={16} color="#6B4EFF" />
                    <ThemedText style={styles.detailText}>{order.duration}</ThemedText>
                  </View>
                  <View style={styles.detail}>
                    <Ionicons name="restaurant-outline" size={16} color="#6B4EFF" />
                    <ThemedText style={styles.detailText}>{order.cuisine}</ThemedText>
                  </View>
                </View>
                <View style={styles.addressRow}>
                  <Ionicons name="location-outline" size={16} color="#666" />
                  <ThemedText style={styles.addressText}>{order.address}</ThemedText>
                </View>
              </View>
            </View>
            <View style={styles.buttonContainer}>
              {order.status === 'Active' ? (
                <>
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.cancelButton]}
                    onPress={() => {/* Handle cancel */}}
                  >
                    <ThemedText style={styles.cancelText}>Cancel</ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.navigateButton]}
                    onPress={() => {/* Handle navigate */}}
                  >
                    <ThemedText style={styles.navigateText}>Navigate</ThemedText>
                  </TouchableOpacity>
                </>
              ) : order.status === 'Completed' ? (
                <TouchableOpacity 
                  style={styles.writeReviewButton}
                  onPress={() => {
                    router.push({
                      pathname: '/write-review',
                      params: {
                        restaurantId: order.id,
                        bookingId: order.id,
                        restaurantName: order.restaurantName
                      }
                    });
                  }}
                >
                  <ThemedText style={styles.writeReviewText}>Write Review</ThemedText>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity 
                  style={[styles.actionButton, styles.reBookButton]}
                  onPress={() => {/* Handle re-book */}}
                >
                  <ThemedText style={styles.reBookText}>Re-Book</ThemedText>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}
      </ScrollView>
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
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  tab: {
    paddingVertical: 12,
    marginRight: 24,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#6B4EFF',
  },
  tabText: {
    fontSize: 15,
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#6B4EFF',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  orderHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  restaurantImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 16,
  },
  orderInfo: {
    flex: 1,
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  detailsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  detail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 13,
    color: '#666',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addressText: {
    fontSize: 13,
    color: '#666',
    flex: 1,
  },
  restaurantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  reBookButton: {
    backgroundColor: '#6B4EFF',
  },
  reBookText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  bookingDate: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  remindContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  remindText: {
    fontSize: 13,
    color: '#666',
  },
  cancelButton: {
    backgroundColor: '#F5F5F5',
  },
  navigateButton: {
    backgroundColor: '#6B4EFF',
  },
  cancelText: {
    color: '#6B4EFF',
    fontSize: 14,
    fontWeight: '600',
  },
  navigateText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  writeReviewButton: {
    backgroundColor: '#6B4EFF',
    padding: 12,
    borderRadius: 20,
  },
  writeReviewText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default withProtectedRoute(MyOrdersScreen); 