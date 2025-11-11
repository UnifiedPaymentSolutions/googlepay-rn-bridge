package com.everypay.gpayrnbridge

import android.app.Activity
import android.content.Intent
import android.util.Log
import com.facebook.react.bridge.BaseActivityEventListener
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableMap

class EverypayGpayRnBridgeModuleImpl(private val reactApplicationContext: ReactApplicationContext) {

  // SDK bridge
  private val sdkBridge: EverypayGooglePayBridge = EverypayGooglePayBridge(reactApplicationContext)

  init {
    // Add activity event listener to route results to SDK bridge
    reactApplicationContext.addActivityEventListener(object : BaseActivityEventListener() {
      override fun onActivityResult(
        activity: Activity,
        requestCode: Int,
        resultCode: Int,
        data: Intent?
      ) {
        Log.d(NAME, "Event request code: $requestCode")

        // Route to SDK bridge
        if (sdkBridge.handleActivityResult(requestCode, resultCode, data)) {
          Log.d(NAME, "Activity result handled by SDK bridge")
        }
      }
    })
  }

  // ========== NEW SDK-POWERED METHODS ==========

  /**
   * Initialize with backend data (Backend mode - RECOMMENDED)
   * Backend makes all API calls, SDK only handles Google Pay UI
   */
  fun initializeWithBackendData(
    config: ReadableMap,
    backendData: ReadableMap,
    promise: Promise
  ) {
    Log.d(NAME, "Initializing with backend data (SDK)")
    sdkBridge.initializeWithBackendData(config, backendData, promise)
  }

  /**
   * Initialize in SDK mode
   * SDK makes all API calls including backend calls
   */
  fun initializeSDKMode(
    config: ReadableMap,
    promise: Promise
  ) {
    Log.d(NAME, "Initializing in SDK mode")
    sdkBridge.initializeSDKMode(config, promise)
  }

  /**
   * Make payment with backend data (Backend mode - RECOMMENDED)
   * Returns Google Pay token for backend to process
   */
  fun makePaymentWithBackendData(
    backendData: ReadableMap,
    promise: Promise
  ) {
    Log.d(NAME, "Making payment with backend data (SDK)")
    sdkBridge.makePaymentWithBackendData(backendData, promise)
  }

  /**
   * Make payment in SDK mode
   * SDK handles everything including backend communication
   */
  fun makePaymentSDKMode(
    paymentData: ReadableMap,
    promise: Promise
  ) {
    Log.d(NAME, "Making payment in SDK mode")
    sdkBridge.makePaymentSDKMode(paymentData, promise)
  }

  /**
   * Check if a payment is currently being processed
   */
  fun isProcessingPayment(): Boolean {
    return sdkBridge.isProcessingPayment()
  }

  /**
   * Clean up SDK resources
   * Should be called when module is destroyed
   */
  fun cleanup() {
    sdkBridge.cleanup()
  }

  companion object {
    const val NAME = "EverypayGpayRnBridge"
  }
}
