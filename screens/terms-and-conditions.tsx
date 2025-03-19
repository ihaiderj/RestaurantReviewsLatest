import { View, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function TermsAndConditionsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Terms & Conditions</ThemedText>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>1. Acceptance of Terms</ThemedText>
          <ThemedText style={styles.text}>
            By accessing and using this application, you accept and agree to be bound by the terms and 
            provision of this agreement.
          </ThemedText>
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>2. User Account</ThemedText>
          <ThemedText style={styles.text}>
            To use certain features of the application, you must register for an account. You agree to 
            provide accurate information and keep it updated.
          </ThemedText>
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>3. Privacy Policy</ThemedText>
          <ThemedText style={styles.text}>
            Your privacy is important to us. Our Privacy Policy explains how we collect, use, and protect 
            your personal information.
          </ThemedText>
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>4. User Conduct</ThemedText>
          <ThemedText style={styles.text}>
            You agree not to use the application for any unlawful purpose or prohibited by these terms. 
            You agree not to transmit any material that contains viruses or other harmful code.
          </ThemedText>
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>5. Content</ThemedText>
          <ThemedText style={styles.text}>
            Users are responsible for the content they post. We reserve the right to remove any content 
            that violates these terms or is otherwise objectionable.
          </ThemedText>
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>6. Modifications</ThemedText>
          <ThemedText style={styles.text}>
            We reserve the right to modify these terms at any time. Your continued use of the application 
            following any changes indicates your acceptance of the new terms.
          </ThemedText>
        </View>
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
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  text: {
    fontSize: 15,
    color: '#666',
    lineHeight: 24,
  },
}); 