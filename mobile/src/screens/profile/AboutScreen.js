import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import COLORS from '../../utils/colors';

const AboutScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>About</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>About FindMate</Text>

        <Text style={styles.paragraph}>
          FindMate is a student-first lost & found app created to make returning lost items fast, simple, and safe. Designed for campus life, FindMate connects owners and finders through a lightweight reporting flow, intelligent matching, and private chat — so items get returned with minimum friction.
        </Text>

      <Text style={styles.sectionTitle}>How it works</Text>
      <Text style={styles.listItem}>• Report: Create a listing with a photo, short description, location, and optional reward.</Text>
      <Text style={styles.listItem}>• Match: Our matching service surfaces likely matches near you and notifies relevant users.</Text>
      <Text style={styles.listItem}>• Communicate: Use the in-app chat to coordinate pickup without exposing personal contact details.</Text>
      <Text style={styles.listItem}>• Return: Mark the item as returned to close the listing.</Text>

      <Text style={styles.sectionTitle}>Why FindMate</Text>
      <Text style={styles.listItem}>• Campus-focused: Filters and matches are optimized for locality and campus networks.</Text>
      <Text style={styles.listItem}>• Private & secure: Only authenticated, verified users can message each other. We never sell your personal data.</Text>
      <Text style={styles.listItem}>• Fast photo handling: Uploaded photos are normalized and delivered to devices reliably so listings look great and accurate.</Text>

      <Text style={styles.sectionTitle}>Credits & contact</Text>
      <Text style={styles.paragraph}>
        Built by Pushpika Anuradha. For feedback, bug reports, or partnership inquiries: pushpikaanuradhagmail.com
      </Text>

      <Text style={styles.sectionTitle}>Version & tech</Text>
      <Text style={styles.paragraph}>Current version: 1.0.0</Text>
      <Text style={styles.paragraph}>Mobile: Expo / React Native</Text>
      <Text style={styles.paragraph}>Backend: Node.js + Express + PostgreSQL</Text>
      <Text style={styles.paragraph}>Image uploads: Cloudinary</Text>

      <Text style={styles.smallNote}>
        Privacy is important. FindMate only uses the information you provide to operate the service (listings, matches, and chat). We never sell personal data. Photos and minimal profile info are visible only to users on your campus.
      </Text>

      <View style={{ height: 40 }} />
    </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: COLORS.primary,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    flexDirection: 'row',
    alignItems: 'center'
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center'
  },
  backButtonText: { color: COLORS.white, fontSize: 26, lineHeight: 26 },
  headerTitle: { color: COLORS.white, fontSize: 22, fontWeight: '700', marginLeft: 8 },
  content: { padding: 20 },
  title: { fontSize: 22, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary, marginTop: 18, marginBottom: 8 },
  paragraph: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 20, marginBottom: 8 },
  listItem: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 20, marginBottom: 6 },
  smallNote: { fontSize: 12, color: COLORS.textTertiary, marginTop: 16, lineHeight: 18 }
});

export default AboutScreen;
