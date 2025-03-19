import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  icon: IconName;
  iconBgColor: string;
  iconColor: string;
  time: string;
  date: 'TODAY' | 'YESTERDAY';
}

const NOTIFICATIONS: NotificationItem[] = [
  {
    id: '1',
    title: 'Table Booked Successfully!',
    message: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    icon: 'restaurant-outline' as IconName,
    iconBgColor: '#F0F0FF',
    iconColor: '#6B4EFF',
    time: '1h',
    date: 'TODAY',
  },
  {
    id: '2',
    title: 'Yearly Planned Renewed',
    message: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    icon: 'ribbon-outline' as IconName,
    iconBgColor: '#FFF0E6',
    iconColor: '#FF8C40',
    time: '1h',
    date: 'TODAY',
  },
  {
    id: '3',
    title: 'Restaurant Review Request',
    message: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    icon: 'star-outline' as IconName,
    iconBgColor: '#F0F0FF',
    iconColor: '#6B4EFF',
    time: '1h',
    date: 'TODAY',
  },
  {
    id: '4',
    title: 'You Arrived at Location',
    message: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    icon: 'location-outline' as IconName,
    iconBgColor: '#E6F6F0',
    iconColor: '#00BA88',
    time: '1d',
    date: 'YESTERDAY',
  },
  {
    id: '5',
    title: '20% Off on Food',
    message: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    icon: 'pricetag-outline' as IconName,
    iconBgColor: '#FFE6E6',
    iconColor: '#FF4B55',
    time: '1d',
    date: 'YESTERDAY',
  },
  {
    id: '6',
    title: 'Table Booked Successfully!',
    message: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    icon: 'restaurant-outline' as IconName,
    iconBgColor: '#F0F0FF',
    iconColor: '#6B4EFF',
    time: '1d',
    date: 'YESTERDAY',
  },
];

export default function NotificationsScreen() {
  const router = useRouter();

  const groupedNotifications = NOTIFICATIONS.reduce((acc, notification) => {
    if (!acc[notification.date]) {
      acc[notification.date] = [];
    }
    acc[notification.date].push(notification);
    return acc;
  }, {} as Record<string, NotificationItem[]>);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Notification</ThemedText>
        <View style={styles.newBadge}>
          <ThemedText style={styles.newBadgeText}>2 NEW</ThemedText>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {Object.entries(groupedNotifications).map(([date, notifications]) => (
          <View key={date}>
            <View style={styles.dateHeader}>
              <ThemedText style={styles.dateText}>{date}</ThemedText>
              <TouchableOpacity>
                <ThemedText style={styles.markAllText}>Mark all as read</ThemedText>
              </TouchableOpacity>
            </View>

            {notifications.map((notification) => (
              <TouchableOpacity 
                key={notification.id}
                style={styles.notificationItem}
              >
                <View style={[styles.iconContainer, { backgroundColor: notification.iconBgColor }]}>
                  <Ionicons name={notification.icon} size={24} color={notification.iconColor} />
                </View>
                <View style={styles.notificationContent}>
                  <View style={styles.notificationHeader}>
                    <ThemedText style={styles.notificationTitle}>{notification.title}</ThemedText>
                    <ThemedText style={styles.timeText}>{notification.time}</ThemedText>
                  </View>
                  <ThemedText style={styles.messageText}>{notification.message}</ThemedText>
                </View>
              </TouchableOpacity>
            ))}
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
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 12,
  },
  newBadge: {
    backgroundColor: '#6B4EFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  newBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dateText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  markAllText: {
    fontSize: 13,
    color: '#6B4EFF',
    fontWeight: '500',
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
    marginRight: 8,
  },
  timeText: {
    fontSize: 12,
    color: '#666',
  },
  messageText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
}); 