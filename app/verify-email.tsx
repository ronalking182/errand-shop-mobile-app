import VerifyEmailScreen from '../src/screens/Auth/VerifyEmailScreen';
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function VerifyEmailRoute() {
  const router = useRouter();
  const { email, firstName, lastName, phone, password } = useLocalSearchParams();
  
  const navigation = {
    navigate: (route: string, params?: any) => {
      if (route === 'AccountCreated') {
        router.push({
          pathname: '/account-created',
          params: { email: params?.email, name: params?.name }
        });
      } else if (route === 'Login') {
        router.push('/login');
      }
    },
    replace: (route: string, params?: any) => {
      if (route === 'AccountCreated') {
        router.replace({
          pathname: '/account-created',
          params: { email: params?.email, name: params?.name }
        });
      }
    },
    goBack: () => router.back()
  };
  
  const route = { 
    params: { 
      email: typeof email === 'string' ? email : '',
      firstName: typeof firstName === 'string' ? firstName : '',
      lastName: typeof lastName === 'string' ? lastName : '',
      phone: typeof phone === 'string' ? phone : '',
      password: typeof password === 'string' ? password : ''
    } 
  };
  
  return <VerifyEmailScreen navigation={navigation} route={route} />;
}