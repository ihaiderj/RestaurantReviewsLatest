import { View, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

const PLANS = [
  {
    id: 'free',
    title: 'Free',
    subtitle: 'Your current plan',
    features: [
      'Basic profile creation and browsing',
      'Limited Reservation.',
      'Limited access to special promotions.',
      'Receive confirmation notifications.',
    ],
    price: '0',
    isCurrentPlan: true,
  },
  {
    id: 'monthly',
    title: 'Pro Monthly',
    subtitle: 'Go Pro & Get more Benefits',
    features: [
      'All features of the Free Plan.',
      'Unlimited Reservation.',
      'Special Offers.',
      'Ad-free experience.',
    ],
    price: '9.99',
    period: '/month',
    buttonText: 'Select Plan',
  },
  {
    id: 'yearly',
    title: 'Pro Yearly',
    subtitle: 'Go Pro & Get more Benefits',
    features: [
      'All features of the Monthly Plan',
      'Priority Support',
      'Early access to new features',
      'Exclusive yearly member benefits',
    ],
    price: '69.99',
    period: '/Year',
    buttonText: 'Select Plan',
  },
];

export default function SubscriptionPlansScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Choose Your Plan</ThemedText>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {PLANS.map((plan) => (
          <View 
            key={plan.id} 
            style={[
              styles.planCard,
              plan.id === 'free' && styles.currentPlanCard
            ]}
          >
            <View style={styles.planHeader}>
              <ThemedText style={[
                styles.planTitle,
                plan.id === 'free' && styles.currentPlanTitle
              ]}>
                {plan.title}
              </ThemedText>
              <ThemedText style={[
                styles.planSubtitle,
                plan.id === 'free' && styles.currentPlanSubtitle
              ]}>
                {plan.subtitle}
              </ThemedText>
            </View>

            <View style={styles.featuresContainer}>
              {plan.features.map((feature, index) => (
                <View key={index} style={styles.featureRow}>
                  <Ionicons 
                    name="checkmark-circle" 
                    size={20} 
                    color={plan.id === 'free' ? '#fff' : '#6B4EFF'} 
                  />
                  <ThemedText style={[
                    styles.featureText,
                    plan.id === 'free' && styles.currentPlanFeatureText
                  ]}>
                    {feature}
                  </ThemedText>
                </View>
              ))}
            </View>

            {plan.price && (
              <View style={styles.priceContainer}>
                {plan.id !== 'free' && <ThemedText style={styles.currency}>$</ThemedText>}
                <ThemedText style={[
                  styles.price,
                  plan.id === 'free' && styles.currentPlanPrice
                ]}>
                  {plan.price}
                </ThemedText>
                {plan.period && (
                  <ThemedText style={[
                    styles.period,
                    plan.id === 'free' && styles.currentPlanPeriod
                  ]}>
                    {plan.period}
                  </ThemedText>
                )}
              </View>
            )}

            {plan.buttonText && (
              <TouchableOpacity 
                style={styles.selectButton}
                onPress={() => {
                  // Handle subscription
                  router.back();
                }}
              >
                <ThemedText style={styles.selectButtonText}>
                  {plan.buttonText}
                </ThemedText>
              </TouchableOpacity>
            )}
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
    gap: 16,
  },
  planCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  currentPlanCard: {
    backgroundColor: '#6B4EFF',
    borderColor: '#5B3EEF',
  },
  planHeader: {
    marginBottom: 20,
  },
  planTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
    color: '#000',
    paddingTop: 8,
  },
  currentPlanTitle: {
    color: '#fff',
  },
  planSubtitle: {
    fontSize: 16,
    color: '#666',
  },
  currentPlanSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  featuresContainer: {
    gap: 16,
    marginBottom: 24,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
    lineHeight: 22,
  },
  currentPlanFeatureText: {
    color: '#fff',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 24,
    paddingTop: 8,
  },
  currency: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    marginRight: 4,
    paddingTop: 10,
  },
  price: {
    fontSize: 36,
    fontWeight: '700',
    color: '#333',
    paddingTop: 15,
  },
  currentPlanPrice: {
    color: '#fff',
  },
  period: {
    fontSize: 16,
    color: '#666',
    marginLeft: 4,
  },
  currentPlanPeriod: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  selectButton: {
    backgroundColor: '#6B4EFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  selectButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 