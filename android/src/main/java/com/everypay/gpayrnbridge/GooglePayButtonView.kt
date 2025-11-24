package com.everypay.gpayrnbridge

import android.content.Context
import android.util.AttributeSet
import android.util.Log
import android.view.View
import android.widget.FrameLayout
import com.facebook.react.uimanager.PixelUtil
import com.google.android.gms.common.ConnectionResult
import com.google.android.gms.common.GoogleApiAvailability
import com.google.android.gms.wallet.button.ButtonConstants
import com.google.android.gms.wallet.button.ButtonOptions
import com.google.android.gms.wallet.button.PayButton

class GooglePayButtonView: FrameLayout {

  constructor(context: Context) : super(context) {
    // configureComponent()
  }

  constructor(context: Context, attrs: AttributeSet?) : super(context, attrs) {
    // configureComponent()
  }

  constructor(context: Context, attrs: AttributeSet?, defStyleAttr: Int) : super(context, attrs, defStyleAttr) {
    // configureComponent()
  }

  var allowedPaymentMethods: String? = null
  var type = ButtonConstants.ButtonType.BUY
  var theme = ButtonConstants.ButtonTheme.DARK
  var cornerRadius = 10
  private var button: View? = null

  fun addButton() {
    if (!isGooglePlayServicesAvailable()) {
      Log.w("GooglePayButton", "Google Play Services not available or outdated")
      return
    }

    if (button != null) {
      removeView(button)
    }
    button = initializeGooglePayButton()
    addView(button)
  }

  private fun isGooglePlayServicesAvailable(): Boolean {
    val googleApiAvailability = GoogleApiAvailability.getInstance()
    val status = googleApiAvailability.isGooglePlayServicesAvailable(context)
    return status == ConnectionResult.SUCCESS
}

  private fun buildDefaultAllowedPaymentMethodsConfiguration(): String {
    return """
    [
      {
        "type": "CARD",
        "parameters": {
          "allowedAuthMethods": ["PAN_ONLY", "CRYPTOGRAM_3DS"],
          "allowedCardNetworks": ["MASTERCARD", "VISA"]
        }
      }
    ]
    """.trimIndent()
  }

  private fun initializeGooglePayButton(): View {
    val googlePayButton = PayButton(context)
    val allowedPaymentMethodsJson = allowedPaymentMethods?: buildDefaultAllowedPaymentMethodsConfiguration()

    Log.d("GooglePayButton", "Using allowedPaymentMethods: $allowedPaymentMethodsJson")

    val options = ButtonOptions.newBuilder()
      .setAllowedPaymentMethods(allowedPaymentMethodsJson)
      .setButtonType(type)
      .setButtonTheme(theme)
      .setCornerRadius(PixelUtil.toPixelFromDIP(this.cornerRadius.toDouble()).toInt())
    googlePayButton.initialize(options.build())
    googlePayButton.setOnClickListener { _ ->
      // Call the Javascript TouchableOpacity parent where the onClick handler is set
      (this.parent as? View)?.performClick() ?: run {
        Log.e("EverypayGpayRnBridge", "Unable to find parent of GooglePayButtonView.")
      }
    };
    return googlePayButton
  }
}
