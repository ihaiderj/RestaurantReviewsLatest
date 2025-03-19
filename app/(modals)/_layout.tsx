import { Stack } from 'expo-router';

export default function ModalLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="special-offers" />
      <Stack.Screen name="restaurant-profile" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="popular-restaurants" />
      <Stack.Screen name="book-table" />
      <Stack.Screen name="booking-summary" />
      <Stack.Screen name="booking-success" />
      <Stack.Screen name="e-ticket" />
      <Stack.Screen name="write-review" />
      <Stack.Screen name="filter-options" />
    </Stack>
  );
}
