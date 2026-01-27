import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../src/constants/data';
import api from '../src/services/api';

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

export default function TrainingCentersScreen() {
  const router = useRouter();
  const [centers, setCenters] = useState<TrainingCenter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCenters = async () => {
    try {
      const response = await api.get('/training-centers');
      setCenters(response.data);
    } catch (error) {
      console.error('Error fetching centers:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCenters();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCenters();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Centros de Formação</Text>
      </View>

      {/* Info Card */}
      <View style={styles.infoCard}>
        <Ionicons name="school" size={32} color={COLORS.primary} />
        <View style={styles.infoContent}>
          <Text style={styles.infoTitle}>Parceiros de Formação</Text>
          <Text style={styles.infoText}>
            Profissionais formados por estes centros recebem o selo de certificação.
          </Text>
        </View>
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
          }
        >
          {centers.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="school-outline" size={64} color={COLORS.textSecondary} />
              <Text style={styles.emptyTitle}>Nenhum centro encontrado</Text>
            </View>
          ) : (
            centers.map((center) => (
              <TouchableOpacity
                key={center.center_id}
                style={styles.centerCard}
                onPress={() => router.push(`/training-center/${center.center_id}`)}
              >
                <View style={styles.centerHeader}>
                  <View style={styles.centerLogo}>
                    {center.logo ? (
                      <Image source={{ uri: center.logo }} style={styles.logoImage} />
                    ) : (
                      <Ionicons name="school" size={28} color={COLORS.primary} />
                    )}
                  </View>
                  <View style={styles.centerInfo}>
                    <View style={styles.nameRow}>
                      <Text style={styles.centerName} numberOfLines={1}>{center.name}</Text>
                      {center.is_verified && (
                        <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
                      )}
                    </View>
                    <View style={styles.locationRow}>
                      <Ionicons name="location" size={14} color={COLORS.textSecondary} />
                      <Text style={styles.locationText}>{center.city}, {center.province}</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
                </View>
                <Text style={styles.centerDescription} numberOfLines={2}>
                  {center.description}
                </Text>
                <View style={styles.coursesContainer}>
                  {center.courses.slice(0, 4).map((course, index) => (
                    <View key={index} style={styles.courseTag}>
                      <Text style={styles.courseTagText}>{course}</Text>
                    </View>
                  ))}
                  {center.courses.length > 4 && (
                    <Text style={styles.moreText}>+{center.courses.length - 4}</Text>
                  )}
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}
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
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.primary}15`,
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    gap: 16,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
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
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: 16,
  },
  centerCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  centerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  centerLogo: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  logoImage: {
    width: 56,
    height: 56,
    borderRadius: 12,
  },
  centerInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  centerName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  centerDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  coursesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    alignItems: 'center',
  },
  courseTag: {
    backgroundColor: COLORS.surfaceLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  courseTagText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '500',
  },
  moreText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
});
