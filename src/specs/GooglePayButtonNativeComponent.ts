import type { HostComponent, ViewProps } from 'react-native';
import type {
  BubblingEventHandler,
  Int32,
} from 'react-native/Libraries/Types/CodegenTypes';
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
  cornerRadius?: Int32;
}

export default codegenNativeComponent<NativeProps>(
  'EveryPayGooglePayButton'
) as HostComponent<NativeProps>;
