module.exports = {
  dependencies: {
    '@everypay/googlepay-rn-bridge': {
      platforms: {
        android: {
          sourceDir: './android',
          packageImportPath:
            'import com.everypay.gpayrnbridge.EverypayGpayRnBridgePackage;',
          packageInstance: 'new EverypayGpayRnBridgePackage()',
        },
        ios: null,
      },
    },
  },
};
