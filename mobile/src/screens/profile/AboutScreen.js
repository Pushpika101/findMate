import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import useThemedStyles from '../../hooks/useThemedStyles';

const AboutScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const styles = useThemedStyles((c) => ({
    container: { flex: 1, backgroundColor: c.background },
    header: { paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20, backgroundColor: c.primary, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, flexDirection: 'row', alignItems: 'center' },
    backButton: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    backButtonText: { color: c.white, fontSize: 26, lineHeight: 26 },
    headerTitle: { color: c.white, fontSize: 22, fontWeight: '700', marginLeft: 8 },
    content: { padding: 20 },
    title: { fontSize: 22, fontWeight: '700', color: c.textPrimary, marginBottom: 12 },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: c.textPrimary, marginTop: 18, marginBottom: 8 },
    paragraph: { fontSize: 14, color: c.textSecondary, lineHeight: 20, marginBottom: 8 },
    listItem: { fontSize: 14, color: c.textSecondary, lineHeight: 20, marginBottom: 6 },
    smallNote: { fontSize: 12, color: c.textTertiary, marginTop: 16, lineHeight: 18 }
  }));

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
        Built by Pushpika Anuradha. For feedback, bug reports, or partnership inquiries: pushpikaanuradha@gmail.com
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

// styles are created with useThemedStyles inside the component

export default AboutScreen;
