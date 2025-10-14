import AccountCreatedScreen from '../src/screens/Auth/AccountCreatedScreen';
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function AccountCreatedRoute() {
  const router = useRouter();
  const { email, name } = useLocalSearchParams();
  
  const navigation = {
    navigate: (route: string, params?: any) => {
      if (route === 'Verified') {
        router.push('/verified');
      } else if (route === 'Profile') {
        router.push('/(tabs)/profile');
      }
    },
    replace: (route: string) => {
      if (route === 'Home') {
        router.replace('/(tabs)/home');
      }
    }
  };
  
  const route = { 
    params: { 
      email: typeof email === 'string' ? email : 'user@example.com',
      name: typeof name === 'string' ? name : 'User'
    } 
  };
  
  return <AccountCreatedScreen navigation={navigation} route={route} />;
}