import SignupScreen from '../src/screens/Auth/SignupScreen';
import { useRouter } from 'expo-router';

export default function SignupRoute() {
  const router = useRouter();
  
  const navigation = {
    navigate: (route: string, params?: any) => {
      if (route === 'Login') router.push('/login');
      else if (route === 'VerifyEmail') router.push({
        pathname: '/verify-email',
        params: { email: params?.email }
      });
    },
    replace: (route: string) => {
      if (route === 'Home') router.replace('/(tabs)/home');
    }
  };
  
  return <SignupScreen navigation={navigation} />;
}