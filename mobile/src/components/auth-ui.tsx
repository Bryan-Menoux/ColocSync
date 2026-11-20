import { useState, type ReactNode } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import AppleLogo from '../../assets/icons/brands/devicon-apple.svg';
import FacebookLogo from '../../assets/icons/brands/devicon-facebook.svg';
import GoogleLogo from '../../assets/icons/brands/devicon-google.svg';
import { Check, Eye, EyeClosed } from 'iconoir-react-native/regular';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { authClient } from '../lib/auth-client';
import { getAuthProviders, type SocialProvider } from '../lib/api';

export const authColors = {
  blue: '#68acd0',
  ink: '#080909',
  label: '#67675e',
  border: '#68685e',
  muted: '#f5f5f3',
};

export function AuthLayout({ children, compact = false }: { children: ReactNode; compact?: boolean }) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          contentContainerStyle={[styles.page, compact && styles.compactPage]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>{children}</View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export function AuthHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View>
      <Text style={styles.heading}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

type AuthFieldProps = TextInputProps & { label: string };

export function AuthField({ label, secureTextEntry, style, ...props }: AuthFieldProps) {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const isPassword = secureTextEntry === true;
  const PasswordIcon = passwordVisible ? Eye : EyeClosed;

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputContainer}>
        <TextInput
          accessibilityLabel={label}
          placeholderTextColor="#73736b"
          style={[styles.input, isPassword && styles.passwordInput, style]}
          autoCorrect={false}
          secureTextEntry={isPassword && !passwordVisible}
          {...props}
        />
        {isPassword && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={passwordVisible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
            accessibilityHint={passwordVisible ? 'Masque le mot de passe.' : 'Affiche le mot de passe en clair.'}
            hitSlop={8}
            onPress={() => setPasswordVisible(!passwordVisible)}
            style={({ pressed }) => [styles.passwordToggle, pressed && styles.pressed]}
          >
            <PasswordIcon width={24} height={24} color={authColors.label} strokeWidth={1.5} />
          </Pressable>
        )}
      </View>
    </View>
  );
}

export function AuthCheckbox({ checked, onPress, label }: { checked: boolean; onPress: () => void; label: string }) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      onPress={onPress}
      style={styles.checkboxRow}
    >
      <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
        {checked && <Check width={16} height={16} color="#fff" strokeWidth={2.25} />}
      </View>
      <Text style={styles.checkboxLabel}>{label}</Text>
    </Pressable>
  );
}

export function AuthButton({
  label,
  onPress,
  loading = false,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed, (disabled || loading) && styles.disabled]}
    >
      {loading ? <ActivityIndicator color="#e9f5f8" /> : <Text style={styles.primaryText}>{label}</Text>}
    </Pressable>
  );
}

export function AuthMessage({ text, error = false }: { text: string; error?: boolean }) {
  if (!text) return null;
  return <Text accessibilityLiveRegion="polite" style={[styles.message, error && styles.error]}>{text}</Text>;
}

export function AuthDivider() {
  return (
    <View style={styles.divider}>
      <View style={styles.rule} />
      <Text style={styles.dividerText}>Ou</Text>
      <View style={styles.rule} />
    </View>
  );
}

