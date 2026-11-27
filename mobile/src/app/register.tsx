import { useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import {
  AuthButton,
  AuthCheckbox,
  AuthDivider,
  AuthField,
  AuthFooter,
  AuthLayout,
  AuthMessage,
  SocialButtons,
  authColors,
  friendlyAuthError,
} from '../components/auth-ui';
import { authClient } from '../lib/auth-client';
import { getAuthConfig } from '../lib/api';

export default function RegisterScreen() {
  const router = useRouter();
  const authConfig = useQuery({ queryKey: ['auth-config'], queryFn: getAuthConfig, staleTime: 300_000 });
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function signUp() {
    if (!authConfig.data) {
      setError('Impossible de vérifier la configuration de l’API. Réessayez plus tard.');
      return;
    }
    if (!name.trim() || !email.trim() || !password) {
      setError('Renseignez votre surnom, votre e-mail et votre mot de passe.');
      return;
    }
    if (password.length < 8 || password.length > 128) {
      setError('Le mot de passe doit contenir entre 8 et 128 caractères.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const callbackURL = Platform.OS === 'web'
        ? (typeof window !== 'undefined' ? `${window.location.origin}/verified` : '/verified')
        : 'colocsync:///verified';
      const { error: authError } = await authClient.signUp.email({
        name: name.trim(),
        email: email.trim(),
        password,
        callbackURL,
        fetchOptions: {
          body: { name: name.trim(), email: email.trim(), password, callbackURL, rememberMe },
        },
      });
      if (authError) {
        setError(friendlyAuthError(authError, 'Impossible de créer le compte. Vérifiez votre saisie puis réessayez.'));
        return;
      }
      if (authConfig.data.emailDeliveryEnabled) {
        const { data: session } = await authClient.getSession();
        if (!session?.user) {
          setError('Compte créé, mais la session de vérification est indisponible. Connectez-vous pour continuer.');
          router.replace({ pathname: '/verify-email', params: { email: email.trim() } });
          return;
        }
        router.replace({ pathname: '/verify-email', params: { email: email.trim() } });
      } else {
        router.replace('/account');
      }
    } catch {
      setError('Service d’inscription indisponible. Réessayez plus tard.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout compact>
      <View style={styles.step}>
        <Text style={styles.stepText}>Étape 1 sur 2</Text>
        <View style={styles.rule} />
      </View>
      <View style={styles.intro}>
        <Text style={styles.heading}>Créer un compte</Text>
        <Text style={styles.subtitle}>Inscrivez-vous pour commencer votre coloc</Text>
      </View>

      <View style={styles.form}>
        <AuthField
          label="Ton surnom"
          placeholder="Saisissez votre surnom"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
          autoComplete="name"
          textContentType="nickname"
          maxLength={80}
          returnKeyType="next"
        />
        <AuthField
          label="Email"
          placeholder="Saisissez votre email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          textContentType="emailAddress"
          returnKeyType="next"
        />
        <AuthField
          label="Mot de passe"
          placeholder="Saisissez votre mot de passe"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="go"
          onSubmitEditing={() => void signUp()}
        />
        <AuthCheckbox checked={rememberMe} onPress={() => setRememberMe(!rememberMe)} label="Se rappeler de moi" />
        {authConfig.data && !authConfig.data.emailDeliveryEnabled && (
          <AuthMessage text="Vérification par e-mail désactivée temporairement; votre compte sera utilisable tout de suite." />
        )}
        {authConfig.isError && <AuthMessage text="API inaccessible; vérifiez que le service est démarré." error />}
        <AuthMessage text={error} error />
        <View style={styles.submit}>
          <AuthButton label="Continuer" onPress={() => void signUp()} loading={busy} disabled={!authConfig.data} />
        </View>
      </View>

      <AuthDivider />
      <SocialButtons />
      <AuthFooter
        prompt="Tu as déjà un compte ?"
        linkLabel="Se connecter"
        onPress={() => router.replace('/')}
      />
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  step: { alignItems: 'center' },
  stepText: { color: authColors.ink, fontSize: 20, lineHeight: 26 },
  rule: { width: '100%', height: 1, backgroundColor: '#aaa99f', marginTop: 4 },
  intro: { marginTop: 22 },
  heading: { color: authColors.ink, fontSize: 34, fontWeight: '500', lineHeight: 40, letterSpacing: -0.7 },
  subtitle: { color: authColors.blue, fontSize: 16, lineHeight: 22, marginTop: 4 },
  form: { marginTop: 38 },
  submit: { marginTop: 58 },
});
