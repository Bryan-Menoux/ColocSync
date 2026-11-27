import { useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { AuthButton, AuthField, AuthHeading, AuthLayout, AuthMessage, AuthLink } from '../components/auth-ui';
import { authClient } from '../lib/auth-client';
import { getAuthConfig } from '../lib/api';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const authConfig = useQuery({ queryKey: ['auth-config'], queryFn: getAuthConfig, staleTime: 300_000 });
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState(false);

  async function requestReset() {
    if (!email.trim()) {
      setMessage('Saisissez votre adresse e-mail.');
      setError(true);
      return;
    }
    setBusy(true);
    setMessage('');
    try {
      const result = await authClient.requestPasswordReset({
        email: email.trim(),
        redirectTo: Platform.OS === 'web'
          ? (typeof window !== 'undefined' ? `${window.location.origin}/reset-password` : '/reset-password')
          : 'colocsync:///reset-password',
      });
      setError(Boolean(result.error));
      setMessage(result.error
        ? 'La demande n’a pas abouti. Vérifiez votre connexion puis réessayez.'
        : 'Si un compte correspond à cette adresse, un lien de réinitialisation a été envoyé.');
    } catch {
      setError(true);
      setMessage('Service de réinitialisation indisponible. Réessayez plus tard.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.page}>
      <AuthLayout>
        <View style={styles.heading}>
          <AuthHeading
            title="Mot de passe oublié ?"
            subtitle="Nous vous enverrons un lien pour en choisir un nouveau."
          />
        </View>
        <View style={styles.form}>
          {authConfig.data && !authConfig.data.emailDeliveryEnabled && (
            <AuthMessage text="Le serveur n’annonce pas l’envoi des e-mails actif. La demande peut échouer si Resend n’est pas configuré." />
          )}
          {authConfig.isError && <AuthMessage text="Impossible de joindre l’API." error />}
          <AuthField
            label="Email"
            placeholder="Saisissez votre email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
            returnKeyType="go"
            onSubmitEditing={() => void requestReset()}
          />
          <AuthMessage text={message} error={error} />
          <View style={styles.submit}>
            <AuthButton label="Envoyer le lien" onPress={() => void requestReset()} loading={busy} />
          </View>
        </View>
      </AuthLayout>
      <View style={styles.back}>
        <AuthLink label="‹ Retour à la connexion" onPress={() => router.replace('/')} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  back: { position: 'absolute', top: 0, left: 0, zIndex: 1, paddingTop: 18, paddingLeft: 18 },
  heading: { marginTop: 38 },
  form: { marginTop: 36 },
  submit: { marginTop: 34 },
});
