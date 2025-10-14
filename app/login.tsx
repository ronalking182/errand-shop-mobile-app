import LoginScreen from '../src/screens/Auth/LoginScreen';
import { useNavigationAdapter } from '../src/hooks/useNavigationAdapter';

export default function LoginRoute() {
  const navigation = useNavigationAdapter();
  return <LoginScreen navigation={navigation} />;
}