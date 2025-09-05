"use strict";

/* eslint-disable no-bitwise */
export const base64Encode = str => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let result = '';
  let i = 0;
  while (i < str.length) {
    const char1 = str.charCodeAt(i++);
    const char2 = str.charCodeAt(i++);
    const char3 = str.charCodeAt(i++);
    const enc1 = char1 >> 2;
    const enc2 = (char1 & 3) << 4 | char2 >> 4;
    let enc3 = (char2 & 15) << 2 | char3 >> 6;
    let enc4 = char3 & 63;
    if (isNaN(char2)) {
      enc3 = enc4 = 64;
    } else if (isNaN(char3)) {
      enc4 = 64;
    }
    result = result + chars.charAt(enc1) + chars.charAt(enc2) + chars.charAt(enc3) + chars.charAt(enc4);
  }

  // Add padding if needed
  const padding = result.length % 4;
  if (padding) {
    result += '='.repeat(4 - padding);
  }
  return result;
};
//# sourceMappingURL=util.js.map