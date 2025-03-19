import { View, StyleSheet, TouchableOpacity, Share } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

interface ShareOption {
  id: string;
  title: string;
  icon: IconName;
  color: string;
}

const SHARE_OPTIONS: ShareOption[] = [
  {
    id: 'whatsapp',
    title: 'WhatsApp',
    icon: 'logo-whatsapp' as IconName,
    color: '#25D366',
  },
  {
    id: 'facebook',
    title: 'Facebook',
    icon: 'logo-facebook' as IconName,
    color: '#1877F2',
  },
  {
    id: 'twitter',
    title: 'Twitter',
    icon: 'logo-twitter' as IconName,
    color: '#1DA1F2',
  },
  {
    id: 'instagram',
    title: 'Instagram',
    icon: 'logo-instagram' as IconName,
    color: '#E4405F',
  },
  {
    id: 'copy',
    title: 'Copy Link',
    icon: 'link-outline' as IconName,
    color: '#6B4EFF',
  },
  {
    id: 'more',
    title: 'More Options',
    icon: 'share-social-outline' as IconName,
    color: '#666',
  },
];

export default function InviteFriendsScreen() {
  const router = useRouter();

  const handleShare = async (option: ShareOption) => {
    try {
      const message = 'Join me on Restaurant Reviews! Download the app now: https://example.com/app';
      
      if (option.id === 'copy') {
        // Handle copy to clipboard
      } else {
        await Share.share({
          message,
          title: 'Invite Friends to Restaurant Reviews',
        });
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.push('/(tabs)/profile')} 
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Invite Friends</ThemedText>
      </View>

      <View style={styles.content}>
        <View style={styles.illustrationContainer}>
          <View style={styles.illustration}>
            <Ionicons name="people" size={80} color="#6B4EFF" />
          </View>
          <ThemedText style={styles.title}>Invite Your Friends</ThemedText>
          <ThemedText style={styles.subtitle}>
            Share the app with your friends and family
          </ThemedText>
        </View>

        <View style={styles.shareGrid}>
          {SHARE_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={styles.shareOption}
              onPress={() => handleShare(option)}
            >
              <View style={[styles.iconContainer, { backgroundColor: `${option.color}15` }]}>
                <Ionicons name={option.icon} size={24} color={option.color} />
              </View>
              <ThemedText style={styles.optionTitle}>{option.title}</ThemedText>
            </TouchableOpacity>
          ))}
        </View>
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
    paddingVertical: 8,
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
  content: {
    flex: 1,
    padding: 16,
  },
  illustrationContainer: {
    alignItems: 'center',
    marginVertical: 32,
  },
  illustration: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#F0F0FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  shareGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
    paddingHorizontal: 8,
  },
  shareOption: {
    width: '30%',
    alignItems: 'center',
    gap: 8,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionTitle: {
    fontSize: 14,
    color: '#333',
  },
}); 