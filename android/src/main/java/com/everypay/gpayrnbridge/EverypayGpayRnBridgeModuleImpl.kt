package com.everypay.gpayrnbridge

import android.app.Activity
import android.content.Intent
import android.util.Log
import com.facebook.react.bridge.BaseActivityEventListener
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.google.android.gms.wallet.AutoResolveHelper
import com.google.android.gms.wallet.IsReadyToPayRequest
import com.google.android.gms.wallet.PaymentData
import com.google.android.gms.wallet.PaymentDataRequest
import com.google.android.gms.wallet.PaymentsClient
import com.google.android.gms.wallet.Wallet
import com.everypay.gpayrnbridge.util.ConvertUtil
import com.everypay.gpayrnbridge.util.PaymentsUtil
import org.json.JSONException

class EverypayGpayRnBridgeModuleImpl(private val reactApplicationContext: ReactApplicationContext) {

  private var environment: Int = 0
  private var allowedCardNetworks: List<String> = emptyList()
  private var allowedCardAuthMethods: List<String> = emptyList()
  private lateinit var paymentsClient: PaymentsClient
  private lateinit var loadPaymentDataPromise: Promise

  fun init(
    environment: String,
    allowedCardNetworks: ReadableArray,
    allowedCardAuthMethods: ReadableArray,
    promise: Promise
  ) {
    try {
      paymentsClient = createPaymentsClient(PaymentsUtil.getEnvironment(environment))
      this.environment = PaymentsUtil.getEnvironment(environment)
      this.allowedCardNetworks = ConvertUtil.readableArrayToStringList(allowedCardNetworks)
      this.allowedCardAuthMethods = ConvertUtil.readableArrayToStringList(allowedCardAuthMethods)

      // Add the event listener which manages responses from the Google Pay API.
      reactApplicationContext.addActivityEventListener(object : BaseActivityEventListener() {
        override fun onActivityResult(
          activity: Activity,
          requestCode: Int,
          resultCode: Int,
          data: Intent?
        ) {
          Log.d(NAME, "Event request code: $requestCode");
          if (requestCode == LOAD_PAYMENT_DATA_REQUEST_CODE) {
            Log.d(NAME, "Event: LOAD_PAYMENT_DATA_REQUEST_CODE");
            when (resultCode) {
              Activity.RESULT_OK -> {
                // Payment successful
                data?.let { handlePaymentSuccess(it) }
              }

              Activity.RESULT_CANCELED -> {
                // Payment canceled
                handlePaymentCanceled()
              }

              AutoResolveHelper.RESULT_ERROR -> {
                // Payment error
                val status = AutoResolveHelper.getStatusFromIntent(data)
                if (status != null) {
                  handlePaymentError(status)
                }
              }
            }
          }
        }
      })
      Log.d(NAME, "Google Pay initialized successfully")
      promise.resolve(true)
    }catch (e: Exception){
      Log.e(NAME, "Google Pay initialization error", e)
      promise.reject(Constants.E_INIT_ERROR, "Failed to initialize Google Pay", e)
    }
  }

  private fun handlePaymentSuccess(data: Intent) {
    val paymentData = PaymentData.getFromIntent(data)
    Log.d(NAME, "Payment successful: ${paymentData?.toJson()}")
    loadPaymentDataPromise.resolve(paymentData?.toJson())
  }

  private fun handlePaymentCanceled() {
    Log.d(NAME, "Payment was canceled by user")
    loadPaymentDataPromise.reject(Constants.E_PAYMENT_CANCELED, "Payment was canceled by user")
  }

  private fun handlePaymentError(status: com.google.android.gms.common.api.Status) {
    val errorMessage = status.statusMessage ?: "Unknown error"
    val errorCode = status.statusCode.toString()
    Log.e(NAME, "Payment error: $errorMessage (code: $errorCode)")
    loadPaymentDataPromise.reject(
      Constants.E_PAYMENT_ERROR,
      "Google Pay payment error: $errorMessage (code: $errorCode)"
    )
  }

  /**
   * Initialize the PaymentsClient instance.
   */
  private fun createPaymentsClient(environment: Int): PaymentsClient {
    val walletOptions = Wallet.WalletOptions.Builder()
      .setEnvironment(environment)
      .build()

    return Wallet.getPaymentsClient(reactApplicationContext, walletOptions)
  }

  /**
   * Method exposed to the React Native app that checks if Google Pay is available.
   *
   * @param promise returned to the caller.
   */
  fun isReadyToPay(promise: Promise) {
    val isReadyToPayJson =
      PaymentsUtil.getIsReadyToPayRequest(allowedCardNetworks, allowedCardAuthMethods) ?: return
    val request = IsReadyToPayRequest.fromJson(isReadyToPayJson.toString()) ?: return

    // The call to isReadyToPay is asynchronous and returns a Task. We need to provide an
    // OnCompleteListener to be triggered when the result of the call is known.
    val task = paymentsClient.isReadyToPay(request)
    task.addOnCompleteListener { completedTask ->
      Log.d(NAME, "Task completed. Success: ${completedTask.isSuccessful}")

      if (completedTask.isSuccessful) {
        val result = completedTask.result
        Log.d(NAME, "Google Pay readiness result: $result")
        promise.resolve(result)
      } else {
        val exception = completedTask.exception
        Log.e(NAME, "isReadyToPay failed", exception)
        promise.reject(Constants.E_UNABLE_TO_DETERMINE_GOOGLE_PAY_READINESS, exception)
      }
    }
  }

  /**
   * Method exposed to the React Native app that makes a payment request to the Google Pay API.
   *
   * @param request containing the JSON for the Google Pay API request.
   * @param promise returned to the caller.
   */
  fun loadPaymentData(request: ReadableMap, promise: Promise, currentActivity: Activity?) {
    val json = try {
      ConvertUtil.mapToJson(request).toString()
    } catch (e: JSONException) {
      Log.e(NAME, "loadPaymentData JSONException", e)
      promise.reject(Constants.E_GOOGLE_PAY_API_ERROR, e.message)
      return
    }

    Log.d(NAME, "paymentData json: $json")

    loadPaymentDataPromise = promise
    // val activity = reactApplicationContext.currentActivity
    Log.d(NAME, "currentActivity: $currentActivity")
    currentActivity?.let { activity ->
      Log.d(NAME, "activity: $activity")
      AutoResolveHelper.resolveTask(
        paymentsClient.loadPaymentData(PaymentDataRequest.fromJson(json)),
        activity, LOAD_PAYMENT_DATA_REQUEST_CODE
      )
    }
  }

  companion object {
    const val NAME = "EverypayGpayRnBridge"
    const val LOAD_PAYMENT_DATA_REQUEST_CODE = 991
  }
}
