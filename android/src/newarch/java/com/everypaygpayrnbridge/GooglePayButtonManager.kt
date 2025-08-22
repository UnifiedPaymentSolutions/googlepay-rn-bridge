package java.com.everypaygpayrnbridge

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewManagerDelegate
import com.facebook.react.uimanager.annotations.ReactProp
import com.facebook.react.viewmanagers.EveryPayGooglePayButtonManagerDelegate
import com.facebook.react.viewmanagers.EveryPayGooglePayButtonManagerInterface
import com.everypay.gpayrnbridge.GooglePayButtonManagerImpl
import com.everypay.gpayrnbridge.GooglePayButtonView

@ReactModule(name = GooglePayButtonManagerImpl.NAME)
class GooglePayButtonManager(context: ReactApplicationContext) : SimpleViewManager<GooglePayButtonView>(), EveryPayGooglePayButtonManagerInterface<GooglePayButtonView> {

  private val delegate: EveryPayGooglePayButtonManagerDelegate<GooglePayButtonView, GooglePayButtonManager> =
    EveryPayGooglePayButtonManagerDelegate(this)

  override fun getDelegate(): ViewManagerDelegate<GooglePayButtonView> = delegate

  override fun getName() = GooglePayButtonManagerImpl.NAME

  override fun createViewInstance(context: ThemedReactContext): GooglePayButtonView =
    GooglePayButtonManagerImpl.createViewInstance(context)

  override fun onAfterUpdateTransaction(view: GooglePayButtonView) {
    super.onAfterUpdateTransaction(view)
    view.addButton()
  }

  @ReactProp(name = "allowedPaymentMethods")
  override fun setAllowedPaymentMethods(view: GooglePayButtonView, allowedPaymentMethods: String?) {
    GooglePayButtonManagerImpl.setAllowedPaymentMethods(view, allowedPaymentMethods)
  }


  @ReactProp(name = "theme")
  override fun setTheme(view: GooglePayButtonView, theme: String?) {
    GooglePayButtonManagerImpl.setTheme(view, theme)
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
