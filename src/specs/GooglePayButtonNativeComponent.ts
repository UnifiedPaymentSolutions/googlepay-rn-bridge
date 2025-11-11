import type { HostComponent, ViewProps } from 'react-native';
import type { BubblingEventHandler } from 'react-native/Libraries/Types/CodegenTypes';
import codegenNativeComponent from 'react-native/Libraries/Utilities/codegenNativeComponent';

/* type WebViewScriptLoadedEvent = {
  result: 'success' | 'error';
}; */

type OnPressEvent = {};

export interface NativeProps extends ViewProps {
  allowedPaymentMethods?: string;
  onPress?: BubblingEventHandler<OnPressEvent> | null;
  theme: string;
  buttonType?: string;
}

export default codegenNativeComponent<NativeProps>(
  'EveryPayGooglePayButton'
) as HostComponent<NativeProps>;
