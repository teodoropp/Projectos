import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SERVICE_CATEGORIES } from '../../src/constants/data';
import api from '../../src/services/api';

interface TrainingCenter {
  center_id: string;
  name: string;
  description: string;
  province: string;
  city: string;
  phone: string;
  email: string;
  website?: string;
  logo?: string;
  courses: string[];
  is_verified: boolean;
}

interface Provider {
  provider_id: string;
  name: string;
  picture?: string;
  categories: string[];
  rating: number;
  total_reviews: number;
}

export default function TrainingCenterDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [center, setCenter] = useState<TrainingCenter | null>(null);
  const [graduates, setGraduates] = useState<Provider[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [centerRes, graduatesRes] = await Promise.all([
        api.get(`/training-centers/${id}`),
        api.get(`/training-centers/${id}/graduates`),
      ]);
      setCenter(centerRes.data);
      setGraduates(graduatesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getCategoryName = (categoryId: string): string => {
    const category = SERVICE_CATEGORIES.find(c => c.id === categoryId);
    return category?.name || categoryId;
  };

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Ionicons
          key={i}
          name={i <= rating ? 'star' : 'star-outline'}
          size={12}
          color={COLORS.primary}
        />
      );
    }
    return stars;
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!center) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        {/* Center Info */}
        <View style={styles.centerCard}>
          <View style={styles.centerLogo}>
            {center.logo ? (
              <Image source={{ uri: center.logo }} style={styles.logoImage} />
            ) : (
              <Ionicons name="school" size={40} color={COLORS.primary} />
            )}
          </View>
          <View style={styles.nameRow}>
            <Text style={styles.centerName}>{center.name}</Text>
            {center.is_verified && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
                <Text style={styles.verifiedText}>Verificado</Text>
              </View>
            )}
          </View>
          <View style={styles.locationRow}>
            <Ionicons name="location" size={16} color={COLORS.textSecondary} />
            <Text style={styles.locationText}>{center.city}, {center.province}</Text>
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sobre</Text>
          <Text style={styles.descriptionText}>{center.description}</Text>
        </View>

        {/* Courses */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cursos Oferecidos</Text>
          <View style={styles.coursesContainer}>
            {center.courses.map((course, index) => (
              <View key={index} style={styles.courseTag}>
                <Text style={styles.courseTagText}>{getCategoryName(course)}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Contact */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contacto</Text>
          <TouchableOpacity
            style={styles.contactItem}
            onPress={() => Linking.openURL(`tel:${center.phone}`)}
          >
            <Ionicons name="call" size={20} color={COLORS.primary} />
            <Text style={styles.contactText}>{center.phone}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.contactItem}
            onPress={() => Linking.openURL(`mailto:${center.email}`)}
          >
            <Ionicons name="mail" size={20} color={COLORS.primary} />
            <Text style={styles.contactText}>{center.email}</Text>
          </TouchableOpacity>
          {center.website && (
            <TouchableOpacity
              style={styles.contactItem}
              onPress={() => Linking.openURL(center.website!)}
            >
              <Ionicons name="globe" size={20} color={COLORS.primary} />
              <Text style={styles.contactText}>{center.website}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Graduates */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profissionais Formados ({graduates.length})</Text>
          {graduates.length > 0 ? (
            graduates.map((provider) => (
              <TouchableOpacity
                key={provider.provider_id}
                style={styles.providerCard}
                onPress={() => router.push(`/provider/${provider.provider_id}`)}
              >
                <View style={styles.providerAvatar}>
                  {provider.picture ? (
                    <Image source={{ uri: provider.picture }} style={styles.avatarImage} />
                  ) : (
                    <Ionicons name="person" size={24} color={COLORS.textSecondary} />
                  )}
                </View>
                <View style={styles.providerInfo}>
                  <Text style={styles.providerName}>{provider.name}</Text>
                  <View style={styles.providerCategories}>
                    {provider.categories.slice(0, 2).map((cat) => (
                      <Text key={cat} style={styles.categoryText}>{getCategoryName(cat)}</Text>
                    ))}
                  </View>
                  <View style={styles.ratingContainer}>
                    {renderStars(provider.rating)}
                    <Text style={styles.ratingText}>{provider.rating.toFixed(1)}</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            ))
          ) : (
            <Text style={styles.noGraduates}>Nenhum profissional formado registado</Text>
          )}
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerCard: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  centerLogo: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoImage: {
    width: 80,
    height: 80,
    borderRadius: 20,
  },
  nameRow: {
    alignItems: 'center',
    marginBottom: 8,
  },
  centerName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.success}20`,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  verifiedText: {
    fontSize: 13,
    color: COLORS.success,
    fontWeight: '500',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    lineHeight: 24,
  },
  coursesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  courseTag: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  courseTagText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  contactText: {
    fontSize: 15,
    color: COLORS.text,
  },
  providerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  providerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  providerInfo: {
    flex: 1,
  },
  providerName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  providerCategories: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
  },
  categoryText: {
    fontSize: 12,
    color: COLORS.primary,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
    marginLeft: 4,
  },
  noGraduates: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingVertical: 20,
  },
  bottomPadding: {
    height: 40,
  },
});
