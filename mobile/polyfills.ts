// CRITICAL: These MUST be imported before anything else in _layout.tsx
// WalletConnect and crypto operations will fail silently without these
import "react-native-get-random-values";
import "react-native-url-polyfill/auto";
import "@walletconnect/react-native-compat";
