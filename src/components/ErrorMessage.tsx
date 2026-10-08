import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from './theme';

type Props = {
  message: string;
  onRetry: () => void;
};

/** Hata mesajı ve "Tekrar dene" aksiyonu; liste, sonraki sayfa ve detay hatalarında ortak. */
export function ErrorMessage({ message, onRetry }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.message}>{message}</Text>
      <Pressable onPress={onRetry} accessibilityRole="button" style={styles.button}>
        <Text style={styles.buttonText}>Tekrar dene</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 12,
  },
  message: {
    fontSize: 15,
    color: colors.danger,
    textAlign: 'center',
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: colors.primary,
  },
  buttonText: {
    color: colors.surface,
    fontWeight: '600',
  },
});
