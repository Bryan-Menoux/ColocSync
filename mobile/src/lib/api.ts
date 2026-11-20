
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const hostUri = Constants.expoConfig?.hostUri;

const expoHost = hostUri
  ? new URL(
      hostUri.includes('://') ? hostUri : `http://${hostUri}`
    ).hostname
  : undefined;

export const API_URL =
  __DEV__ && Platform.OS !== 'web' && expoHost
    ? `http://${expoHost}:3001`
    : process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001';

export type SocialProvider = 'google' | 'apple' | 'facebook';
export type AuthProviders = Record<SocialProvider, boolean>;
export type AuthConfig = { emailDeliveryEnabled: boolean };

export async function getAuthConfig(): Promise<AuthConfig> {
  const response = await fetch(`${API_URL}/api/auth/config`);
  if (!response.ok) throw new Error('Impossible de vérifier la configuration de l’authentification');
  return response.json() as Promise<AuthConfig>;
}

export async function getAuthProviders(): Promise<AuthProviders> {
  const response = await fetch(`${API_URL}/api/auth/providers`);
  if (!response.ok) throw new Error('Impossible de vérifier les fournisseurs de connexion');
  return response.json() as Promise<AuthProviders>;
}

export async function checkApi() {
  const response = await fetch(`${API_URL}/api/health`);

  if (!response.ok) {
    throw new Error('API indisponible');
  }

  return response.json() as Promise<{
    status: string;
    database: string;
    app: string;
  }>;
}
