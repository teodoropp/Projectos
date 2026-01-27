import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SERVICE_CATEGORIES } from '../../src/constants/data';
import { useAuth } from '../../src/context/AuthContext';
import api from '../../src/services/api';

interface ProviderProfile {
  provider_id: string;
  name: string;
  phone: string;
  whatsapp?: string;
  bio: string;
  categories: string[];
  province: string;
  city: string;
  experience_years: number;
  hourly_rate?: number;
  rating: number;
  total_reviews: number;
  is_certified: boolean;
  is_active: boolean;
}

export default function MyProviderProfileScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProviderProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/providers/me/profile');
      setProfile(response.data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      Alert.alert('Erro', 'Não foi possível carregar o perfil');
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

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Perfil não encontrado</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Meu Perfil de Prestador</Text>
        </View>

        {/* Stats Card */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <View style={styles.ratingContainer}>
              {renderStars(profile.rating)}
            </View>
            <Text style={styles.statValue}>{profile.rating.toFixed(1)}</Text>
            <Text style={styles.statLabel}>Avaliação</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Ionicons name="chatbubbles" size={24} color={COLORS.primary} />
            <Text style={styles.statValue}>{profile.total_reviews}</Text>
            <Text style={styles.statLabel}>Avaliações</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Ionicons name="time" size={24} color={COLORS.primary} />
            <Text style={styles.statValue}>{profile.experience_years}</Text>
            <Text style={styles.statLabel}>Anos Exp.</Text>
          </View>
        </View>

        {/* Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Status</Text>
          <View style={[
            styles.statusBadge,
            profile.is_active ? styles.statusActive : styles.statusInactive
          ]}>
            <Ionicons
              name={profile.is_active ? 'checkmark-circle' : 'close-circle'}
              size={20}
              color={profile.is_active ? COLORS.success : COLORS.error}
            />
            <Text style={[
              styles.statusText,
              { color: profile.is_active ? COLORS.success : COLORS.error }
            ]}>
              {profile.is_active ? 'Perfil Ativo' : 'Perfil Inativo'}
            </Text>
          </View>
          {profile.is_certified && (
            <View style={styles.certifiedBadge}>
              <Ionicons name="ribbon" size={20} color={COLORS.success} />
              <Text style={styles.certifiedText}>Profissional Certificado</Text>
            </View>
          )}
        </View>

        {/* Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informações</Text>
          
          <View style={styles.infoItem}>
            <Ionicons name="location" size={20} color={COLORS.textSecondary} />
            <Text style={styles.infoText}>{profile.city}, {profile.province}</Text>
          </View>
          
          <View style={styles.infoItem}>
            <Ionicons name="call" size={20} color={COLORS.textSecondary} />
            <Text style={styles.infoText}>{profile.phone}</Text>
          </View>
          
          {profile.whatsapp && (
            <View style={styles.infoItem}>
              <Ionicons name="logo-whatsapp" size={20} color={COLORS.textSecondary} />
              <Text style={styles.infoText}>{profile.whatsapp}</Text>
            </View>
          )}
          
          {profile.hourly_rate && (
            <View style={styles.infoItem}>
              <Ionicons name="cash" size={20} color={COLORS.textSecondary} />
              <Text style={styles.infoText}>{profile.hourly_rate.toLocaleString()} Kz/hora</Text>
            </View>
          )}
        </View>

        {/* Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Serviços</Text>
          <View style={styles.categoriesContainer}>
            {profile.categories.map((cat) => (
              <View key={cat} style={styles.categoryTag}>
                <Text style={styles.categoryTagText}>{getCategoryName(cat)}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Bio */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Descrição</Text>
          <Text style={styles.bioText}>{profile.bio}</Text>
        </View>

        {/* View Quotes */}
        <TouchableOpacity
          style={styles.quotesButton}
          onPress={() => router.push('/quotes')}
        >
          <Ionicons name="document-text" size={22} color={COLORS.primary} />
          <Text style={styles.quotesButtonText}>Ver Orçamentos Recebidos</Text>
          <Ionicons name="chevron-forward" size={20} color={COLORS.primary} />
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
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  statusActive: {
    borderWidth: 1,
    borderColor: COLORS.success,
  },
  statusInactive: {
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  certifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: `${COLORS.success}20`,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  certifiedText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.success,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  infoText: {
    fontSize: 15,
    color: COLORS.text,
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
  quotesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    marginHorizontal: 20,
    marginTop: 24,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.primary,
    gap: 12,
  },
  quotesButtonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.primary,
  },
  bottomPadding: {
    height: 40,
  },
});
