
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  AuthButton,
  AuthCheckbox,
  AuthDivider,
  AuthField,
  AuthFooter,
  AuthHeading,
  AuthLayout,
  AuthMessage,
  AuthLink,
  SocialButtons,
  friendlyAuthError,
} from '../components/auth-ui';
import { authClient } from '../lib/auth-client';

export default function LoginScreen() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (session?.user) router.replace('/account');
  }, [router, session?.user]);

  async function signIn() {
    if (!email.trim() || !password) {
      setError('Saisissez votre adresse e-mail et votre mot de passe.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const { error: authError } = await authClient.signIn.email({
        email: email.trim(),
        password,
        rememberMe,
        callbackURL: '/account',
      });
      if (authError) {
        if (authError.code === 'EMAIL_NOT_VERIFIED') {
          router.replace({ pathname: '/verify-email', params: { email: email.trim() } });
          return;
        }
        setError(friendlyAuthError(authError, 'Connexion impossible. Vérifiez vos identifiants puis réessayez.'));
        return;
      }
      router.replace('/account');
    } catch {
      setError('Service de connexion indisponible. Réessayez plus tard.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout>
      <AuthHeading title={'BON RETOUR\nPARMIS NOUS'} subtitle="Connecte toi à ton compte pour continuer" />

      <View style={styles.form}>
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
          autoComplete="current-password"
          textContentType="password"
          returnKeyType="go"
          onSubmitEditing={() => void signIn()}
        />
        <View style={styles.options}>
          <AuthCheckbox checked={rememberMe} onPress={() => setRememberMe(!rememberMe)} label="Se rappeler de moi" />
          <AuthLink label="Mot de passe oublié?" onPress={() => router.push('/forgot-password')} />
        </View>
        <AuthMessage text={error} error />
        <View style={styles.submit}>
          <AuthButton label="Se Connecter" onPress={() => void signIn()} loading={busy} />
        </View>
      </View>

      <AuthDivider />
      <SocialButtons />
      <AuthFooter
        prompt="Tu n’as pas de compte ?"
        linkLabel="S’inscrire"
        onPress={() => router.push('/register')}
      />
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  form: { marginTop: 32 },
  options: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: -5 },
  submit: { marginTop: 42 },
});
