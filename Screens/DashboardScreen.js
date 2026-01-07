import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Linking,
  Alert,
} from 'react-native';

export default function DashboardScreen() {
  // TODO: Replace these URLs with your actual links
  // YouTube video URL - replace with your actual video URL
  const youtubeVideoUrl = 'https://www.youtube.com/watch?v=YOUR_VIDEO_ID';
  
  // Social media URLs - replace with your actual links
  const instagramUrl = 'https://www.instagram.com/your_instagram';
  const tiktokUrl = 'https://www.tiktok.com/@your_tiktok';
  
  // TODO: Replace placeholder images with actual images
  // You can use: <Image source={require('../assets/your_image.jpg')} style={styles.image} />

  const openYouTubeVideo = async () => {
    try {
      // Try to open in YouTube app first, fallback to browser
      const youtubeAppUrl = youtubeVideoUrl.replace('youtube.com/watch?v=', 'youtu.be/');
      const canOpen = await Linking.canOpenURL(youtubeAppUrl);
      
      if (canOpen) {
        await Linking.openURL(youtubeAppUrl);
      } else {
        await Linking.openURL(youtubeVideoUrl);
      }
    } catch (error) {
      Alert.alert('Error', 'Could not open YouTube video. Please check your connection.');
    }
  };

  const openInstagram = async () => {
    try {
      const canOpen = await Linking.canOpenURL(instagramUrl);
      if (canOpen) {
        await Linking.openURL(instagramUrl);
      } else {
        Alert.alert('Error', 'Could not open Instagram.');
      }
    } catch (error) {
      Alert.alert('Error', 'Could not open Instagram.');
    }
  };

  const openTikTok = async () => {
    try {
      const canOpen = await Linking.canOpenURL(tiktokUrl);
      if (canOpen) {
        await Linking.openURL(tiktokUrl);
      } else {
        Alert.alert('Error', 'Could not open TikTok.');
      }
    } catch (error) {
      Alert.alert('Error', 'Could not open TikTok.');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Tutorial Section Card */}
      <View style={styles.card}>
        <View style={styles.tutorialContent}>
          <View style={styles.tutorialTextContainer}>
            <Text style={styles.tutorialTitle}>
              Learn how to wear your <Text style={styles.boldText}>Aligners</Text> properly
            </Text>
            <TouchableOpacity 
              style={styles.tutorialButton}
              onPress={openYouTubeVideo}
              activeOpacity={0.8}
            >
              <Text style={styles.tutorialButtonText}>Watch Full Tutorial</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.tutorialImageContainer}>
            <View style={styles.imagePlaceholder}>
              {/* TODO: Replace with actual image */}
              {/* <Image source={require('../assets/tutorial_image.jpg')} style={styles.tutorialImage} /> */}
              <Text style={styles.placeholderText}>📹</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Lab Information Card */}
      <View style={styles.card}>
        {/* Inside Our Lab Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Inside Our Lab</Text>
          <View style={styles.imageGrid}>
            <View style={styles.gridImagePlaceholder}>
              {/* TODO: Replace with actual lab images */}
              {/* <Image source={require('../assets/lab1.jpg')} style={styles.gridImage} /> */}
              <Text style={styles.placeholderText}>🏭</Text>
            </View>
            <View style={styles.gridImagePlaceholder}>
              {/* <Image source={require('../assets/lab2.jpg')} style={styles.gridImage} /> */}
              <Text style={styles.placeholderText}>🏭</Text>
            </View>
            <View style={styles.gridImagePlaceholder}>
              {/* <Image source={require('../assets/lab3.jpg')} style={styles.gridImage} /> */}
              <Text style={styles.placeholderText}>🏭</Text>
            </View>
            <View style={styles.gridImagePlaceholder}>
              {/* <Image source={require('../assets/lab4.jpg')} style={styles.gridImage} /> */}
              <Text style={styles.placeholderText}>🏭</Text>
            </View>
          </View>
        </View>

        {/* About Us Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About Us</Text>
          <Text style={styles.aboutText}>
            Something about the lab and whatever Something about the lab and whatever 
            Something about the lab and whatever Something about the lab and whatever 
            Something about the lab and whatever Something about the lab and whatever 
            Something about the lab and whatever Something about the lab and whatever.
          </Text>
        </View>

        {/* Follow Us Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitleCenter}>Follow us on</Text>
          <View style={styles.socialContainer}>
            <TouchableOpacity 
              style={styles.socialButton}
              onPress={openInstagram}
              activeOpacity={0.8}
            >
              <Text style={styles.socialIcon}>📷</Text>
              <Text style={styles.socialText}>Instagram</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.socialButton}
              onPress={openTikTok}
              activeOpacity={0.8}
            >
              <Text style={styles.socialIcon}>🎵</Text>
              <Text style={styles.socialText}>TikTok</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8F5E9',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  tutorialContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tutorialTextContainer: {
    flex: 1,
    marginRight: 16,
  },
  tutorialTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 16,
    lineHeight: 26,
  },
  boldText: {
    fontWeight: '700',
  },
  tutorialButton: {
    backgroundColor: '#A5D6A7',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignSelf: 'flex-start',
  },
  tutorialButtonText: {
    color: '#2C3E50',
    fontSize: 16,
    fontWeight: '600',
  },
  tutorialImageContainer: {
    width: 120,
    height: 120,
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
  },
  placeholderText: {
    fontSize: 32,
    color: '#999',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2C3E50',
    marginBottom: 16,
  },
  sectionTitleCenter: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2C3E50',
    marginBottom: 16,
    textAlign: 'center',
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridImagePlaceholder: {
    width: '48%',
    aspectRatio: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    marginBottom: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
  },
  aboutText: {
    fontSize: 15,
    color: '#5A6C7D',
    lineHeight: 24,
  },
  tutorialImage: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
    resizeMode: 'cover',
  },
  gridImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    resizeMode: 'cover',
  },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  socialButton: {
    alignItems: 'center',
    padding: 12,
  },
  socialIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  socialText: {
    fontSize: 14,
    color: '#2C3E50',
    fontWeight: '600',
  },
});

