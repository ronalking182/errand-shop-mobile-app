import OrderConfirmationScreen from '../src/screens/Checkout/OrderConfirmationScreen';
import { useNavigationAdapter } from '../src/hooks/useNavigationAdapter';
import { useLocalSearchParams } from 'expo-router';
import { useOrdersStore } from '../src/store/orders.store';

export default function OrderConfirmationRoute() {
  const navigation = useNavigationAdapter();
  const params = useLocalSearchParams();
  const { orderConfirmationData } = useOrdersStore();
  
  // Debug logging
  console.log('🔍 OrderConfirmationRoute - URL params:', params);
  console.log('🔍 OrderConfirmationRoute - Store data:', orderConfirmationData);
  console.log('🔍 OrderConfirmationRoute - Custom request details:', 
    JSON.stringify(orderConfirmationData?.customRequestDetails, null, 2)
  );
  
  // Use data from store if available, otherwise fallback to URL params
  const orderData = orderConfirmationData || {
    orderNumber: String(params.orderNumber || 'GR2185001'),
    total: Number(params.total) || 2840,
    items: [],
    deliveryAddress: undefined,
    deliveryMode: 'home' as const
  };
  
  console.log('🔍 OrderConfirmationRoute - Final order data:', orderData);
  
  const route = {
    params: {
      orderNumber: orderData.orderNumber,
      total: orderData.total,
      items: orderData.items,
      customRequestDetails: orderData.customRequestDetails || orderData.customRequests || [],
      deliveryAddress: orderData.deliveryAddress,
      deliveryMode: orderData.deliveryMode
    }
  };
  
  return <OrderConfirmationScreen 
    navigation={navigation} 
    route={route}
  />;
}