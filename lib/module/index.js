'use strict';

import { Platform } from 'react-native';

// Only import native modules on Android
const nativeModule =
  Platform.OS === 'android'
    ? require('./specs/NativeEverypayGpayRnBridge').default
    : null;
// import EverypayGpayRnBridge from './specs/NativeEverypayGpayRnBridge';
import GooglePayButton from './GooglePayButton.js';
export const init = async (...args) => {
  if (Platform.OS === 'ios') {
    console.log('Google Pay is not supported on iOS');
    return false;
  }
  if (!nativeModule) return false;
  return nativeModule.init(...args);
};
export const isReadyToPay = async () => {
  if (Platform.OS === 'ios') {
    console.log('Google Pay is not supported on iOS');
    return false;
  }
  if (!nativeModule) return false;
  return nativeModule.isReadyToPay();
};
export const loadPaymentData = async (...args) => {
  if (Platform.OS === 'ios') {
    console.log('Google Pay is not supported on iOS');
    return '';
  }
  if (!nativeModule) return '';
  return nativeModule.loadPaymentData(...args);
};
export { GooglePayButton };
//# sourceMappingURL=index.js.map
