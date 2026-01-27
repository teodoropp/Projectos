import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../src/constants/data';
import api from '../../src/services/api';

export default function RequestQuoteScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  
  const providerId = params.providerId as string;
  const providerName = decodeURIComponent(params.providerName as string);

  const [formData, setFormData] = useState({
    service_description: '',
    preferred_date: '',
  });

  const handleSubmit = async () => {
    if (!formData.service_description.trim()) {
      Alert.alert('Erro', 'Descreva o serviço que precisa');
      return;
    }

    setIsLoading(true);
    try {
      await api.post('/quotes', {
        provider_id: providerId,
        service_description: formData.service_description,
        preferred_date: formData.preferred_date || null,
      });

      Alert.alert('Sucesso', 'Solicitação de orçamento enviada!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      Alert.alert('Erro', error.response?.data?.detail || 'Erro ao enviar solicitação');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Solicitar Orçamento</Text>
        </View>

        {/* Provider Info */}
        <View style={styles.providerCard}>
          <View style={styles.providerIcon}>
            <Ionicons name="person" size={24} color={COLORS.primary} />
          </View>
          <Text style={styles.providerName}>{providerName}</Text>
        </View>

        <View style={styles.form}>
          {/* Service Description */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Descreva o serviço que precisa *</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Exemplo: Preciso de um eletricista para instalação de tomadas em uma sala comercial. São aproximadamente 10 pontos de tomada..."
              placeholderTextColor={COLORS.textSecondary}
              value={formData.service_description}
              onChangeText={(text) => setFormData({ ...formData, service_description: text })}
              multiline
              numberOfLines={6}
            />
          </View>

          {/* Preferred Date */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Data preferida (opcional)</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="calendar-outline" size={20} color={COLORS.textSecondary} />
              <TextInput
                style={styles.input}
                placeholder="Ex: Próxima semana, 15/01/2025..."
                placeholderTextColor={COLORS.textSecondary}
                value={formData.preferred_date}
                onChangeText={(text) => setFormData({ ...formData, preferred_date: text })}
              />
            </View>
          </View>

          {/* Info */}
          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={20} color={COLORS.primary} />
            <Text style={styles.infoText}>
              O prestador receberá sua solicitação e poderá responder com o valor e detalhes do serviço.
            </Text>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <>
                <Ionicons name="send" size={20} color="#000" />
                <Text style={styles.submitButtonText}>Enviar Solicitação</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
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
  providerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
  },
  providerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  providerName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  form: {
    padding: 20,
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
  },
  input: {
    flex: 1,
    color: COLORS.text,
    fontSize: 16,
  },
  textArea: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    color: COLORS.text,
    fontSize: 16,
    minHeight: 150,
    textAlignVertical: 'top',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: `${COLORS.primary}15`,
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    height: 56,
    borderRadius: 12,
    gap: 8,
    marginTop: 12,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
});
