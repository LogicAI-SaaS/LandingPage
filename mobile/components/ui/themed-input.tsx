import React from 'react';
import { TextInput, StyleSheet, View, TextInputProps, Text } from 'react-native';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export interface ThemedInputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export function ThemedInput({ label, error, style, ...props }: ThemedInputProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];

  return (
    <View style={styles.container}>
      {label && <Text style={[styles.label, { color: palette.text }]}>{label}</Text>}
      <TextInput
        style={[
          styles.input,
          { backgroundColor: palette.bgCard, color: palette.text, borderColor: error ? palette.danger : palette.gray500 },
          style,
        ]}
        placeholderTextColor={palette.gray500}
        {...props}
      />
      {error && <Text style={[styles.error, { color: palette.danger }]}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  label: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 4,
  },
  input: {
    borderRadius: 8,
    borderWidth: 1.5,
    paddingVertical: 10,
    paddingHorizontal: 14,
    fontSize: 16,
  },
  error: {
    marginTop: 4,
    fontSize: 13,
  },
});
