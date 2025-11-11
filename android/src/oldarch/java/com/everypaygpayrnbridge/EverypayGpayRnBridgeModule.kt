package com.everypaygpayrnbridge

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
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

  // ========== SDK-POWERED METHODS ==========

  @ReactMethod
  fun initializeWithBackendData(
    config: ReadableMap,
    backendData: ReadableMap,
    promise: Promise
  ) {
    implementation.initializeWithBackendData(config, backendData, promise)
  }

  @ReactMethod
  fun initializeSDKMode(config: ReadableMap, promise: Promise) {
    implementation.initializeSDKMode(config, promise)
  }

  @ReactMethod
  fun makePaymentWithBackendData(backendData: ReadableMap, promise: Promise) {
    implementation.makePaymentWithBackendData(backendData, promise)
  }

  @ReactMethod
  fun makePaymentSDKMode(paymentData: ReadableMap, promise: Promise) {
    implementation.makePaymentSDKMode(paymentData, promise)
  }

  @ReactMethod(isBlockingSynchronousMethod = true)
  fun isProcessingPayment(): Boolean {
    return implementation.isProcessingPayment()
  }
}
