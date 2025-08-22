package java.com.everypaygpayrnbridge

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.module.annotations.ReactModule
import com.everypay.gpayrnbridge.EverypayGpayRnBridgeModuleImpl
import com.everypay.gpayrnbridge.NativeEverypayGpayRnBridgeSpec

// See https://reactnative.dev/docs/native-modules-android
@ReactModule(name = EverypayGpayRnBridgeModuleImpl.NAME)
class EverypayGpayRnBridgeModule(reactContext: ReactApplicationContext) :
  NativeEverypayGpayRnBridgeSpec(reactContext) {
  // Implementation of the module shared between old and new arch
  private var implementation: EverypayGpayRnBridgeModuleImpl = EverypayGpayRnBridgeModuleImpl(reactContext)

  override fun getName(): String {
    return EverypayGpayRnBridgeModuleImpl.NAME
  }

  override fun init(
    environment: String,
    allowedCardNetworks: ReadableArray,
    allowedCardAuthMethods: ReadableArray,
    promise: Promise
  ) {
    implementation.init(environment, allowedCardNetworks, allowedCardAuthMethods, promise)
  }

  /**
   * Method exposed to the React Native app that checks if Google Pay is available.
   *
   * @param promise returned to the caller.
   */
  override fun isReadyToPay(promise: Promise) {
    implementation.isReadyToPay(promise)
  }

  /**
   * Method exposed to the React Native app that makes a payment request to the Google Pay API.
   *
   * @param request containing the JSON for the Google Pay API request.
   * @param promise returned to the caller.
   */
  override fun loadPaymentData(request: ReadableMap, promise: Promise) {
    implementation.loadPaymentData(request, promise, currentActivity)
  }
}
