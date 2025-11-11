package com.everypaygpayrnbridge

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.annotations.ReactProp
import com.everypay.gpayrnbridge.GooglePayButtonManagerImpl
import com.everypay.gpayrnbridge.GooglePayButtonView

class GooglePayButtonManager(var context: ReactApplicationContext) : SimpleViewManager<GooglePayButtonView>() {
  override fun getName() = GooglePayButtonManagerImpl.NAME

  override fun createViewInstance(context: ThemedReactContext): GooglePayButtonView =
    GooglePayButtonManagerImpl.createViewInstance(context)

  override fun onAfterUpdateTransaction(view: GooglePayButtonView) {
    super.onAfterUpdateTransaction(view)
    view.addButton()
  }

  @ReactProp(name = "allowedPaymentMethods")
  fun setAllowedPaymentMethods(view: GooglePayButtonView, allowedPaymentMethods: String?) {
    GooglePayButtonManagerImpl.setAllowedPaymentMethods(view, allowedPaymentMethods)
  }

  @ReactProp(name = "theme")
  fun setTheme(view: GooglePayButtonView, theme: String?) {
    GooglePayButtonManagerImpl.setTheme(view, theme)
  }

  @ReactProp(name = "buttonType")
  fun setButtonType(view: GooglePayButtonView, buttonType: String?) {
    GooglePayButtonManagerImpl.setButtonType(view, buttonType)
  }

  override fun getExportedCustomBubblingEventTypeConstants(): Map<String, Any> {
    return mapOf(
      "onPress" to mapOf(
        "phasedRegistrationNames" to mapOf(
          "bubbled" to "onPress"
        )
      )
    )
  }
}
