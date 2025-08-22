package java.com.everypaygpayrnbridge

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.everypay.gpayrnbridge.EverypayGpayRnBridgeModuleImpl

class EverypayGpayRnBridgeModule(reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {
  // Implementation of the module shared between old and new arch
  private var implementation: EverypayGpayRnBridgeModuleImpl =
    EverypayGpayRnBridgeModuleImpl(reactContext)

  override fun getName(): String {
    return EverypayGpayRnBridgeModuleImpl.NAME
  }

  @ReactMethod
  fun init(
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
  @ReactMethod
  fun isReadyToPay(promise: Promise) {
    implementation.isReadyToPay(promise)
  }

  /**
   * Method exposed to the React Native app that makes a payment request to the Google Pay API.
   *
   * @param request containing the JSON for the Google Pay API request.
   * @param promise returned to the caller.
   */
  @ReactMethod
  fun loadPaymentData(request: ReadableMap, promise: Promise) {
    implementation.loadPaymentData(request, promise, currentActivity)
  }
}
