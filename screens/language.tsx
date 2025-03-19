import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState } from 'react';

const LANGUAGES = [
  { id: 'en', name: 'English' },
  { id: 'fr', name: 'French' },
  { id: 'de', name: 'Germany' },
  { id: 'it', name: 'Italian' },
  { id: 'ko', name: 'Korean' },
  { id: 'hi', name: 'Hindi' },
  { id: 'ar', name: 'Arabic' },
  { id: 'ru', name: 'Russia' },
  { id: 'es', name: 'Spanish' },
  { id: 'gu', name: 'Gujarati' },
  { id: 'bn', name: 'Bengali' },
  { id: 'he', name: 'Hebrew' },
  { id: 'ur', name: 'Urdu' },
  { id: 'uk', name: 'Ukrainian' },
  { id: 'nl', name: 'Dutch' },
] as const;

export default function LanguageScreen() {
  const router = useRouter();
  const [selectedLanguage, setSelectedLanguage] = useState('en');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.push('/(tabs)/profile')} 
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Language</ThemedText>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {LANGUAGES.map((language) => (
          <TouchableOpacity 
            key={language.id}
            style={styles.languageItem}
            onPress={() => setSelectedLanguage(language.id)}
          >
            <View style={styles.radioContainer}>
              <View style={[
                styles.radioOuter,
                selectedLanguage === language.id && styles.radioOuterSelected
              ]}>
                {selectedLanguage === language.id && (
                  <View style={styles.radioInner} />
                )}
              </View>
              <ThemedText style={styles.languageName}>{language.name}</ThemedText>
            </View>
          </TouchableOpacity>
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
  languageItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  radioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D1D1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  radioOuterSelected: {
    borderColor: '#6B4EFF',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#6B4EFF',
  },
  languageName: {
    fontSize: 16,
    color: '#333',
  },
}); 