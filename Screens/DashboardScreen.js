import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Linking,
  Alert,
  FlatList,
  Dimensions,
} from 'react-native';
import Colors from '../theme/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SLIDER_WIDTH = SCREEN_WIDTH - 72; // Account for padding and margins
const SLIDE_INTERVAL = 4000; // 4 seconds

export default function DashboardScreen() {
  // YouTube video URL
  const youtubeVideoUrl = 'https://youtu.be/XBdnfPepnXU?si=PQL45heL4YyT9Hcb';
  
  // Social media URLs
  const instagramUrl = 'https://www.instagram.com/mysmilereign?igsh=MXJnajV2Y2tha2piZw==';
  const tiktokUrl = 'https://www.tiktok.com/@your_tiktok';
  
  // Lab images data
  const [labImages] = useState([
    { id: 1, source: require('../assets/slider1.jpeg') },
    { id: 2, source: require('../assets/slider2.jpeg') },
    { id: 3, source: require('../assets/slider3.jpeg') },
  ]);
  
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const flatListRef = useRef(null);
  const timerRef = useRef(null);
  
  // Auto-scroll slider every 4 seconds
  useEffect(() => {
    const startAutoScroll = () => {
      timerRef.current = setInterval(() => {
        setCurrentImageIndex((prevIndex) => {
          const nextIndex = (prevIndex + 1) % labImages.length;
          
          // Scroll to next image
          if (flatListRef.current) {
            flatListRef.current.scrollToIndex({
              index: nextIndex,
              animated: true,
            });
          }
          
          return nextIndex;
        });
      }, SLIDE_INTERVAL);
    };
    
    startAutoScroll();
    
    // Cleanup on unmount
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [labImages.length]);
  
  // Handle manual scroll
  const onScroll = (event) => {
    const slideSize = SLIDER_WIDTH;
    const index = Math.round(event.nativeEvent.contentOffset.x / slideSize);
    setCurrentImageIndex(index);
    
    // Reset timer when user manually scrolls
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    timerRef.current = setInterval(() => {
      setCurrentImageIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % labImages.length;
        if (flatListRef.current) {
          flatListRef.current.scrollToIndex({
            index: nextIndex,
            animated: true,
          });
        }
        return nextIndex;
      });
    }, SLIDE_INTERVAL);
  };

  const openYouTubeVideo = async () => {
    try {
      // The URL is already in short format (youtu.be), which works well with the YouTube app
      const canOpen = await Linking.canOpenURL(youtubeVideoUrl);
      
      if (canOpen) {
        await Linking.openURL(youtubeVideoUrl);
      } else {
        Alert.alert('Error', 'Could not open YouTube. Please check if YouTube app is installed.');
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
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Tutorial Section Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.iconBadge}>
            <Text style={styles.iconBadgeText}>📚</Text>
          </View>
          <Text style={styles.cardHeaderTitle}>Tutorial</Text>
        </View>
        
        <View style={styles.tutorialContent}>
          <View style={styles.tutorialTextContainer}>
            <Text style={styles.tutorialTitle}>
              Learn how to wear your <Text style={styles.boldText}>Aligners</Text> properly
            </Text>
            <Text style={styles.tutorialSubtitle}>
              Watch our comprehensive guide to ensure optimal results
            </Text>
            <TouchableOpacity 
              style={styles.tutorialButton}
              onPress={openYouTubeVideo}
              activeOpacity={0.85}
            >
              <Text style={styles.tutorialButtonIcon}>▶</Text>
              <Text style={styles.tutorialButtonText}>Watch Full Tutorial</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.tutorialImageContainer}>
            <View style={styles.imagePlaceholder}>
              <Image source={require('../assets/top.webp')} style={styles.tutorialImage} />
              <View style={styles.playIconOverlay}>
                <View style={styles.playIconCircle}>
                  <Text style={styles.playIcon}>▶</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Lab Information Card */}
      <View style={styles.card}>
        {/* Inside Our Lab Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconContainer}>
              <Text style={styles.sectionIcon}>🏭</Text>
            </View>
            <Text style={styles.sectionTitle}>Inside Our Lab</Text>
          </View>
          
          {/* Image Slider */}
          <View style={styles.sliderContainer}>
            <FlatList
              ref={flatListRef}
              data={labImages}
              renderItem={({ item }) => (
                <View style={styles.sliderItem}>
                  <View style={styles.sliderImagePlaceholder}>
                    <Image source={item.source} style={styles.sliderImage} />
                  </View>
                </View>
              )}
              keyExtractor={(item) => item.id.toString()}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={onScroll}
              scrollEventThrottle={16}
              getItemLayout={(data, index) => ({
                length: SLIDER_WIDTH,
                offset: SLIDER_WIDTH * index,
                index,
              })}
              onScrollToIndexFailed={(info) => {
                // Handle scroll to index failure
                const wait = new Promise(resolve => setTimeout(resolve, 500));
                wait.then(() => {
                  flatListRef.current?.scrollToIndex({ index: info.index, animated: true });
                });
              }}
            />
            
            {/* Pagination Indicators */}
            <View style={styles.paginationContainer}>
              {labImages.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.paginationDot,
                    index === currentImageIndex && styles.paginationDotActive,
                    index < labImages.length - 1 && { marginRight: 8 },
                  ]}
                />
              ))}
            </View>
          </View>
        </View>

        {/* About SmileReign Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconContainer}>
              <Text style={styles.sectionIcon}>ℹ️</Text>
            </View>
            <Text style={styles.sectionTitle}>About SmileReign</Text>
          </View>
          <View style={styles.aboutContainer}>
            <Text style={styles.aboutText}>
              SmileReign was created to make the smile journey simpler, clearer, and more connected—for both providers and patients. Powered by CalWest Dental Lab, the platform brings together trusted lab expertise and modern digital tools in one seamless experience.
            </Text>
            <Text style={styles.aboutText}>
              We know that behind every case is a real person, real expectations, and real timelines. That's why SmileReign is built to support clear communication, smooth collaboration, and confidence at every step—from planning to final results. With CalWest Dental Lab behind the scenes, you're supported by a team with years of hands-on experience and a commitment to quality you can rely on.
            </Text>
            <Text style={styles.aboutText}>
              At the end of the day, SmileReign isn't just about technology. It's about making the process feel easier, more transparent, and more human—so everyone involved can focus on what matters most: creating beautiful, confident smiles.
            </Text>
            <Text style={styles.aboutTagline}>SmileReign — powered by CalWest Dental Lab.</Text>
            <View style={styles.aboutLinks}>
              <TouchableOpacity onPress={openInstagram} activeOpacity={0.7}>
                <Text style={styles.aboutLink}>Instagram</Text>
              </TouchableOpacity>
              <Text style={styles.aboutLinkDivider}> • </Text>
              <TouchableOpacity onPress={openTikTok} activeOpacity={0.7}>
                <Text style={styles.aboutLink}>TikTok</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Follow Us Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderCenter}>
            <View style={styles.sectionIconContainer}>
              <Text style={styles.sectionIcon}>📱</Text>
            </View>
            <Text style={styles.sectionTitleCenter}>Follow us on</Text>
          </View>
          <View style={styles.socialContainer}>
            <TouchableOpacity 
              style={[styles.socialButton, styles.instagramButton, { marginRight: 16 }]}
              onPress={openInstagram}
              activeOpacity={0.85}
            >
              <View style={styles.socialButtonContent}>
                <Text style={styles.socialIcon}>📷</Text>
                <Text style={styles.socialText}>Instagram</Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.socialButton, styles.tiktokButton]}
              onPress={openTikTok}
              activeOpacity={0.85}
            >
              <View style={styles.socialButtonContent}>
                <Text style={styles.socialIcon}>🎵</Text>
                <Text style={styles.socialText}>TikTok</Text>
              </View>
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
    backgroundColor: Colors.primaryLight,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconBadgeText: {
    fontSize: 20,
  },
  cardHeaderTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2C3E50',
    letterSpacing: 0.3,
  },
  tutorialContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  tutorialTextContainer: {
    flex: 1,
    marginRight: 20,
    paddingRight: 8,
  },
  tutorialTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2C3E50',
    marginBottom: 8,
    lineHeight: 28,
    letterSpacing: 0.2,
  },
  tutorialSubtitle: {
    fontSize: 14,
    color: '#5A6C7D',
    marginBottom: 20,
    lineHeight: 20,
  },
  boldText: {
    fontWeight: '800',
    color: '#1A252F',
  },
  tutorialButton: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  tutorialButtonIcon: {
    color: '#2C3E50',
    fontSize: 14,
    marginRight: 8,
    fontWeight: '700',
  },
  tutorialButtonText: {
    color: '#2C3E50',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  tutorialImageContainer: {
    width: 140,
    height: 140,
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F8F9FA',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.primaryLight,
    position: 'relative',
    overflow: 'hidden',
  },
  playIconOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  playIconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(165, 214, 167, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  playIcon: {
    color: '#2C3E50',
    fontSize: 18,
    marginLeft: 3,
    fontWeight: '700',
  },
  placeholderText: {
    fontSize: 40,
    color: Colors.primaryLighter,
    opacity: 0.5,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  sectionHeaderCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  sectionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F0F7F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sectionIcon: {
    fontSize: 18,
  },
  sectionTitle: {
    fontSize: 21,
    fontWeight: '700',
    color: '#2C3E50',
    letterSpacing: 0.3,
  },
  sectionTitleCenter: {
    fontSize: 21,
    fontWeight: '700',
    color: '#2C3E50',
    letterSpacing: 0.3,
  },
  sliderContainer: {
    marginBottom: 16,
  },
  sliderItem: {
    width: SLIDER_WIDTH,
    marginRight: 0,
  },
  sliderImagePlaceholder: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.primaryLight,
    overflow: 'hidden',
  },
  sliderImage: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    resizeMode: 'cover',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 8,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D0D0D0',
    marginHorizontal: 4,
  },
  paginationDotActive: {
    backgroundColor: Colors.primary,
    width: 28,
    height: 8,
    borderRadius: 4,
  },
  aboutContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  aboutText: {
    fontSize: 15,
    color: '#5A6C7D',
    lineHeight: 24,
    letterSpacing: 0.2,
    marginBottom: 14,
  },
  aboutTagline: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2C3E50',
    marginTop: 4,
    marginBottom: 16,
  },
  aboutLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  aboutLink: {
    fontSize: 15,
    color: Colors.primary,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  aboutLinkDivider: {
    fontSize: 15,
    color: '#5A6C7D',
    marginHorizontal: 4,
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
  },
  socialButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 32,
    alignItems: 'center',
    minWidth: 140,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1.5,
    borderColor: Colors.primaryLight,
  },
  instagramButton: {
    borderColor: Colors.primaryLight,
  },
  tiktokButton: {
    borderColor: Colors.primaryLight,
  },
  socialButtonContent: {
    alignItems: 'center',
  },
  socialIcon: {
    fontSize: 36,
    marginBottom: 10,
  },
  socialText: {
    fontSize: 15,
    color: '#2C3E50',
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});

