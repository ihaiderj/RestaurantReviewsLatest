import * as React from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, TextInput, Dimensions } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

// Define valid icon types
type IconName = React.ComponentProps<typeof Ionicons>['name'];

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  icon: IconName;
  category: string;
}

const FAQ_ITEMS: FAQItem[] = [
  {
    id: '1',
    question: 'How do I make a reservation using the app?',
    answer: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    icon: 'calendar-outline',
    category: 'Services',
  },
  {
    id: '2',
    question: 'Can I cancel my reservation through the app?',
    answer: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    icon: 'close-circle-outline',
    category: 'Services',
  },
  {
    id: '3',
    question: 'How do I view or track my reservation history?',
    answer: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    icon: 'time-outline',
    category: 'Account',
  },
  {
    id: '4',
    question: 'Is the app available in multiple languages?',
    answer: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    icon: 'language-outline',
    category: 'General',
  },
  {
    id: '5',
    question: 'Can I contact the restaurant directly in app?',
    answer: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    icon: 'call-outline',
    category: 'Services',
  },
  {
    id: '6',
    question: 'How do I provide feedback to restaurant?',
    answer: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    icon: 'star-outline',
    category: 'Services',
  },
  {
    id: '7',
    question: 'How to add favorite restaurant to wishlist?',
    answer: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    icon: 'heart-outline',
    category: 'General',
  },
];

interface Category {
  id: string;
  name: string;
  icon: IconName;
}

const CATEGORIES: Category[] = [
  { id: 'all', name: 'All', icon: 'grid-outline' },
  { id: 'services', name: 'Services', icon: 'restaurant-outline' },
  { id: 'general', name: 'General', icon: 'information-circle-outline' },
  { id: 'account', name: 'Account', icon: 'person-outline' },
];

interface ContactOption {
  id: string;
  title: string;
  icon: IconName;
  value?: string;
  link?: string;
}

const CONTACT_OPTIONS: ContactOption[] = [
  {
    id: 'customer-service',
    title: 'Customer Service',
    icon: 'headset-outline',
    value: 'Available 24/7',
  },
  {
    id: 'whatsapp',
    title: 'WhatsApp',
    icon: 'logo-whatsapp',
    value: '(480) 555-0103',
  },
  {
    id: 'website',
    title: 'Website',
    icon: 'globe-outline',
    link: 'https://example.com',
  },
  {
    id: 'facebook',
    title: 'Facebook',
    icon: 'logo-facebook',
    link: 'https://facebook.com/example',
  },
  {
    id: 'twitter',
    title: 'Twitter',
    icon: 'logo-twitter',
    link: 'https://twitter.com/example',
  },
  {
    id: 'instagram',
    title: 'Instagram',
    icon: 'logo-instagram',
    link: 'https://instagram.com/example',
  },
];

export default function HelpScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = React.useState<'FAQ' | 'Contact Us'>('FAQ');
  const [activeCategory, setActiveCategory] = React.useState('all');
  const [expandedItem, setExpandedItem] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [expandedContact, setExpandedContact] = React.useState<string | null>(null);

  const filteredFAQs = FAQ_ITEMS.filter(item => {
    const matchesSearch = item.question.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'all' || item.category.toLowerCase() === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.push('/(tabs)/profile')} 
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Help Center</ThemedText>
      </View>

      <View style={styles.mainContent}>
        <View style={styles.searchContainer}>
          <View style={styles.searchBox}>
            <Ionicons name="search-outline" size={20} color="#666" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search for help"
              placeholderTextColor="#666"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        <View style={styles.tabsContainer}>
          {['FAQ', 'Contact Us'].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.activeTab]}
              onPress={() => setActiveTab(tab as 'FAQ' | 'Contact Us')}
            >
              <ThemedText style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                {tab}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>

        {activeTab === 'FAQ' && (
          <>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.categoryContainer}
              contentContainerStyle={styles.categoryContent}
            >
              {CATEGORIES.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[styles.categoryPill, activeCategory === category.id && styles.activeCategoryPill]}
                  onPress={() => setActiveCategory(category.id)}
                >
                  <Ionicons 
                    name={category.icon} 
                    size={18} 
                    color={activeCategory === category.id ? '#fff' : '#666'} 
                  />
                  <ThemedText style={[styles.categoryText, activeCategory === category.id && styles.activeCategoryText]}>
                    {category.name}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <ScrollView style={styles.faqList} showsVerticalScrollIndicator={false}>
              {filteredFAQs.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.faqItem, expandedItem === item.id && styles.expandedFaqItem]}
                  onPress={() => setExpandedItem(expandedItem === item.id ? null : item.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.faqHeader}>
                    <View style={styles.faqIconContainer}>
                      <Ionicons name={item.icon} size={20} color="#6B4EFF" />
                    </View>
                    <View style={styles.faqContent}>
                      <ThemedText style={styles.question}>{item.question}</ThemedText>
                      {expandedItem === item.id && (
                        <ThemedText style={styles.answer}>{item.answer}</ThemedText>
                      )}
                    </View>
                    <Ionicons 
                      name={expandedItem === item.id ? 'chevron-up' : 'chevron-down'} 
                      size={20} 
                      color="#666" 
                    />
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        )}

        {activeTab === 'Contact Us' && (
          <ScrollView style={styles.contactContainer}>
            {CONTACT_OPTIONS.map((option) => (
              <View key={option.id} style={styles.contactItem}>
                <TouchableOpacity
                  style={styles.contactButton}
                  onPress={() => {
                    setExpandedContact(expandedContact === option.id ? null : option.id);
                  }}
                >
                  <View style={styles.contactLeft}>
                    <View style={[styles.contactIconContainer, { backgroundColor: '#F0F0FF' }]}>
                      <Ionicons name={option.icon} size={24} color="#6B4EFF" />
                    </View>
                    <View>
                      <ThemedText style={styles.contactTitle}>{option.title}</ThemedText>
                      {expandedContact === option.id && option.value && (
                        <ThemedText style={styles.contactValue}>{option.value}</ThemedText>
                      )}
                      {expandedContact === option.id && option.link && (
                        <TouchableOpacity onPress={() => {/* Handle link press */}}>
                          <ThemedText style={[styles.contactValue, styles.contactLink]}>
                            {option.link}
                          </ThemedText>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                  <Ionicons 
                    name={expandedContact === option.id ? 'chevron-up' : 'chevron-down'} 
                    size={20} 
                    color="#666" 
                  />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        )}
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
  mainContent: {
    flex: 1,
  },
  searchContainer: {
    padding: 12,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 40,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
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
  categoryContainer: {
    maxHeight: 50,
    paddingVertical: 6,
  },
  categoryContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
    height: 42,
  },
  activeCategoryPill: {
    backgroundColor: '#6B4EFF',
  },
  categoryText: {
    padding: 4,
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  activeCategoryText: {
    color: '#fff',
  },
  faqList: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  faqItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  expandedFaqItem: {
    backgroundColor: '#F8F8FF',
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    gap: 12,
  },
  faqIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0F0FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  faqContent: {
    flex: 1,
  },
  question: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    lineHeight: 20,
  },
  answer: {
    fontSize: 13,
    color: '#666',
    marginTop: 8,
    lineHeight: 18,
  },
  contactContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  contactItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  contactLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  contactIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactTitle: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  contactValue: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  contactLink: {
    color: '#6B4EFF',
    textDecorationLine: 'underline',
  },
}); 