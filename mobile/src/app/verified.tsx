import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AuthButton, AuthLayout, authColors } from '../components/auth-ui';
import { authClient } from '../lib/auth-client';

export default function VerifiedScreen() {
  const router = useRouter();
  useEffect(() => {
    let active = true;
    void authClient.getSession().then(({ data }) => {
      if (active && data?.user?.emailVerified) router.replace('/account');
    });
    return () => { active = false; };
  }, [router]);
  return (
    <AuthLayout>
      <Text style={styles.eyebrow}>COLOCSYNC</Text>
      <Text style={styles.title}>Adresse vérifiée</Text>
      <Text style={styles.body}>Votre e-mail est confirmé. Connectez-vous pour continuer.</Text>
      <View style={styles.action}>
        <AuthButton label="Se connecter" onPress={() => router.replace('/')} />
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  eyebrow: { color: authColors.blue, fontSize: 13, fontWeight: '700', letterSpacing: 2 },
  title: { color: authColors.ink, fontSize: 32, lineHeight: 38, fontWeight: '500', marginTop: 22 },
  body: { color: authColors.label, fontSize: 16, lineHeight: 24, marginTop: 12 },
  action: { marginTop: 34 },
});
