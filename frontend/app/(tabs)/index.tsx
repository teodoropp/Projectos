import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SERVICE_CATEGORIES } from '../../src/constants/data';
import { useAuth } from '../../src/context/AuthContext';
import api from '../../src/services/api';

interface Provider {
  provider_id: string;
  name: string;
  picture?: string;
  bio: string;
  categories: string[];
  province: string;
  city: string;
  rating: number;
  total_reviews: number;
  is_certified: boolean;
  hourly_rate?: number;
}

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [featuredProviders, setFeaturedProviders] = useState<Provider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const [providersRes] = await Promise.all([
        api.get('/providers/featured?limit=10'),
      ]);
      setFeaturedProviders(providersRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, []);

  const getCategoryIcon = (categoryId: string): keyof typeof Ionicons.glyphMap => {
    const category = SERVICE_CATEGORIES.find(c => c.id === categoryId);
    return (category?.icon as keyof typeof Ionicons.glyphMap) || 'construct';
  };

  const getCategoryName = (categoryId: string): string => {
    const category = SERVICE_CATEGORIES.find(c => c.id === categoryId);
    return category?.name || categoryId;
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push(`/(tabs)/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Ionicons
          key={i}
          name={i <= rating ? 'star' : 'star-outline'}
          size={14}
          color={COLORS.primary}
        />
      );
    }
    return stars;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Olá, {user?.name?.split(' ')[0] || 'Visitante'}</Text>
            <Text style={styles.subGreeting}>O que precisa hoje?</Text>
          </View>
          <View style={styles.logoContainer}>
            <Ionicons name="construct" size={28} color={COLORS.primary} />
          </View>
        </View>

        {/* Search Bar */}
        <TouchableOpacity style={styles.searchContainer} onPress={() => router.push('/(tabs)/search')}>
          <Ionicons name="search" size={20} color={COLORS.textSecondary} />
          <Text style={styles.searchPlaceholder}>Buscar serviços...</Text>
        </TouchableOpacity>

        {/* Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Categorias</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
            {SERVICE_CATEGORIES.slice(0, 8).map((category) => (
              <TouchableOpacity
                key={category.id}
                style={styles.categoryCard}
                onPress={() => router.push(`/(tabs)/search?category=${category.id}`)}
              >
                <View style={styles.categoryIcon}>
                  <Ionicons name={category.icon as any} size={24} color={COLORS.primary} />
                </View>
                <Text style={styles.categoryName} numberOfLines={1}>{category.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity
            style={styles.viewAllButton}
            onPress={() => router.push('/(tabs)/search')}
          >
            <Text style={styles.viewAllText}>Ver todas categorias</Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {/* Featured Providers */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profissionais em Destaque</Text>
          {isLoading ? (
            <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
          ) : featuredProviders.length > 0 ? (
            featuredProviders.map((provider) => (
              <TouchableOpacity
                key={provider.provider_id}
                style={styles.providerCard}
                onPress={() => router.push(`/provider/${provider.provider_id}`)}
              >
                <View style={styles.providerAvatar}>
                  {provider.picture ? (
                    <Image source={{ uri: provider.picture }} style={styles.avatarImage} />
                  ) : (
                    <Ionicons name="person" size={32} color={COLORS.textSecondary} />
                  )}
                  {provider.is_certified && (
                    <View style={styles.certifiedBadge}>
                      <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
                    </View>
                  )}
                </View>
                <View style={styles.providerInfo}>
                  <Text style={styles.providerName}>{provider.name}</Text>
                  <View style={styles.providerCategories}>
                    {provider.categories.slice(0, 2).map((cat) => (
                      <View key={cat} style={styles.categoryTag}>
                        <Text style={styles.categoryTagText}>{getCategoryName(cat)}</Text>
                      </View>
                    ))}
                  </View>
                  <View style={styles.providerMeta}>
                    <View style={styles.ratingContainer}>
                      {renderStars(provider.rating)}
                      <Text style={styles.ratingText}>{provider.rating.toFixed(1)}</Text>
                      <Text style={styles.reviewCount}>({provider.total_reviews})</Text>
                    </View>
                    <Text style={styles.locationText}>
                      <Ionicons name="location" size={12} color={COLORS.textSecondary} />
                      {' '}{provider.city}, {provider.province}
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="people" size={48} color={COLORS.textSecondary} />
              <Text style={styles.emptyText}>Nenhum profissional encontrado</Text>
              <Text style={styles.emptySubtext}>Seja o primeiro a se registar!</Text>
            </View>
          )}
        </View>

        {/* Training Centers CTA */}
        <TouchableOpacity
          style={styles.ctaCard}
          onPress={() => router.push('/training-centers')}
        >
          <View style={styles.ctaContent}>
            <Ionicons name="school" size={32} color={COLORS.primary} />
            <View style={styles.ctaText}>
              <Text style={styles.ctaTitle}>Centros de Formação</Text>
              <Text style={styles.ctaSubtitle}>Encontre profissionais certificados</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={24} color={COLORS.primary} />
        </TouchableOpacity>

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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  subGreeting: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  logoContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    marginHorizontal: 20,
    marginVertical: 16,
    paddingHorizontal: 16,
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchPlaceholder: {
    flex: 1,
    color: COLORS.textSecondary,
    fontSize: 16,
    marginLeft: 12,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
  },
  categoriesScroll: {
    marginLeft: -4,
  },
  categoryCard: {
    alignItems: 'center',
    marginRight: 16,
    width: 80,
  },
  categoryIcon: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryName: {
    fontSize: 12,
    color: COLORS.text,
    textAlign: 'center',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingVertical: 8,
  },
  viewAllText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '500',
    marginRight: 4,
  },
  loader: {
    marginVertical: 40,
  },
  providerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  providerAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  certifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: COLORS.surface,
    borderRadius: 10,
  },
  providerInfo: {
    flex: 1,
  },
  providerName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  providerCategories: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  categoryTag: {
    backgroundColor: COLORS.surfaceLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryTagText: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '500',
  },
  providerMeta: {
    gap: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    marginLeft: 4,
  },
  reviewCount: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  locationText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.text,
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  ctaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  ctaContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  ctaText: {
    gap: 4,
  },
  ctaTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  ctaSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  bottomPadding: {
    height: 20,
  },
});
