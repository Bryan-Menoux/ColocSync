import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { AuthButton, AuthField, AuthHeading, AuthLayout, AuthMessage } from '../components/auth-ui';
import { authClient } from '../lib/auth-client';

export default function ChangePasswordScreen() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!isPending && !session?.user) router.replace('/');
  }, [isPending, router, session?.user]);

  async function changePassword() {
    if (!currentPassword || !password) {
      setMessage('Renseignez votre mot de passe actuel et le nouveau.');
      setError(true);
      return;
    }
    if (password.length < 8 || password.length > 128) {
      setMessage('Le nouveau mot de passe doit contenir entre 8 et 128 caractères.');
      setError(true);
      return;
    }
    if (password !== confirmation) {
      setMessage('Les deux nouveaux mots de passe ne correspondent pas.');
      setError(true);
      return;
    }
    setBusy(true);
    setMessage('');
    try {
      const result = await authClient.changePassword({
        currentPassword,
        newPassword: password,
        revokeOtherSessions: true,
      });
      setError(Boolean(result.error));
      setMessage(result.error ? 'Le mot de passe actuel est incorrect ou la demande a échoué.' : 'Mot de passe modifié.');
      if (!result.error) router.replace('/account');
    } catch {
      setError(true);
      setMessage('Service indisponible. Réessayez plus tard.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout>
      <AuthHeading title="Modifier le mot de passe" subtitle="Confirmez votre mot de passe actuel, puis choisissez-en un nouveau." />
      <View style={styles.form}>
        <AuthField
          label="Mot de passe actuel"
          placeholder="Saisissez votre mot de passe"
          value={currentPassword}
          onChangeText={setCurrentPassword}
          secureTextEntry
          autoComplete="current-password"
          textContentType="password"
        />
        <AuthField
          label="Nouveau mot de passe"
          placeholder="8 caractères minimum"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="new-password"
          textContentType="newPassword"
        />
        <AuthField
          label="Confirmer le nouveau mot de passe"
          placeholder="Saisissez-le à nouveau"
          value={confirmation}
          onChangeText={setConfirmation}
          secureTextEntry
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="go"
          onSubmitEditing={() => void changePassword()}
        />
        <AuthMessage text={message} error={error} />
        <View style={styles.submit}>
          <AuthButton label="Enregistrer" onPress={() => void changePassword()} loading={busy} />
        </View>
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({ form: { marginTop: 36 }, submit: { marginTop: 28 } });
