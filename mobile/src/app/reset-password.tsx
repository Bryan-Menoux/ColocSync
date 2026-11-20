import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AuthButton, AuthField, AuthHeading, AuthLayout, AuthMessage } from '../components/auth-ui';
import { authClient } from '../lib/auth-client';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ token?: string | string[] }>();
  const token = Array.isArray(params.token) ? params.token[0] : params.token;
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState(false);

  async function resetPassword() {
    if (!token) {
      setMessage('Ce lien est invalide ou expiré. Demandez une nouvelle réinitialisation.');
      setError(true);
      return;
    }
    if (password.length < 8 || password.length > 128) {
      setMessage('Le mot de passe doit contenir entre 8 et 128 caractères.');
      setError(true);
      return;
    }
    if (password !== confirmation) {
      setMessage('Les deux mots de passe ne correspondent pas.');
      setError(true);
      return;
    }
    setBusy(true);
    setMessage('');
    try {
      const result = await authClient.resetPassword({ newPassword: password, token });
      if (result.error) {
        setError(true);
        setMessage('Le lien a peut-être expiré. Demandez une nouvelle réinitialisation.');
        return;
      }
      setError(false);
      setMessage('Votre mot de passe a été modifié.');
      router.replace('/');
    } catch {
      setError(true);
      setMessage('Service de réinitialisation indisponible. Réessayez plus tard.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout>
      <AuthHeading title="Nouveau mot de passe" subtitle="Choisissez un mot de passe sécurisé." />
      <View style={styles.form}>
        <AuthField
          label="Nouveau mot de passe"
          placeholder="8 caractères minimum"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="next"
        />
        <AuthField
          label="Confirmer le mot de passe"
          placeholder="Saisissez-le à nouveau"
          value={confirmation}
          onChangeText={setConfirmation}
          secureTextEntry
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="go"
          onSubmitEditing={() => void resetPassword()}
        />
        <AuthMessage text={message} error={error} />
        <View style={styles.submit}>
          <AuthButton label="Modifier le mot de passe" onPress={() => void resetPassword()} loading={busy} />
        </View>
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({ form: { marginTop: 36 }, submit: { marginTop: 28 } });
