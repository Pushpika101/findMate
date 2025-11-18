import React from 'react';

// Debug overlay removed — keep a no-op export to avoid accidental imports.
export default function NotificationDebugOverlay() {
  return null;
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    right: 16,
    bottom: 80,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ff5a5f',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    elevation: 10
  },
  buttonText: { color: 'white', fontWeight: 'bold' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { width: '90%', maxHeight: '70%', backgroundColor: 'white', borderRadius: 12, padding: 12 },
  title: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  content: { marginBottom: 12 },
  label: { fontSize: 13, fontWeight: '600', color: '#333' },
  value: { fontSize: 12, color: '#111', marginTop: 6 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end' },
  actionBtn: { paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#007bff', borderRadius: 6, marginLeft: 8 },
  actionText: { color: 'white', fontWeight: '600' }
});
