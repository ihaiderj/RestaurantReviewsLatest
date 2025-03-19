import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { withProtectedRoute } from '@/utils/protected-route';

const SETTINGS_OPTIONS = [
  {
    id: 'notifications',
    icon: 'notifications-outline',
    title: 'Notification Settings',
    color: '#6B4EFF',
  },
  {
    id: 'password',
    icon: 'key-outline',
    title: 'Password Manager',
    color: '#6B4EFF',
  },
  {
    id: 'delete',
    icon: 'trash-outline',
    title: 'Delete Account',
    color: '#FF4B55',
  },
] as const;

function SettingsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.push('/(tabs)/profile')} 
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Settings</ThemedText>
      </View>

      <View style={styles.content}>
        {SETTINGS_OPTIONS.map((option) => (
          <TouchableOpacity 
            key={option.id}
            style={styles.optionItem}
            onPress={() => {
              // Handle different settings options
              switch(option.id) {
                case 'notifications':
                  // Navigate to notifications settings
                  break;
                case 'password':
                  // Navigate to password manager
                  break;
                case 'delete':
                  // Show delete account confirmation
                  break;
              }
            }}
          >
            <View style={styles.optionLeft}>
              <View style={[styles.iconContainer, { backgroundColor: `${option.color}15` }]}>
                <Ionicons name={option.icon} size={24} color={option.color} />
              </View>
              <ThemedText style={[
                styles.optionTitle,
                option.id === 'delete' && styles.deleteText
              ]}>
                {option.title}
              </ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#666" />
          </TouchableOpacity>
        ))}
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
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  content: {
    padding: 16,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionTitle: {
    fontSize: 16,
    color: '#333',
  },
  deleteText: {
    color: '#FF4B55',
  },
});

export default withProtectedRoute(SettingsScreen); 