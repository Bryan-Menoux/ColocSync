import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { AuthLayout, authColors } from '../components/auth-ui';
import { authClient } from '../lib/auth-client';

export default function AccountScreen() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (!isPending && !session?.user) router.replace('/');
  }, [isPending, router, session?.user]);

  async function signOut() {
    try {
      await authClient.signOut();
    } finally {
      router.replace('/');
    }
  }

  if (isPending || !session?.user) {
    return <View style={styles.loading}><ActivityIndicator color={authColors.blue} /></View>;
  }

  return (
    <AuthLayout>
      <Text style={styles.eyebrow}>COLOCSYNC</Text>
      <Text style={styles.title}>Bonjour {session.user.name}</Text>
      <Text style={styles.email}>{session.user.email}</Text>
      <View style={styles.actionList}>
        <Pressable accessibilityRole="button" onPress={() => router.push('/change-password')} style={styles.action}>
          <Text style={styles.actionText}>Modifier le mot de passe</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => void signOut()} style={[styles.action, styles.secondaryAction]}>
          <Text style={styles.secondaryText}>Se déconnecter</Text>
        </Pressable>
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  eyebrow: { color: authColors.blue, fontSize: 13, fontWeight: '700', letterSpacing: 2 },
  title: { color: authColors.ink, fontSize: 32, lineHeight: 40, fontWeight: '500', marginTop: 22 },
  email: { color: authColors.label, fontSize: 16, marginTop: 10 },
  actionList: { gap: 14, marginTop: 34 },
  action: { minHeight: 54, justifyContent: 'center', alignItems: 'center', borderRadius: 28, backgroundColor: '#000' },
  actionText: { color: '#e7f3f7', fontSize: 16, fontWeight: '600' },
  secondaryAction: { backgroundColor: '#f5f5f3', borderWidth: 1, borderColor: authColors.border },
  secondaryText: { color: authColors.ink, fontSize: 16, fontWeight: '600' },
});
