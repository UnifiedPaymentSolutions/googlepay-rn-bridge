package com.everypaygpayrnbridge

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.Promise
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

  override fun initializeWithBackendData(
    config: ReadableMap,
    backendData: ReadableMap,
    promise: Promise
  ) {
    implementation.initializeWithBackendData(config, backendData, promise)
  }

  override fun initializeSDKMode(config: ReadableMap, promise: Promise) {
    implementation.initializeSDKMode(config, promise)
  }

  override fun makePaymentWithBackendData(backendData: ReadableMap, promise: Promise) {
    implementation.makePaymentWithBackendData(backendData, promise)
  }

  override fun makePaymentSDKMode(paymentData: ReadableMap, promise: Promise) {
    implementation.makePaymentSDKMode(paymentData, promise)
  }

  override fun requestTokenWithBackendData(backendData: ReadableMap, promise: Promise) {
    implementation.requestTokenWithBackendData(backendData, promise)
  }

  override fun requestTokenSDKMode(label: String, promise: Promise) {
    implementation.requestTokenSDKMode(label, promise)
  }

  override fun isProcessingPayment(): Boolean {
    return implementation.isProcessingPayment()
  }
}
