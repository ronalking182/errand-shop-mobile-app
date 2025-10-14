import VerifiedScreen from '../src/screens/Auth/VerifiedScreen';
import { useRouter } from 'expo-router';

export default function VerifiedRoute() {
  const router = useRouter();
  
  const navigation = {
    replace: (route: string) => {
      if (route === 'Home') {
        router.replace('/(tabs)/home');
      }
    }
  };
  
  return <VerifiedScreen navigation={navigation} />;
}