package com.everypay.gpayrnbridge

import android.app.Activity
import android.content.Intent
import com.everypay.gpay.EverypayGooglePayHelper
import com.everypay.gpay.GooglePayReadinessResult
import com.everypay.gpay.GooglePayResult
import com.everypay.gpay.models.EverypayConfig
import com.everypay.gpay.models.GooglePayBackendData
import com.everypay.gpay.models.IntermediateSigningKey
import com.everypay.gpayrnbridge.util.ConvertUtil
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableMap
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel

/**
 * Bridge between React Native and EveryPay Google Pay SDK
 * Wraps EverypayGooglePayHelper and adapts it for React Native promises
 */
class EverypayGooglePayBridge(
    private val reactContext: ReactApplicationContext
) {
    private var helper: EverypayGooglePayHelper? = null
    private var config: EverypayConfig? = null
    private var gatewayId: String? = null
    private var gatewayMerchantId: String? = null
    private val coroutineScope = CoroutineScope(Dispatchers.Main + SupervisorJob())
    private val requestCode = 991

    companion object {
        private const val TAG = "EverypayGooglePayBridge"
    }

    /**
     * Initialize with backend data (Backend mode - RECOMMENDED)
     * Backend makes all API calls, SDK only handles Google Pay UI
     */
    fun initializeWithBackendData(
        configMap: ReadableMap,
        backendDataMap: ReadableMap,
        promise: Promise
    ) {
        val activity = reactContext.currentActivity
        if (activity == null) {
            promise.reject(Constants.E_ACTIVITY_DOES_NOT_EXIST, "Activity not available")
            return
        }

        try {
            // Parse config (backend mode)
            config = parseConfig(configMap)

            // Parse backend data
            val backendData = parseBackendData(backendDataMap)

            // Create helper
            helper = EverypayGooglePayHelper(
                activity = activity,
                config = config!!,
                requestCode = requestCode,
                coroutineScope = coroutineScope
            )

            // Initialize with backend data
            helper!!.initializeWithBackendData(backendData) { result ->
                when (result) {
                    is GooglePayReadinessResult.Success -> {
                        // Store gateway info
                        gatewayId = backendData.gatewayId
                        gatewayMerchantId = backendData.gatewayMerchantId

                        // Return object with readiness status and gateway info
                        val resultMap = Arguments.createMap().apply {
                            putBoolean("isReady", result.isReady)
                            putString("gatewayId", backendData.gatewayId)
                            putString("gatewayMerchantId", backendData.gatewayMerchantId)
                        }
                        promise.resolve(resultMap)
                    }
                    is GooglePayReadinessResult.Error -> {
                        promise.reject(result.code, result.message, result.exception)
                    }
                }
            }
        } catch (e: Exception) {
            promise.reject(Constants.E_INIT_ERROR, e.message ?: "Initialization failed", e)
        }
    }

    /**
     * Initialize in SDK mode
     * SDK makes all API calls including backend calls
     */
    fun initializeSDKMode(
        configMap: ReadableMap,
        promise: Promise
    ) {
        val activity = reactContext.currentActivity
        if (activity == null) {
            promise.reject(Constants.E_ACTIVITY_DOES_NOT_EXIST, "Activity not available")
            return
        }

        try {
            // Parse config (SDK mode with credentials)
            config = parseConfig(configMap)

            // Validate SDK mode
            if (config!!.isBackendMode()) {
                promise.reject(
                    Constants.E_INIT_ERROR,
                    "Config must include API credentials for SDK mode"
                )
                return
            }

            // Create helper
            helper = EverypayGooglePayHelper(
                activity = activity,
                config = config!!,
                requestCode = requestCode,
                coroutineScope = coroutineScope
            )

            // Initialize SDK mode
            helper!!.initialize { result ->
                when (result) {
                    is GooglePayReadinessResult.Success -> {
                        // Get gateway info from helper after initialization
                        val gateway = helper!!.gatewayId
                        val gatewayMerchant = helper!!.gatewayMerchantId

                        // Store gateway info
                        gatewayId = gateway
                        gatewayMerchantId = gatewayMerchant

                        // Return object with readiness status and gateway info
                        val resultMap = Arguments.createMap().apply {
                            putBoolean("isReady", result.isReady)
                            putString("gatewayId", gateway)
                            putString("gatewayMerchantId", gatewayMerchant)
                        }
                        promise.resolve(resultMap)
                    }
                    is GooglePayReadinessResult.Error -> {
                        promise.reject(result.code, result.message, result.exception)
                    }
                }
            }
        } catch (e: Exception) {
            promise.reject(Constants.E_INIT_ERROR, e.message ?: "Initialization failed", e)
        }
    }

    /**
     * Make payment with backend data (Backend mode - RECOMMENDED)
     * Returns Google Pay token for backend to process
     */
    fun makePaymentWithBackendData(
        backendDataMap: ReadableMap,
        promise: Promise
    ) {
        if (helper == null) {
            promise.reject(Constants.E_INIT_ERROR, "Not initialized. Call initializeWithBackendData first")
            return
        }

        if (helper!!.isProcessingPayment()) {
            promise.reject(Constants.E_PAYMENT_ERROR, "Payment already in progress")
            return
        }

        try {
            val backendData = parseBackendData(backendDataMap)

            helper!!.makePaymentWithBackendData(backendData) { result ->
                when (result) {
                    is GooglePayResult.TokenReceived -> {
                        // Convert token data to WritableMap
                        val tokenMap = Arguments.createMap().apply {
                            putString("paymentReference", result.tokenData.paymentReference)
                            putString("mobileAccessToken", result.tokenData.mobileAccessToken)
                            putString("signature", result.tokenData.signature)
                            putMap("intermediateSigningKey", Arguments.createMap().apply {
                                putString("signedKey", result.tokenData.intermediateSigningKey.signedKey)
                                val signaturesArray = Arguments.createArray()
                                result.tokenData.intermediateSigningKey.signatures.forEach {
                                    signaturesArray.pushString(it)
                                }
                                putArray("signatures", signaturesArray)
                            })
                            putString("protocolVersion", result.tokenData.protocolVersion)
                            putString("signedMessage", result.tokenData.signedMessage)
                            putBoolean("tokenConsentAgreed", result.tokenData.tokenConsentAgreed)
                        }
                        promise.resolve(tokenMap)
                    }
                    is GooglePayResult.Success -> {
                        // Shouldn't happen in backend mode, but handle gracefully
                        promise.resolve(Arguments.createMap().apply {
                            putString("status", "success")
                        })
                    }
                    is GooglePayResult.Canceled -> {
                        promise.reject(Constants.E_PAYMENT_CANCELED, "Payment canceled by user")
                    }
                    is GooglePayResult.Error -> {
                        promise.reject(result.code, result.message, result.exception)
                    }
                }
            }
        } catch (e: Exception) {
            promise.reject(Constants.E_PAYMENT_ERROR, e.message ?: "Payment failed", e)
        }
    }

    /**
     * Make payment in SDK mode
     * SDK handles everything including backend communication
     */
    fun makePaymentSDKMode(
        paymentDataMap: ReadableMap,
        promise: Promise
    ) {
        if (helper == null) {
            promise.reject(Constants.E_INIT_ERROR, "Not initialized. Call initializeSDKMode first")
            return
        }

        if (helper!!.isProcessingPayment()) {
            promise.reject(Constants.E_PAYMENT_ERROR, "Payment already in progress")
            return
        }

        try {
            val amount = paymentDataMap.getString("amount")
                ?: throw IllegalArgumentException("amount is required")
            val label = paymentDataMap.getString("label")
                ?: throw IllegalArgumentException("label is required")
            val orderReference = paymentDataMap.getString("orderReference")
                ?: throw IllegalArgumentException("orderReference is required")
            val customerEmail = paymentDataMap.getString("customerEmail")
                ?: throw IllegalArgumentException("customerEmail is required")
            val customerIp = if (paymentDataMap.hasKey("customerIp")) {
                paymentDataMap.getString("customerIp")
            } else null

            helper!!.makePayment(
                amount = amount,
                label = label,
                orderReference = orderReference,
                customerEmail = customerEmail,
                customerIp = customerIp
            ) { result ->
                when (result) {
                    is GooglePayResult.Success -> {
                        promise.resolve(Arguments.createMap().apply {
                            putString("status", "success")
                            putString("paymentData", result.paymentData.toJson())
                        })
                    }
                    is GooglePayResult.TokenReceived -> {
                        // Shouldn't happen in SDK mode, but handle gracefully
                        promise.resolve(Arguments.createMap().apply {
                            putString("status", "token_received")
                        })
                    }
                    is GooglePayResult.Canceled -> {
                        promise.reject(Constants.E_PAYMENT_CANCELED, "Payment canceled by user")
                    }
                    is GooglePayResult.Error -> {
                        promise.reject(result.code, result.message, result.exception)
                    }
                }
            }
        } catch (e: Exception) {
            promise.reject(Constants.E_PAYMENT_ERROR, e.message ?: "Payment failed", e)
        }
    }

    /**
     * Request token with backend data (Backend mode - RECOMMENDED)
     * Returns Google Pay token for backend to process and retrieve MIT token
     */
    fun requestTokenWithBackendData(
        backendDataMap: ReadableMap,
        promise: Promise
    ) {
        if (helper == null) {
            promise.reject(Constants.E_INIT_ERROR, "Not initialized. Call initializeWithBackendData first")
            return
        }

        if (helper!!.isProcessingPayment()) {
            promise.reject(Constants.E_PAYMENT_ERROR, "Operation already in progress")
            return
        }

        try {
            val backendData = parseBackendData(backendDataMap)

            helper!!.requestTokenWithBackendData(backendData) { result ->
                when (result) {
                    is GooglePayResult.TokenReceived -> {
                        // Convert token data to WritableMap
                        val tokenMap = Arguments.createMap().apply {
                            putString("paymentReference", result.tokenData.paymentReference)
                            putString("mobileAccessToken", result.tokenData.mobileAccessToken)
                            putString("signature", result.tokenData.signature)
                            putMap("intermediateSigningKey", Arguments.createMap().apply {
                                putString("signedKey", result.tokenData.intermediateSigningKey.signedKey)
                                val signaturesArray = Arguments.createArray()
                                result.tokenData.intermediateSigningKey.signatures.forEach {
                                    signaturesArray.pushString(it)
                                }
                                putArray("signatures", signaturesArray)
                            })
                            putString("protocolVersion", result.tokenData.protocolVersion)
                            putString("signedMessage", result.tokenData.signedMessage)
                            putBoolean("tokenConsentAgreed", result.tokenData.tokenConsentAgreed)
                        }
                        promise.resolve(tokenMap)
                    }
                    is GooglePayResult.Canceled -> {
                        promise.reject(Constants.E_PAYMENT_CANCELED, "Token request canceled by user")
                    }
                    is GooglePayResult.Error -> {
                        promise.reject(result.code, result.message, result.exception)
                    }
                    else -> {
                        promise.reject(Constants.E_PAYMENT_ERROR, "Unexpected result type")
                    }
                }
            }
        } catch (e: Exception) {
            promise.reject(Constants.E_PAYMENT_ERROR, e.message ?: "Token request failed", e)
        }
    }

    /**
     * Request token in SDK mode
     * SDK handles everything including MIT token retrieval
     * Returns token data including MIT token in paymentDetails.ccDetails.token
     */
    fun requestTokenSDKMode(
        label: String,
        promise: Promise
    ) {
        if (helper == null) {
            promise.reject(Constants.E_INIT_ERROR, "Not initialized. Call initializeSDKMode first")
            return
        }

        if (helper!!.isProcessingPayment()) {
            promise.reject(Constants.E_PAYMENT_ERROR, "Operation already in progress")
            return
        }

        try {
            helper!!.requestToken(label) { result ->
                when (result) {
                    is GooglePayResult.TokenReceived -> {
                        val tokenMap = Arguments.createMap().apply {
                            putString("paymentReference", result.tokenData.paymentReference)
                            putString("mobileAccessToken", result.tokenData.mobileAccessToken)
                            putString("signature", result.tokenData.signature)
                            putMap("intermediateSigningKey", Arguments.createMap().apply {
                                putString("signedKey", result.tokenData.intermediateSigningKey.signedKey)
                                val signaturesArray = Arguments.createArray()
                                result.tokenData.intermediateSigningKey.signatures.forEach {
                                    signaturesArray.pushString(it)
                                }
                                putArray("signatures", signaturesArray)
                            })
                            putString("protocolVersion", result.tokenData.protocolVersion)
                            putString("signedMessage", result.tokenData.signedMessage)
                            putBoolean("tokenConsentAgreed", result.tokenData.tokenConsentAgreed)

                            // SDK mode specific: Include payment details with MIT token
                            result.paymentDetails?.let { details ->
                                putMap("paymentDetails", Arguments.createMap().apply {
                                    putString("paymentReference", details.paymentReference)
                                    putString("paymentState", details.paymentState)
                                    details.ccDetails?.let { ccDetails ->
                                        putMap("ccDetails", Arguments.createMap().apply {
                                            ccDetails.token?.let { putString("token", it) }
                                            ccDetails.lastFourDigits?.let { putString("lastFourDigits", it) }
                                            ccDetails.month?.let { putString("month", it) }
                                            ccDetails.year?.let { putString("year", it) }
                                        })
                                    }
                                })
                            }
                        }
                        promise.resolve(tokenMap)
                    }
                    is GooglePayResult.Canceled -> {
                        promise.reject(Constants.E_PAYMENT_CANCELED, "Token request canceled by user")
                    }
                    is GooglePayResult.Error -> {
                        promise.reject(result.code, result.message, result.exception)
                    }
                    else -> {
                        promise.reject(Constants.E_PAYMENT_ERROR, "Unexpected result type")
                    }
                }
            }
        } catch (e: Exception) {
            promise.reject(Constants.E_PAYMENT_ERROR, e.message ?: "Token request failed", e)
        }
    }

    /**
     * Check if a payment is currently being processed
     */
    fun isProcessingPayment(): Boolean {
        return helper?.isProcessingPayment() ?: false
    }

    /**
     * Handle activity result from Google Pay
     * Must be called from the React Native module's onActivityResult
     */
    fun handleActivityResult(requestCode: Int, resultCode: Int, data: Intent?): Boolean {
        return helper?.handleActivityResult(requestCode, resultCode, data) ?: false
    }

    /**
     * Clean up resources
     */
    fun cleanup() {
        coroutineScope.cancel()
        helper = null
        config = null
    }

    // ========== Private helper methods ==========

    /**
     * Parse EverypayConfig from ReadableMap
     */
    private fun parseConfig(map: ReadableMap): EverypayConfig {
        val environment = map.getString("environment")
            ?: throw IllegalArgumentException("environment is required")
        val countryCode = map.getString("countryCode")
            ?: throw IllegalArgumentException("countryCode is required")

        // Optional fields for SDK mode
        val apiUsername = if (map.hasKey("apiUsername")) map.getString("apiUsername") else null
        val apiSecret = if (map.hasKey("apiSecret")) map.getString("apiSecret") else null
        val apiUrl = if (map.hasKey("apiUrl")) map.getString("apiUrl") else null
        val accountName = if (map.hasKey("accountName")) map.getString("accountName") else null
        val customerUrl = if (map.hasKey("customerUrl")) map.getString("customerUrl") else null

        // Optional fields with defaults
        val currencyCode = if (map.hasKey("currencyCode")) {
            map.getString("currencyCode") ?: "EUR"
        } else "EUR"

        val allowedCardNetworks = if (map.hasKey("allowedCardNetworks")) {
            ConvertUtil.readableArrayToStringList(map.getArray("allowedCardNetworks"))
        } else listOf("MASTERCARD", "VISA")

        val allowedCardAuthMethods = if (map.hasKey("allowedCardAuthMethods")) {
            ConvertUtil.readableArrayToStringList(map.getArray("allowedCardAuthMethods"))
        } else listOf("PAN_ONLY", "CRYPTOGRAM_3DS")

        return EverypayConfig(
            apiUsername = apiUsername,
            apiSecret = apiSecret,
            apiUrl = apiUrl,
            environment = environment,
            accountName = accountName,
            countryCode = countryCode,
            customerUrl = customerUrl,
            currencyCode = currencyCode,
            allowedCardNetworks = allowedCardNetworks,
            allowedCardAuthMethods = allowedCardAuthMethods
        )
    }

    /**
     * Parse GooglePayBackendData from ReadableMap
     */
    private fun parseBackendData(map: ReadableMap): GooglePayBackendData {
        return GooglePayBackendData(
            merchantId = map.getString("merchantId")
                ?: throw IllegalArgumentException("merchantId is required"),
            merchantName = map.getString("merchantName")
                ?: throw IllegalArgumentException("merchantName is required"),
            gatewayId = map.getString("gatewayId")
                ?: throw IllegalArgumentException("gatewayId is required"),
            gatewayMerchantId = map.getString("gatewayMerchantId")
                ?: throw IllegalArgumentException("gatewayMerchantId is required"),
            currency = map.getString("currency")
                ?: throw IllegalArgumentException("currency is required"),
            countryCode = map.getString("countryCode")
                ?: throw IllegalArgumentException("countryCode is required"),
            paymentReference = map.getString("paymentReference")
                ?: throw IllegalArgumentException("paymentReference is required"),
            mobileAccessToken = map.getString("mobileAccessToken")
                ?: throw IllegalArgumentException("mobileAccessToken is required"),
            amount = map.getDouble("amount"),
            label = map.getString("label")
                ?: throw IllegalArgumentException("label is required")
        )
    }
}
