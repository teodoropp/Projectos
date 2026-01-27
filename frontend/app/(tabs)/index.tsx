import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SERVICE_CATEGORIES, VERIFICATION_STATUS, URGENCY_LEVELS } from '../../src/constants/data';
import { useAuth } from '../../src/context/AuthContext';
import api from '../../src/services/api';

interface ServiceRequest {
  request_id: string;
  client_name: string;
  client_photo?: string;
  client_type: string;
  client_verified: boolean;
  title: string;
  description: string;
  category: string;
  province: string;
  city: string;
  budget_min?: number;
  budget_max?: number;
  urgency: string;
  total_proposals: number;
  created_at: string;
}

interface Professional {
  user_id: string;
  name: string;
  photo?: string;
  company_name?: string;
  company_logo?: string;
  user_type: string;
  verification_status: string;
  categories?: string[];
  province?: string;
  city?: string;
  rating: number;
  total_reviews: number;
  subscription_plan: string;
}

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [featuredProfessionals, setFeaturedProfessionals] = useState<Professional[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const [requestsRes, professionalsRes] = await Promise.all([
        api.get('/service-requests?limit=10'),
        api.get('/professionals/featured?limit=5'),
      ]);
      setServiceRequests(requestsRes.data);
      setFeaturedProfessionals(professionalsRes.data);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
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

  const getCategoryName = (categoryId: string): string => {
    const category = SERVICE_CATEGORIES.find(c => c.id === categoryId);
    return category?.name || categoryId;
  };

  const getCategoryIcon = (categoryId: string): string => {
    const category = SERVICE_CATEGORIES.find(c => c.id === categoryId);
    return category?.icon || 'construct';
  };

  const getUrgencyColor = (urgency: string): string => {
    const level = URGENCY_LEVELS.find(l => l.id === urgency);
    return level?.color || COLORS.textSecondary;
  };

  const getUrgencyLabel = (urgency: string): string => {
    const level = URGENCY_LEVELS.find(l => l.id === urgency);
    return level?.name || urgency;
  };

  const formatBudget = (min?: number, max?: number): string => {
    if (!min && !max) return 'A combinar';
    if (min && max) return `${min.toLocaleString()} - ${max.toLocaleString()} Kz`;
    if (min) return `A partir de ${min.toLocaleString()} Kz`;
    return `Até ${max?.toLocaleString()} Kz`;
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

  const isProfessionalOrCompany = user?.user_type === 'profissional' || user?.user_type === 'empresa';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
      >
        {/* Cabeçalho */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Olá, {user?.company_name || user?.name?.split(' ')[0] || 'Visitante'}</Text>
            <Text style={styles.subGreeting}>
              {isProfessionalOrCompany ? 'Veja pedidos de serviço' : 'O que precisa hoje?'}
            </Text>
          </View>
          <View style={styles.headerRight}>
            {user?.verification_status === 'verificado' ? (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
              </View>
            ) : (
              <TouchableOpacity 
                style={styles.verifyButton}
                onPress={() => router.push('/profile/verify')}
              >
                <Ionicons name="shield-outline" size={20} color={COLORS.warning} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Alerta de verificação */}
        {user?.verification_status === 'pendente' && (
          <TouchableOpacity 
            style={styles.verificationAlert}
            onPress={() => router.push('/profile/verify')}
          >
            <Ionicons name="alert-circle" size={24} color={COLORS.warning} />
            <View style={styles.verificationAlertContent}>
              <Text style={styles.verificationAlertTitle}>Complete sua verificação</Text>
              <Text style={styles.verificationAlertText}>
                Envie sua foto e BI para ganhar o selo de confiança
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.warning} />
          </TouchableOpacity>
        )}

        {/* Acções rápidas */}
        <View style={styles.quickActions}>
          {!isProfessionalOrCompany && (
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push('/service-request/create')}
            >
              <View style={[styles.actionIcon, { backgroundColor: `${COLORS.primary}20` }]}>
                <Ionicons name="add-circle" size={24} color={COLORS.primary} />
              </View>
              <Text style={styles.actionText}>Publicar Pedido</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push('/(tabs)/search')}
          >
            <View style={[styles.actionIcon, { backgroundColor: `${COLORS.success}20` }]}>
              <Ionicons name="search" size={24} color={COLORS.success} />
            </View>
            <Text style={styles.actionText}>Buscar {isProfessionalOrCompany ? 'Pedidos' : 'Profissionais'}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push('/(tabs)/messages')}
          >
            <View style={[styles.actionIcon, { backgroundColor: `${COLORS.secondary}20` }]}>
              <Ionicons name="chatbubbles" size={24} color={COLORS.secondary} />
            </View>
            <Text style={styles.actionText}>Mensagens</Text>
          </TouchableOpacity>
        </View>

        {/* Categorias */}
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
        </View>

        {/* Pedidos de Serviço Recentes */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Pedidos Recentes</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/search')}>
              <Text style={styles.seeAllText}>Ver todos</Text>
            </TouchableOpacity>
          </View>
          
          {isLoading ? (
            <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
          ) : serviceRequests.length > 0 ? (
            serviceRequests.slice(0, 5).map((request) => (
              <TouchableOpacity
                key={request.request_id}
                style={styles.requestCard}
                onPress={() => router.push(`/service-request/${request.request_id}`)}
              >
                <View style={styles.requestHeader}>
                  <View style={styles.requestClientInfo}>
                    <View style={styles.clientAvatar}>
                      {request.client_photo ? (
                        <Image source={{ uri: request.client_photo }} style={styles.avatarImage} />
                      ) : (
                        <Ionicons name={request.client_type === 'empresa' ? 'business' : 'person'} size={20} color={COLORS.textSecondary} />
                      )}
                    </View>
                    <View>
                      <View style={styles.clientNameRow}>
                        <Text style={styles.clientName}>{request.client_name}</Text>
                        {request.client_verified && (
                          <Ionicons name="checkmark-circle" size={14} color={COLORS.success} />
                        )}
                      </View>
                      <Text style={styles.clientType}>
                        {request.client_type === 'empresa' ? 'Empresa' : 'Cliente'}
                      </Text>
                    </View>
                  </View>
                  <View style={[styles.urgencyBadge, { backgroundColor: `${getUrgencyColor(request.urgency)}20` }]}>
                    <Text style={[styles.urgencyText, { color: getUrgencyColor(request.urgency) }]}>
                      {getUrgencyLabel(request.urgency)}
                    </Text>
                  </View>
                </View>
                <Text style={styles.requestTitle}>{request.title}</Text>
                <Text style={styles.requestDescription} numberOfLines={2}>
                  {request.description}
                </Text>
                <View style={styles.requestMeta}>
                  <View style={styles.categoryTag}>
                    <Ionicons name={getCategoryIcon(request.category) as any} size={12} color={COLORS.primary} />
                    <Text style={styles.categoryTagText}>{getCategoryName(request.category)}</Text>
                  </View>
                  <View style={styles.locationTag}>
                    <Ionicons name="location" size={12} color={COLORS.textSecondary} />
                    <Text style={styles.locationText}>{request.city}, {request.province}</Text>
                  </View>
                </View>
                <View style={styles.requestFooter}>
                  <Text style={styles.budgetText}>{formatBudget(request.budget_min, request.budget_max)}</Text>
                  <Text style={styles.proposalsText}>{request.total_proposals} propostas</Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={48} color={COLORS.textSecondary} />
              <Text style={styles.emptyText}>Nenhum pedido encontrado</Text>
              {!isProfessionalOrCompany && (
                <TouchableOpacity 
                  style={styles.emptyButton}
                  onPress={() => router.push('/service-request/create')}
                >
                  <Text style={styles.emptyButtonText}>Publicar Pedido</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Profissionais em Destaque */}
        {featuredProfessionals.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Profissionais em Destaque</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/search')}>
                <Text style={styles.seeAllText}>Ver todos</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {featuredProfessionals.map((professional) => (
                <TouchableOpacity
                  key={professional.user_id}
                  style={styles.professionalCard}
                  onPress={() => router.push(`/professional/${professional.user_id}`)}
                >
                  <View style={styles.professionalAvatar}>
                    {professional.company_logo || professional.photo ? (
                      <Image 
                        source={{ uri: professional.company_logo || professional.photo }} 
                        style={styles.professionalAvatarImage} 
                      />
                    ) : (
                      <Ionicons 
                        name={professional.user_type === 'empresa' ? 'business' : 'person'} 
                        size={28} 
                        color={COLORS.textSecondary} 
                      />
                    )}
                    {professional.verification_status === 'verificado' && (
                      <View style={styles.verifiedIcon}>
                        <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
                      </View>
                    )}
                  </View>
                  <Text style={styles.professionalName} numberOfLines={1}>
                    {professional.company_name || professional.name}
                  </Text>
                  <View style={styles.ratingRow}>
                    {renderStars(professional.rating)}
                    <Text style={styles.ratingText}>{professional.rating.toFixed(1)}</Text>
                  </View>
                  {professional.subscription_plan !== 'gratuito' && (
                    <View style={styles.premiumBadge}>
                      <Ionicons name="star" size={10} color="#000" />
                      <Text style={styles.premiumText}>PRO</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

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
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verifiedBadge: {
    padding: 8,
  },
  verifyButton: {
    padding: 8,
    backgroundColor: `${COLORS.warning}20`,
    borderRadius: 20,
  },
  verificationAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.warning}15`,
    marginHorizontal: 20,
    marginTop: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: `${COLORS.warning}30`,
    gap: 12,
  },
  verificationAlertContent: {
    flex: 1,
  },
  verificationAlertTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  verificationAlertText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  actionButton: {
    alignItems: 'center',
    gap: 8,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    fontSize: 12,
    color: COLORS.text,
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  seeAllText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500',
  },
  categoriesScroll: {
    marginTop: 12,
  },
  categoryCard: {
    alignItems: 'center',
    marginRight: 16,
    width: 72,
  },
  categoryIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryName: {
    fontSize: 11,
    color: COLORS.text,
    textAlign: 'center',
  },
  loader: {
    marginVertical: 40,
  },
  requestCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  requestClientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  clientAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  clientNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  clientName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  clientType: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  urgencyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  urgencyText: {
    fontSize: 11,
    fontWeight: '600',
  },
  requestTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  requestDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  requestMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  categoryTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.primary}15`,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  categoryTagText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '500',
  },
  locationTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  requestFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  budgetText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  proposalsText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: 12,
  },
  emptyButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 16,
  },
  emptyButtonText: {
    color: '#000',
    fontWeight: '600',
  },
  professionalCard: {
    width: 140,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  professionalAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  professionalAvatarImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  verifiedIcon: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: COLORS.surface,
    borderRadius: 10,
  },
  professionalName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 6,
  },
  ratingRow: {
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
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 8,
    gap: 4,
  },
  premiumText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#000',
  },
  bottomPadding: {
    height: 20,
  },
});
