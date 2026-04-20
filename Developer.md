## Development Setup

### Prerequisites

- Node.js 20+ (check .nvmrc file)
- Yarn 3.6.1+
- Android Studio (for Android development)
- React Native development environment

### Installation

```sh
yarn install
```

## Using the library locally

1. **Development Dependencies**: The library includes development-only dependencies in `android/build.gradle` that allow it to compile standalone:

   ```kotlin
   // Dev only
   // Get React Native version from the app package.json
   def reactNativeVersion = "0.79.2"
   ```

   **Important:** When updating React Native, make sure to update the `reactNativeVersion` variable in `android/build.gradle` to match the version in `package.json`:

   ```json
   // package.json of the app
   "dependencies": {
     "react-native": "0.79.2"  // ← Copy this version
   }
   ```

2. Build the library (everytime something changes)

```sh
yarn build
```

3. In the app package.json set the library path:

```js
// Update the path if necessary
"dependencies": {
    ...
    "@everypay/googlepay-rn-bridge": "file:../../googlepay-rn-bridge",
    ...
  },
```

4. Run the demo app

```sh
yarn start --reset-cache
```

## Formatting

```sh
yarn format
```

## Building with Android artifacts

This is usually not needed as Android build step calls this Gradle script itself too

```sh
yarn prepare && cd android && ./gradlew generateCodegenArtifactsFromSchema && cd ..
```

This script generates React Native codegen artifacts for the EveryPay Google Pay bridge library:

1. **`yarn build`** - Builds the TypeScript source code and generates JavaScript module files
2. **`./gradlew generateCodegenArtifactsFromSchema`** - Generates Android codegen artifacts from TurboModule specifications

These artifacts create the native-to-JS bridge required for Google Pay functionality on Android.
