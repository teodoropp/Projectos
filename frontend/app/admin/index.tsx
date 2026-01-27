import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../src/constants/data';
import { useAuth } from '../../src/context/AuthContext';
import api from '../../src/services/api';

interface AdminStats {
  total_users: number;
  total_clients: number;
  total_professionals: number;
  total_companies: number;
  pending_verifications: number;
  total_service_requests: number;
  total_proposals: number;
  total_jobs_completed: number;
  total_revenue: number;
}

interface PendingUser {
  user_id: string;
  name: string;
  email: string;
  phone: string;
  photo?: string;
  bi_photo?: string;
  user_type: string;
  company_name?: string;
  created_at: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Verificar se é admin
  useEffect(() => {
    if (user && user.user_type !== 'admin') {
      Alert.alert('Acesso Negado', 'Área restrita a administradores');
      router.replace('/(tabs)');
    }
  }, [user]);

  const fetchData = async () => {
    try {
      const [statsRes, pendingRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/pending-verifications'),
      ]);
      setStats(statsRes.data);
      setPendingUsers(pendingRes.data);
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

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleVerifyUser = async (userId: string, action: 'verificar' | 'rejeitar') => {
    Alert.alert(
      action === 'verificar' ? 'Verificar Utilizador' : 'Rejeitar Verificação',
      `Tem certeza que deseja ${action} este utilizador?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: action === 'verificar' ? 'Verificar' : 'Rejeitar',
          style: action === 'rejeitar' ? 'destructive' : 'default',
          onPress: async () => {
            try {
              await api.put(`/admin/verify-user/${userId}`, { action });
              Alert.alert('Sucesso', `Utilizador ${action === 'verificar' ? 'verificado' : 'rejeitado'} com sucesso`);
              fetchData();
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível processar a acção');
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

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
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Painel de Administração</Text>
        </View>

        {/* Estatísticas */}
        {stats && (
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Ionicons name="people" size={24} color={COLORS.primary} />
              <Text style={styles.statValue}>{stats.total_users}</Text>
              <Text style={styles.statLabel}>Total Utilizadores</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="person" size={24} color={COLORS.success} />
              <Text style={styles.statValue}>{stats.total_clients}</Text>
              <Text style={styles.statLabel}>Clientes</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="briefcase" size={24} color={COLORS.warning} />
              <Text style={styles.statValue}>{stats.total_professionals}</Text>
              <Text style={styles.statLabel}>Profissionais</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="business" size={24} color={COLORS.secondary} />
              <Text style={styles.statValue}>{stats.total_companies}</Text>
              <Text style={styles.statLabel}>Empresas</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="document-text" size={24} color={COLORS.primary} />
              <Text style={styles.statValue}>{stats.total_service_requests}</Text>
              <Text style={styles.statLabel}>Pedidos</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="checkmark-done" size={24} color={COLORS.success} />
              <Text style={styles.statValue}>{stats.total_jobs_completed}</Text>
              <Text style={styles.statLabel}>Concluídos</Text>
            </View>
          </View>
        )}

        {/* Receita */}
        {stats && (
          <View style={styles.revenueCard}>
            <Ionicons name="cash" size={32} color={COLORS.primary} />
            <View style={styles.revenueInfo}>
              <Text style={styles.revenueLabel}>Receita Total</Text>
              <Text style={styles.revenueValue}>{stats.total_revenue.toLocaleString()} Kz</Text>
            </View>
          </View>
        )}

        {/* Verificações Pendentes */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Verificações Pendentes</Text>
            <View style={styles.pendingBadge}>
              <Text style={styles.pendingBadgeText}>{pendingUsers.length}</Text>
            </View>
          </View>

          {pendingUsers.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="checkmark-circle" size={48} color={COLORS.success} />
              <Text style={styles.emptyText}>Nenhuma verificação pendente</Text>
            </View>
          ) : (
            pendingUsers.map((pendingUser) => (
              <View key={pendingUser.user_id} style={styles.pendingCard}>
                <View style={styles.pendingHeader}>
                  <View style={styles.pendingUserInfo}>
                    <View style={styles.pendingAvatar}>
                      {pendingUser.photo ? (
                        <Image source={{ uri: pendingUser.photo }} style={styles.avatarImage} />
                      ) : (
                        <Ionicons name="person" size={24} color={COLORS.textSecondary} />
                      )}
                    </View>
                    <View>
                      <Text style={styles.pendingName}>
                        {pendingUser.company_name || pendingUser.name}
                      </Text>
                      <Text style={styles.pendingEmail}>{pendingUser.email}</Text>
                      <Text style={styles.pendingType}>
                        {pendingUser.user_type === 'empresa' ? 'Empresa' : 
                         pendingUser.user_type === 'profissional' ? 'Profissional' : 'Cliente'}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Foto do BI */}
                {pendingUser.bi_photo && (
                  <View style={styles.biPhotoContainer}>
                    <Text style={styles.biPhotoLabel}>Foto do BI:</Text>
                    <Image source={{ uri: pendingUser.bi_photo }} style={styles.biPhoto} />
                  </View>
                )}

                {/* Acções */}
                <View style={styles.pendingActions}>
                  <TouchableOpacity
                    style={styles.rejectButton}
                    onPress={() => handleVerifyUser(pendingUser.user_id, 'rejeitar')}
                  >
                    <Ionicons name="close" size={20} color={COLORS.error} />
                    <Text style={styles.rejectButtonText}>Rejeitar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.approveButton}
                    onPress={() => handleVerifyUser(pendingUser.user_id, 'verificar')}
                  >
                    <Ionicons name="checkmark" size={20} color="#000" />
                    <Text style={styles.approveButtonText}>Verificar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
  },
  statCard: {
    width: '31%',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  revenueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.primary}15`,
    marginHorizontal: 20,
    marginTop: 16,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.primary,
    gap: 16,
  },
  revenueInfo: {
    flex: 1,
  },
  revenueLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  revenueValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  pendingBadge: {
    backgroundColor: COLORS.warning,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pendingBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 12,
  },
  pendingCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  pendingHeader: {
    marginBottom: 12,
  },
  pendingUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pendingAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  pendingName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  pendingEmail: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  pendingType: {
    fontSize: 12,
    color: COLORS.primary,
    marginTop: 2,
  },
  biPhotoContainer: {
    marginBottom: 12,
  },
  biPhotoLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  biPhoto: {
    width: '100%',
    height: 150,
    borderRadius: 12,
    resizeMode: 'contain',
    backgroundColor: COLORS.surfaceLight,
  },
  pendingActions: {
    flexDirection: 'row',
    gap: 12,
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${COLORS.error}15`,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.error,
    gap: 8,
  },
  rejectButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.error,
  },
  approveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  approveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  bottomPadding: {
    height: 40,
  },
});
