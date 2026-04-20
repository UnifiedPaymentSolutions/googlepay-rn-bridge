package com.everypay.gpayrnbridge

import android.content.Context
import android.util.AttributeSet
import android.util.Log
import android.view.View
import android.view.View.MeasureSpec
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
  var buttonType = ButtonConstants.ButtonType.BUY
  var theme = ButtonConstants.ButtonTheme.DARK
  var cornerRadius = 100
  private var button: View? = null
  private var appliedConfig: String? = null

  fun addButton() {
    if (!isGooglePlayServicesAvailable()) {
      Log.w("GooglePayButton", "Google Play Services not available or outdated")
      return
    }

    val currentConfig = "$allowedPaymentMethods|$buttonType|$theme|$cornerRadius"
    if (button != null && currentConfig == appliedConfig) {
      return
    }

    if (button != null) {
      removeView(button)
    }
    button = initializeGooglePayButton()
    addView(button)
    viewTreeObserver.addOnGlobalLayoutListener { requestLayout() }
    // PayButton fetches card data (last 4 digits) asynchronously from Google servers.
    // Schedule delayed layout refreshes to display it once it arrives.
    postDelayed({ requestLayout() }, 500)
    postDelayed({ requestLayout() }, 1500)
    postDelayed({ requestLayout() }, 2500)
    postDelayed({ requestLayout() }, 3500)
    postDelayed({ requestLayout() }, 4500)
    appliedConfig = currentConfig
  }

  override fun requestLayout() {
    super.requestLayout()
    post(mLayoutRunnable)
  }

  private val mLayoutRunnable = Runnable {
    if (width > 0 && height > 0) {
      measure(
        MeasureSpec.makeMeasureSpec(width, MeasureSpec.EXACTLY),
        MeasureSpec.makeMeasureSpec(height, MeasureSpec.EXACTLY)
      )
      layout(left, top, right, bottom)
    }
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
      .setButtonType(buttonType)
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
