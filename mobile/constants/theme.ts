/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';


// Palette harmonisée avec le web/desktop
const brandBlue = '#0070FF';
const brandHover = '#0062E0';
const accentOrange = '#CF703C';
const bgDark = '#010101';
const bgCard = '#0D0D0D';
const bgModal = '#1A1A1A';
const gray500 = '#868686';
const gray950 = '#0D0D0D';
const success = '#00C853';
const danger = '#FF3B30';
const warning = '#FF9500';

export const Colors = {
  light: {
    text: 'oklch(35.1% .03 256.802)',
    background: '#fff',
    tint: brandBlue,
    icon: gray500,
    tabIconDefault: gray500,
    tabIconSelected: brandBlue,
    brandBlue,
    brandHover,
    accentOrange,
    bgDark,
    bgCard,
    bgModal,
    gray500,
    gray950,
    success,
    danger,
    warning,
  },
  dark: {
    text: 'oklch(87.2% .01 258.338)',
    background: bgDark,
    tint: brandBlue,
    icon: gray500,
    tabIconDefault: gray500,
    tabIconSelected: brandBlue,
    brandBlue,
    brandHover,
    accentOrange,
    bgDark,
    bgCard,
    bgModal,
    gray500,
    gray950,
    success,
    danger,
    warning,
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
