import { View, StyleSheet, TouchableOpacity, SafeAreaView, TextInput } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { useState, useRef } from 'react';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';

export default function VerifyCodeScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();
  const [code, setCode] = useState(['', '', '', '']);
  const inputRefs = useRef<Array<TextInput | null>>([null, null, null, null]);

  const handleBack = () => {
    // Go back to sign up screen
    router.push('/(auth)/sign-up');
  };

  const handleCodeChange = (text: string, index: number) => {
    if (text.length <= 1) {
      const newCode = [...code];
      newCode[index] = text;
      setCode(newCode);

      // Move to next input if there's a value and next input exists
      if (text.length === 1 && index < 3) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleBackspace = (index: number) => {
    if (code[index] === '' && index > 0) {
      // Move to previous input if current is empty
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity 
        style={styles.backButton}
        onPress={handleBack}
      >
        <Ionicons name="arrow-back" size={24} color="#000" />
      </TouchableOpacity>

      <View style={styles.content}>
        <ThemedText style={styles.title}>Verify Code</ThemedText>
        <ThemedText style={styles.subtitle}>
          Please enter the code we just sent to email{'\n'}
          <ThemedText style={styles.email}>{email}</ThemedText>
        </ThemedText>

        <View style={styles.codeContainer}>
          {code.map((digit, index) => (
            <TextInput
              key={index}
              ref={ref => inputRefs.current[index] = ref}
              style={styles.codeInput}
              value={digit}
              onChangeText={(text) => handleCodeChange(text, index)}
              keyboardType="number-pad"
              maxLength={1}
              onKeyPress={({ nativeEvent }) => {
                if (nativeEvent.key === 'Backspace') {
                  handleBackspace(index);
                }
              }}
            />
          ))}
        </View>

        <TouchableOpacity 
          style={styles.resendContainer}
          onPress={() => {
            // Handle resend code logic
          }}
        >
          <ThemedText style={styles.resendText}>Didn't receive OTP?</ThemedText>
          <ThemedText style={styles.resendLink}>Resend code</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[
            styles.verifyButton,
            !code.every(digit => digit !== '') && styles.verifyButtonDisabled
          ]}
          disabled={!code.every(digit => digit !== '')}
          onPress={() => router.push('/(tabs)')}
        >
          <ThemedText style={styles.verifyButtonText}>Verify</ThemedText>
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
  backButton: {
    padding: 16,
    position: 'absolute',
    top: 8,
    left: 8,
    zIndex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
    textAlign: 'center',
  },
  email: {
    color: '#6B4EFF',
  },
  codeContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  codeInput: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    fontSize: 20,
    textAlign: 'center',
    color: '#333',
  },
  resendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 32,
  },
  resendText: {
    fontSize: 14,
    color: '#666',
  },
  resendLink: {
    fontSize: 14,
    color: '#6B4EFF',
    fontWeight: '600',
  },
  verifyButton: {
    backgroundColor: '#6B4EFF',
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    width: '100%',
  },
  verifyButtonDisabled: {
    backgroundColor: '#D1D1D1',
  },
  verifyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 