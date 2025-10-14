import CheckoutScreen from '../src/screens/Checkout/CheckoutScreen';
import { useNavigationAdapter } from '../src/hooks/useNavigationAdapter';

export default function CheckoutRoute() {
  const navigation = useNavigationAdapter();
  
  return <CheckoutScreen navigation={navigation} />;
}