import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../src/constants/data';
import { useAuth } from '../src/context/AuthContext';
import api from '../src/services/api';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';

interface Quote {
  quote_id: string;
  client_id: string;
  client_name: string;
  provider_id: string;
  provider_name: string;
  service_description: string;
  preferred_date?: string;
  status: string;
  response?: string;
  price?: number;
  created_at: string;
}

export default function QuotesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'sent' | 'received'>('sent');
  const [sentQuotes, setSentQuotes] = useState<Quote[]>([]);
  const [receivedQuotes, setReceivedQuotes] = useState<Quote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchQuotes = async () => {
    try {
      const [sentRes, receivedRes] = await Promise.all([
        api.get('/quotes/sent'),
        user?.is_provider ? api.get('/quotes/received') : Promise.resolve({ data: [] }),
      ]);
      setSentQuotes(sentRes.data);
      setReceivedQuotes(receivedRes.data);
    } catch (error) {
      console.error('Error fetching quotes:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchQuotes();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchQuotes();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return COLORS.warning;
      case 'accepted': return COLORS.success;
      case 'declined': return COLORS.error;
      case 'completed': return COLORS.primary;
      default: return COLORS.textSecondary;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendente';
      case 'accepted': return 'Aceite';
      case 'declined': return 'Recusado';
      case 'completed': return 'Concluído';
      default: return status;
    }
  };

  const quotes = activeTab === 'sent' ? sentQuotes : receivedQuotes;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Orçamentos</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'sent' && styles.tabActive]}
          onPress={() => setActiveTab('sent')}
        >
          <Text style={[styles.tabText, activeTab === 'sent' && styles.tabTextActive]}>
            Enviados ({sentQuotes.length})
          </Text>
        </TouchableOpacity>
        {user?.is_provider && (
          <TouchableOpacity
            style={[styles.tab, activeTab === 'received' && styles.tabActive]}
            onPress={() => setActiveTab('received')}
          >
            <Text style={[styles.tabText, activeTab === 'received' && styles.tabTextActive]}>
              Recebidos ({receivedQuotes.length})
            </Text>
          </TouchableOpacity>
        )}
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
          {quotes.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="document-text-outline" size={64} color={COLORS.textSecondary} />
              <Text style={styles.emptyTitle}>
                {activeTab === 'sent' ? 'Nenhum orçamento enviado' : 'Nenhum orçamento recebido'}
              </Text>
            </View>
          ) : (
            quotes.map((quote) => (
              <View key={quote.quote_id} style={styles.quoteCard}>
                <View style={styles.quoteHeader}>
                  <Text style={styles.quoteName}>
                    {activeTab === 'sent' ? quote.provider_name : quote.client_name}
                  </Text>
                  <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(quote.status)}20` }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(quote.status) }]}>
                      {getStatusLabel(quote.status)}
                    </Text>
                  </View>
                </View>
                <Text style={styles.quoteDescription} numberOfLines={2}>
                  {quote.service_description}
                </Text>
                {quote.preferred_date && (
                  <View style={styles.quoteInfo}>
                    <Ionicons name="calendar" size={14} color={COLORS.textSecondary} />
                    <Text style={styles.quoteInfoText}>{quote.preferred_date}</Text>
                  </View>
                )}
                {quote.price && (
                  <View style={styles.quoteInfo}>
                    <Ionicons name="cash" size={14} color={COLORS.primary} />
                    <Text style={styles.quotePriceText}>{quote.price.toLocaleString()} Kz</Text>
                  </View>
                )}
                {quote.response && (
                  <View style={styles.responseBox}>
                    <Text style={styles.responseLabel}>Resposta:</Text>
                    <Text style={styles.responseText}>{quote.response}</Text>
                  </View>
                )}
                <Text style={styles.quoteDate}>
                  {format(new Date(quote.created_at), "dd 'de' MMMM 'de' yyyy", { locale: pt })}
                </Text>
              </View>
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
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tabActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
  },
  tabTextActive: {
    color: '#000',
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
  quoteCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  quoteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  quoteName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  quoteDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 8,
    lineHeight: 20,
  },
  quoteInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  quoteInfoText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  quotePriceText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  responseBox: {
    backgroundColor: COLORS.surfaceLight,
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  responseLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  responseText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  quoteDate: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 12,
  },
});
