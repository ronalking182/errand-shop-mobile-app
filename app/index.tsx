import SplashScreen from '../src/screens/Splash/SplashScreen';
import { useRouter } from 'expo-router';

export default function Index() {
  const router = useRouter();
  const navigation = {
    replace: (route: string) => {
      if (route === 'Home') router.replace('/(tabs)/home');
      else if (route === 'Login') router.replace('/login');
      else if (route === 'Onboarding') router.replace('/onboarding');
    }
  };
  return <SplashScreen navigation={navigation} />;
}