export function SocialButtons() {
  const router = useRouter();
  const providersQuery = useQuery({ queryKey: ['auth-providers'], queryFn: getAuthProviders, staleTime: 300_000 });
  const [message, setMessage] = useState('');

  async function signIn(provider: SocialProvider) {
    if (!providersQuery.data?.[provider]) {
      setMessage('Cette connexion sociale n’est pas encore configurée.');
      return;
    }
    setMessage('');
    try {
      const { error } = await authClient.signIn.social({ provider, callbackURL: '/account' });
      if (error) setMessage('La connexion sociale a échoué. Réessayez.');
      else router.replace('/account');
    } catch {
      setMessage('Service de connexion indisponible. Réessayez plus tard.');
    }
  }

  return (
    <View>
      <View style={styles.socialRow}>
        {(['google', 'apple', 'facebook'] as const).map((provider) => {
          const available = providersQuery.data?.[provider] === true;
          return (
            <Pressable
              key={provider}
              accessibilityRole="button"
              accessibilityLabel={`Continuer avec ${provider}`}
              accessibilityState={{ disabled: !available }}
              disabled={!available}
              onPress={() => void signIn(provider)}
              style={({ pressed }) => [styles.socialButton, pressed && styles.pressed, !available && styles.socialUnavailable]}
            >
              {provider === 'google' ? <GoogleLogo width={24} height={24} /> : null}
              {provider === 'apple' ? <AppleLogo width={26} height={26} /> : null}
              {provider === 'facebook' ? <FacebookLogo width={24} height={24} /> : null}
            </Pressable>
          );
        })}
      </View>
      <AuthMessage text={message} error />
    </View>
  );
}

export function AuthLink({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="link" onPress={onPress} hitSlop={8}>
      <Text style={styles.link}>{label}</Text>
    </Pressable>
  );
}

export function AuthFooter({
  prompt,
  linkLabel,
  onPress,
}: {
  prompt: string;
  linkLabel: string;
  onPress: () => void;
}) {
  return (
    <View style={styles.footer}>
      <Text style={styles.footerText}>{prompt} </Text>
      <AuthLink label={linkLabel} onPress={onPress} />
    </View>
  );
}

export function friendlyAuthError(error: unknown, fallback: string) {
  if (error && typeof error === 'object' && 'code' in error) {
    if (error.code === 'EMAIL_NOT_VERIFIED') return 'Vérifiez votre adresse e-mail avant de vous connecter.';
    if (error.code === 'TOO_MANY_REQUESTS') return 'Trop de tentatives. Réessayez dans quelques minutes.';
  }
  return fallback;
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: { flex: 1, backgroundColor: '#fff' },
  page: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 26, paddingVertical: 24 },
  content: { width: '100%', maxWidth: 460 },
  compactPage: { paddingTop: 4 },
  heading: { color: authColors.ink, fontSize: 34, fontWeight: '500', lineHeight: 31, letterSpacing: -0.7 },
  subtitle: { color: authColors.blue, fontSize: 16, lineHeight: 22, marginTop: 12 },
  field: { marginBottom: 17 },
  label: { color: authColors.label, fontSize: 16, fontWeight: '500', marginBottom: 8 },
  input: {
    height: 55,
    borderWidth: 1,
    borderColor: authColors.border,
    borderRadius: 15,
    paddingHorizontal: 12,
    color: authColors.ink,
    fontSize: 15,
    backgroundColor: '#fff',
  },
  inputContainer: { position: 'relative' },
  passwordInput: { paddingRight: 52 },
  passwordToggle: {
    position: 'absolute',
    right: 4,
    top: 0,
    width: 44,
    height: 55,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', minHeight: 24, gap: 12 },
  checkbox: { width: 17, height: 17, borderRadius: 5, borderWidth: 1, borderColor: authColors.blue, alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: authColors.blue },
  checkboxLabel: { color: authColors.blue, fontSize: 14 },
  primaryButton: {
    height: 56,
    borderRadius: 30,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: { color: '#e7f3f7', fontSize: 20, fontWeight: '500' },
  pressed: { opacity: 0.75 },
  disabled: { opacity: 0.55 },
  message: { color: authColors.label, fontSize: 14, lineHeight: 20, marginTop: 12 },
  error: { color: '#b42318' },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 28 },
  rule: { flex: 1, height: 1, backgroundColor: '#aaa99f' },
  dividerText: { color: authColors.label, fontSize: 12 },
  socialRow: { flexDirection: 'row', justifyContent: 'center', gap: 24, marginTop: 24 },
  socialButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: authColors.border,
    backgroundColor: authColors.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialUnavailable: { opacity: 0.45 },
  link: { color: authColors.blue, fontSize: 14 },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 24 },
  footerText: { color: authColors.ink, fontSize: 14 },
});
