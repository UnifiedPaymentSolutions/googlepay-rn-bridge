package com.everypay.gpayrnbridge

import com.facebook.react.BaseReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider
import com.facebook.react.uimanager.ViewManager
import com.everypaygpayrnbridge.EverypayGpayRnBridgeModule
import com.everypaygpayrnbridge.GooglePayButtonManager
import java.util.HashMap

class EverypayGpayRnBridgePackage : BaseReactPackage() {
  override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? {
    return when (name) {
        EverypayGpayRnBridgeModuleImpl.NAME -> EverypayGpayRnBridgeModule(reactContext)
        GooglePayButtonManagerImpl.NAME -> GooglePayButtonManager(reactContext)
        else -> null
    }
  }

  override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> {
    return listOf(GooglePayButtonManager(reactContext))
  }

  override fun getReactModuleInfoProvider(): ReactModuleInfoProvider {
    return ReactModuleInfoProvider {
      val moduleInfos: MutableMap<String, ReactModuleInfo> = HashMap()
      moduleInfos[EverypayGpayRnBridgeModuleImpl.NAME] = ReactModuleInfo(
        EverypayGpayRnBridgeModuleImpl.NAME,
        EverypayGpayRnBridgeModuleImpl.NAME,
        false,  // canOverrideExistingModule
        false,  // needsEagerInit
        false,  // isCxxModule
        true // isTurboModule
      )
      moduleInfos[GooglePayButtonManagerImpl.NAME] = ReactModuleInfo(
        GooglePayButtonManagerImpl.NAME,
        GooglePayButtonManagerImpl.NAME,
        false,  // canOverrideExistingModule
        false,  // needsEagerInit
        false,  // isCxxModule
        true // isTurboModule
      )
      moduleInfos
    }
  }
}
