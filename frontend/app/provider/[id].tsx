import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SERVICE_CATEGORIES } from '../../src/constants/data';
import { useAuth } from '../../src/context/AuthContext';
import api from '../../src/services/api';

interface Provider {
  provider_id: string;
  user_id: string;
  name: string;
  email: string;
  phone: string;
  whatsapp?: string;
  picture?: string;
  bio: string;
  categories: string[];
  province: string;
  city: string;
  experience_years: number;
  hourly_rate?: number;
  rating: number;
  total_reviews: number;
  is_certified: boolean;
  training_center?: string;
}

interface Review {
  review_id: string;
  user_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

export default function ProviderDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const [provider, setProvider] = useState<Provider | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchProvider();
  }, [id]);

  const fetchProvider = async () => {
    try {
      const [providerRes, reviewsRes] = await Promise.all([
        api.get(`/providers/${id}`),
        api.get(`/reviews/${id}`),
      ]);
      setProvider(providerRes.data);
      setReviews(reviewsRes.data);
    } catch (error) {
      console.error('Error fetching provider:', error);
      Alert.alert('Erro', 'Prestador não encontrado');
      router.back();
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
          size={18}
          color={COLORS.primary}
        />
      );
    }
    return stars;
  };

  const handleCall = () => {
    if (provider?.phone) {
      Linking.openURL(`tel:${provider.phone}`);
    }
  };

  const handleWhatsApp = () => {
    if (provider?.whatsapp) {
      Linking.openURL(`https://wa.me/${provider.whatsapp.replace(/\D/g, '')}`);
    }
  };

  const handleMessage = () => {
    if (provider) {
      router.push(`/chat/new?receiverId=${provider.user_id}&receiverName=${encodeURIComponent(provider.name)}`);
    }
  };

  const handleRequestQuote = () => {
    if (provider) {
      router.push(`/quote/request?providerId=${provider.provider_id}&providerName=${encodeURIComponent(provider.name)}`);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!provider) {
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

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            {provider.picture ? (
              <Image source={{ uri: provider.picture }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={48} color={COLORS.textSecondary} />
              </View>
            )}
            {provider.is_certified && (
              <View style={styles.certifiedBadge}>
                <Ionicons name="checkmark-circle" size={28} color={COLORS.success} />
              </View>
            )}
          </View>
          <Text style={styles.providerName}>{provider.name}</Text>
          <View style={styles.ratingContainer}>
            {renderStars(provider.rating)}
            <Text style={styles.ratingText}>{provider.rating.toFixed(1)}</Text>
            <Text style={styles.reviewCount}>({provider.total_reviews} avaliações)</Text>
          </View>
          <View style={styles.locationRow}>
            <Ionicons name="location" size={16} color={COLORS.textSecondary} />
            <Text style={styles.locationText}>{provider.city}, {provider.province}</Text>
          </View>
          {provider.is_certified && (
            <View style={styles.certifiedTag}>
              <Ionicons name="ribbon" size={16} color={COLORS.success} />
              <Text style={styles.certifiedText}>Profissional Certificado</Text>
            </View>
          )}
        </View>

        {/* Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Serviços</Text>
          <View style={styles.categoriesContainer}>
            {provider.categories.map((cat) => (
              <View key={cat} style={styles.categoryTag}>
                <Text style={styles.categoryTagText}>{getCategoryName(cat)}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sobre</Text>
          <Text style={styles.bioText}>{provider.bio}</Text>
        </View>

        {/* Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informações</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Ionicons name="time" size={20} color={COLORS.primary} />
              <Text style={styles.infoLabel}>Experiência</Text>
              <Text style={styles.infoValue}>{provider.experience_years} anos</Text>
            </View>
            {provider.hourly_rate && (
              <View style={styles.infoItem}>
                <Ionicons name="cash" size={20} color={COLORS.primary} />
                <Text style={styles.infoLabel}>Preço/Hora</Text>
                <Text style={styles.infoValue}>{provider.hourly_rate.toLocaleString()} Kz</Text>
              </View>
            )}
          </View>
        </View>

        {/* Reviews */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Avaliações ({reviews.length})</Text>
          {reviews.length > 0 ? (
            reviews.slice(0, 5).map((review) => (
              <View key={review.review_id} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <Text style={styles.reviewerName}>{review.user_name}</Text>
                  <View style={styles.reviewRating}>
                    {renderStars(review.rating)}
                  </View>
                </View>
                <Text style={styles.reviewComment}>{review.comment}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.noReviews}>Ainda sem avaliações</Text>
          )}
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        <View style={styles.actionButtonsRow}>
          <TouchableOpacity style={styles.actionButtonSecondary} onPress={handleCall}>
            <Ionicons name="call" size={22} color={COLORS.text} />
          </TouchableOpacity>
          {provider.whatsapp && (
            <TouchableOpacity style={styles.actionButtonWhatsApp} onPress={handleWhatsApp}>
              <Ionicons name="logo-whatsapp" size={22} color="#fff" />
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.actionButtonSecondary} onPress={handleMessage}>
            <Ionicons name="chatbubble" size={22} color={COLORS.text} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.quoteButton} onPress={handleRequestQuote}>
          <Ionicons name="document-text" size={20} color="#000" />
          <Text style={styles.quoteButtonText}>Solicitar Orçamento</Text>
        </TouchableOpacity>
      </View>
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
  profileCard: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  certifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.background,
    borderRadius: 14,
  },
  providerName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  reviewCount: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
  },
  locationText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  certifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: `${COLORS.success}20`,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  certifiedText: {
    fontSize: 13,
    color: COLORS.success,
    fontWeight: '500',
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryTag: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  categoryTagText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500',
  },
  bioText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    lineHeight: 24,
  },
  infoGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  infoItem: {
    flex: 1,
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
  },
  infoLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  reviewCard: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewerName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  reviewRating: {
    flexDirection: 'row',
  },
  reviewComment: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  noReviews: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingVertical: 20,
  },
  bottomPadding: {
    height: 120,
  },
  actionsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    padding: 20,
    paddingBottom: 36,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  actionButtonSecondary: {
    flex: 1,
    height: 48,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  actionButtonWhatsApp: {
    flex: 1,
    height: 48,
    backgroundColor: '#25D366',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quoteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    height: 52,
    borderRadius: 12,
    gap: 8,
  },
  quoteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
});
