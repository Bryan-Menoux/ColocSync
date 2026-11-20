import { useQuery } from '@tanstack/react-query';
import { Link } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { checkApi } from '../lib/api';

export default function ColocSyncStatus() {
  const { data, error, refetch, isPending } = useQuery({
    queryKey: ['api-health'],
    queryFn: checkApi,
    retry: 1,
  });
  return (
    <View className="flex-1 justify-center bg-slate-950 p-8">
      <Text className="text-3xl font-bold text-white">ColocSync</Text>
      <Text className="mt-4 text-slate-200">
        {isPending ? 'Connexion a l’API...' : error ? 'API inaccessible' : `API : ${data?.status} / BDD : ${data?.database}`}
      </Text>
      <Pressable onPress={() => void refetch()} className="mt-6 rounded-xl bg-indigo-500 p-4">
        <Text className="text-center font-semibold text-white">Tester a nouveau</Text>
      </Pressable>
      <Link href="/" className="mt-6 text-center text-indigo-200">Retour au template Expo</Link>
    </View>
  );
}
