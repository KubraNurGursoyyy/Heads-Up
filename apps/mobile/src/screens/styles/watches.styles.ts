import { StyleSheet } from 'react-native';
import { isDemoMode } from '../../data/runtime';
import { colors, fontFamily } from '../../ui';

export const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 18, paddingTop: 18 },
  globalError: {
    marginHorizontal: 18,
    marginBottom: 10,
    padding: 11,
    borderRadius: 10,
    backgroundColor: isDemoMode ? '#FFF1EC' : colors.surfaceMuted,
    borderWidth: 1,
    borderColor: isDemoMode ? '#D9A39A' : '#D98BAA',
  },
  globalErrorText: { fontFamily, color: colors.danger, fontSize: 11, lineHeight: 16 },
  list: { paddingHorizontal: 18, paddingBottom: 32 },
  listHeader: { paddingBottom: 9 },
  empty: {
    minHeight: 250,
    alignItems: 'flex-start',
    justifyContent: 'center',
    padding: 26,
    borderRadius: isDemoMode ? 10 : 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: isDemoMode ? colors.border : colors.borderStrong,
  },
  emptyLine: { width: 44, height: 2, backgroundColor: colors.gold, marginBottom: 14 },
  emptyKicker: {
    fontFamily,
    color: isDemoMode ? colors.goldDark : colors.magenta,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.4,
  },
  emptyTitle: {
    fontFamily,
    color: colors.ink,
    fontWeight: '800',
    fontSize: 20,
    marginTop: 7,
  },
  emptyText: {
    fontFamily,
    color: colors.inkSoft,
    lineHeight: 19,
    marginTop: 7,
    fontSize: 12,
  },
});
