import '../../global.css';
import { Stack } from 'expo-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../lib/query-client';
import { AuthGuard } from '../components/auth-guard';

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthGuard>
        <Stack screenOptions={{ headerShown: false }} />
      </AuthGuard>
    </QueryClientProvider>
  );
}
