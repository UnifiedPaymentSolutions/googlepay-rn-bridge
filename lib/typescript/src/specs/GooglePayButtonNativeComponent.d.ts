import type { HostComponent, ViewProps } from 'react-native';
import type { BubblingEventHandler } from 'react-native/Libraries/Types/CodegenTypes';
type OnPressEvent = {};
export interface NativeProps extends ViewProps {
    allowedPaymentMethods?: string;
    onPress?: BubblingEventHandler<OnPressEvent> | null;
    theme: string;
}
declare const _default: HostComponent<NativeProps>;
export default _default;
//# sourceMappingURL=GooglePayButtonNativeComponent.d.ts.map