import SplashOrOnboarding from '../src/screens/Onboarding/SplashOrOnboarding';
import { useRouter } from 'expo-router';

export default function OnboardingRoute() {
  const router = useRouter();
  
  const navigation = {
    navigate: (route: string) => {
      if (route === 'Login') router.push('/login');
    }
  };
  
  return <SplashOrOnboarding navigation={navigation} />;
}