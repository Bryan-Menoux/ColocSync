import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { AuthButton, AuthLayout, AuthMessage, AuthLink, authColors } from '../components/auth-ui';
import { authClient } from '../lib/auth-client';
import { getAuthConfig } from '../lib/api';

export default function VerifyEmailScreen() {
  const router = useRouter();
  const authConfig = useQuery({ queryKey: ['auth-config'], queryFn: getAuthConfig, staleTime: 300_000 });
  const params = useLocalSearchParams<{ email?: string | string[] }>();
  const email = Array.isArray(params.email) ? params.email[0] : params.email;
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState(false);

  async function resend() {
    if (!authConfig.data?.emailDeliveryEnabled) {
      setMessage('La vérification par e-mail est désactivée temporairement. Vous pouvez vous connecter.');
      setError(true);
      return;
    }
    if (!email) {
      setMessage('Saisissez votre adresse e-mail sur la page de connexion pour continuer.');
      setError(true);
      return;
    }
    setBusy(true);
    setMessage('');
    try {
      const result = await authClient.sendVerificationEmail({
        email,
        callbackURL: 'colocsync:///verified',
      });
      setError(Boolean(result.error));
      setMessage(result.error
        ? 'Impossible d’envoyer l’e-mail pour le moment. Réessayez plus tard.'
        : 'Si cette adresse attend une vérification, un nouveau lien a été envoyé.');
    } catch {
      setError(true);
      setMessage('Service d’e-mail indisponible. Réessayez plus tard.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout>
      <Text style={styles.eyebrow}>COLOCSYNC</Text>
      <Text style={styles.title}>Vérifiez votre e-mail</Text>
      <Text style={styles.body}>
        {authConfig.data?.emailDeliveryEnabled
          ? `Nous avons envoyé un lien de confirmation${email ? ` à ${email}` : ''}. Ouvrez-le pour activer votre compte.`
          : 'La vérification par e-mail est désactivée temporairement. Vous pouvez vous connecter.'}
      </Text>
      <AuthMessage text={message} error={error} />
      <View style={styles.action}>
        {authConfig.data?.emailDeliveryEnabled ? (
          <AuthButton label="Renvoyer le lien" onPress={() => void resend()} loading={busy} />
        ) : (
          <AuthButton label="Se connecter" onPress={() => router.replace('/')} />
        )}
      </View>
      <View style={styles.back}>
        <AuthLink label="Retour à la connexion" onPress={() => router.replace('/')} />
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  eyebrow: { color: authColors.blue, fontSize: 13, fontWeight: '700', letterSpacing: 2 },
  title: { color: authColors.ink, fontSize: 32, lineHeight: 38, fontWeight: '500', marginTop: 22 },
  body: { color: authColors.label, fontSize: 16, lineHeight: 24, marginTop: 12 },
  action: { marginTop: 34 },
  back: { alignItems: 'center', marginTop: 24 },
});
