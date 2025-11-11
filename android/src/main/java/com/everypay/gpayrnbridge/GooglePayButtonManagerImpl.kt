package com.everypay.gpayrnbridge

import com.facebook.react.uimanager.ThemedReactContext
import com.google.android.gms.wallet.button.ButtonConstants

object GooglePayButtonManagerImpl {
  const val NAME = "EveryPayGooglePayButton"
  fun createViewInstance(context: ThemedReactContext) = GooglePayButtonView(context)

  fun setAllowedPaymentMethods(view: GooglePayButtonView, allowedPaymentMethods: String?) {
    if (allowedPaymentMethods != null) {
      view.allowedPaymentMethods = allowedPaymentMethods
    }
  }

  fun setTheme(view: GooglePayButtonView, theme: String?) {
    if(theme == "dark") {
      view.theme = ButtonConstants.ButtonTheme.DARK;
    } else {
      view.theme = ButtonConstants.ButtonTheme.LIGHT;
    }
  }

  fun setButtonType(view: GooglePayButtonView, buttonType: String?) {
    view.buttonType = when(buttonType?.lowercase()) {
      "book" -> ButtonConstants.ButtonType.BOOK
      "checkout" -> ButtonConstants.ButtonType.CHECKOUT
      "donate" -> ButtonConstants.ButtonType.DONATE
      "order" -> ButtonConstants.ButtonType.ORDER
      "pay" -> ButtonConstants.ButtonType.PAY
      "subscribe" -> ButtonConstants.ButtonType.SUBSCRIBE
      "buy" -> ButtonConstants.ButtonType.BUY
      else -> ButtonConstants.ButtonType.BUY // default
    }
  }
}
