import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
  FlatList,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SERVICE_CATEGORIES, ANGOLA_PROVINCES } from '../../src/constants/data';
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

export default function SearchScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [searchQuery, setSearchQuery] = useState((params.q as string) || '');
  const [selectedCategory, setSelectedCategory] = useState<string | null>((params.category as string) || null);
  const [selectedProvince, setSelectedProvince] = useState<string | null>(null);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showProvinceModal, setShowProvinceModal] = useState(false);

  const fetchProviders = async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (searchQuery) queryParams.append('search', searchQuery);
      if (selectedCategory) queryParams.append('category', selectedCategory);
      if (selectedProvince) queryParams.append('province', selectedProvince);

      const response = await api.get(`/providers?${queryParams.toString()}`);
      setProviders(response.data);
    } catch (error) {
      console.error('Error fetching providers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders();
  }, [selectedCategory, selectedProvince]);

  const handleSearch = () => {
    fetchProviders();
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
          size={14}
          color={COLORS.primary}
        />
      );
    }
    return stars;
  };

  const clearFilters = () => {
    setSelectedCategory(null);
    setSelectedProvince(null);
    setSearchQuery('');
  };

  const hasActiveFilters = selectedCategory || selectedProvince || searchQuery;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Buscar Serviços</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color={COLORS.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar profissionais..."
            placeholderTextColor={COLORS.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[styles.filterChip, selectedCategory && styles.filterChipActive]}
            onPress={() => setShowCategoryModal(true)}
          >
            <Ionicons
              name="grid"
              size={16}
              color={selectedCategory ? '#000' : COLORS.text}
            />
            <Text style={[styles.filterChipText, selectedCategory && styles.filterChipTextActive]}>
              {selectedCategory ? getCategoryName(selectedCategory) : 'Categoria'}
            </Text>
            <Ionicons
              name="chevron-down"
              size={16}
              color={selectedCategory ? '#000' : COLORS.text}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, selectedProvince && styles.filterChipActive]}
            onPress={() => setShowProvinceModal(true)}
          >
            <Ionicons
              name="location"
              size={16}
              color={selectedProvince ? '#000' : COLORS.text}
            />
            <Text style={[styles.filterChipText, selectedProvince && styles.filterChipTextActive]}>
              {selectedProvince || 'Província'}
            </Text>
            <Ionicons
              name="chevron-down"
              size={16}
              color={selectedProvince ? '#000' : COLORS.text}
            />
          </TouchableOpacity>

          {hasActiveFilters && (
            <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
              <Ionicons name="close" size={16} color={COLORS.error} />
              <Text style={styles.clearButtonText}>Limpar</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>

      {/* Results */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={providers}
          keyExtractor={(item) => item.provider_id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="search" size={64} color={COLORS.textSecondary} />
              <Text style={styles.emptyTitle}>Nenhum resultado encontrado</Text>
              <Text style={styles.emptySubtitle}>Tente ajustar os filtros</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.providerCard}
              onPress={() => router.push(`/provider/${item.provider_id}`)}
            >
              <View style={styles.providerAvatar}>
                {item.picture ? (
                  <Image source={{ uri: item.picture }} style={styles.avatarImage} />
                ) : (
                  <Ionicons name="person" size={32} color={COLORS.textSecondary} />
                )}
                {item.is_certified && (
                  <View style={styles.certifiedBadge}>
                    <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
                  </View>
                )}
              </View>
              <View style={styles.providerInfo}>
                <Text style={styles.providerName}>{item.name}</Text>
                <View style={styles.providerCategories}>
                  {item.categories.slice(0, 2).map((cat) => (
                    <View key={cat} style={styles.categoryTag}>
                      <Text style={styles.categoryTagText}>{getCategoryName(cat)}</Text>
                    </View>
                  ))}
                </View>
                <View style={styles.providerMeta}>
                  <View style={styles.ratingContainer}>
                    {renderStars(item.rating)}
                    <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
                    <Text style={styles.reviewCount}>({item.total_reviews})</Text>
                  </View>
                  <Text style={styles.locationText}>
                    <Ionicons name="location" size={12} color={COLORS.textSecondary} />
                    {' '}{item.city}, {item.province}
                  </Text>
                </View>
                {item.hourly_rate && (
                  <Text style={styles.priceText}>
                    {item.hourly_rate.toLocaleString()} Kz/hora
                  </Text>
                )}
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          )}
        />
      )}

      {/* Category Modal */}
      <Modal
        visible={showCategoryModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selecionar Categoria</Text>
              <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              <TouchableOpacity
                style={[styles.modalOption, !selectedCategory && styles.modalOptionActive]}
                onPress={() => {
                  setSelectedCategory(null);
                  setShowCategoryModal(false);
                }}
              >
                <Text style={[styles.modalOptionText, !selectedCategory && styles.modalOptionTextActive]}>
                  Todas as categorias
                </Text>
              </TouchableOpacity>
              {SERVICE_CATEGORIES.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.modalOption,
                    selectedCategory === category.id && styles.modalOptionActive,
                  ]}
                  onPress={() => {
                    setSelectedCategory(category.id);
                    setShowCategoryModal(false);
                  }}
                >
                  <Ionicons name={category.icon as any} size={20} color={selectedCategory === category.id ? '#000' : COLORS.text} />
                  <Text
                    style={[
                      styles.modalOptionText,
                      selectedCategory === category.id && styles.modalOptionTextActive,
                    ]}
                  >
                    {category.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Province Modal */}
      <Modal
        visible={showProvinceModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowProvinceModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selecionar Província</Text>
              <TouchableOpacity onPress={() => setShowProvinceModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              <TouchableOpacity
                style={[styles.modalOption, !selectedProvince && styles.modalOptionActive]}
                onPress={() => {
                  setSelectedProvince(null);
                  setShowProvinceModal(false);
                }}
              >
                <Text style={[styles.modalOptionText, !selectedProvince && styles.modalOptionTextActive]}>
                  Todas as províncias
                </Text>
              </TouchableOpacity>
              {ANGOLA_PROVINCES.map((province) => (
                <TouchableOpacity
                  key={province}
                  style={[
                    styles.modalOption,
                    selectedProvince === province && styles.modalOptionActive,
                  ]}
                  onPress={() => {
                    setSelectedProvince(province);
                    setShowProvinceModal(false);
                  }}
                >
                  <Ionicons
                    name="location"
                    size={20}
                    color={selectedProvince === province ? '#000' : COLORS.text}
                  />
                  <Text
                    style={[
                      styles.modalOptionText,
                      selectedProvince === province && styles.modalOptionTextActive,
                    ]}
                  >
                    {province}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: 16,
    marginLeft: 12,
  },
  filtersContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterChipText: {
    color: COLORS.text,
    fontSize: 14,
  },
  filterChipTextActive: {
    color: '#000',
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 4,
  },
  clearButtonText: {
    color: COLORS.error,
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 8,
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
  priceText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingHorizontal: 20,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalOptionActive: {
    backgroundColor: COLORS.primary,
  },
  modalOptionText: {
    fontSize: 16,
    color: COLORS.text,
  },
  modalOptionTextActive: {
    color: '#000',
    fontWeight: '500',
  },
});
