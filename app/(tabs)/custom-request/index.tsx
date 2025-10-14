import React from 'react';
import { useRouter } from 'expo-router';
import CustomRequestScreen from '../../../src/screens/CustomRequest/CustomRequestScreen';

export default function CustomRequestIndex() {
  const router = useRouter();
  return <CustomRequestScreen navigation={router} />;
}