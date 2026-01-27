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
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SERVICE_CATEGORIES, ANGOLA_PROVINCES } from '../../src/constants/data';
import { useAuth } from '../../src/context/AuthContext';
import api from '../../src/services/api';

export default function ProviderRegisterScreen() {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showProvinceModal, setShowProvinceModal] = useState(false);

  const [formData, setFormData] = useState({
    bio: '',
    phone: '',
    whatsapp: '',
    province: '',
    city: '',
    experience_years: '',
    hourly_rate: '',
    categories: [] as string[],
  });

  const handleSubmit = async () => {
    if (!formData.bio || !formData.phone || !formData.province || !formData.city || formData.categories.length === 0) {
      Alert.alert('Erro', 'Preencha todos os campos obrigatórios');
      return;
    }

    setIsLoading(true);
    try {
      await api.post('/providers/register', {
        bio: formData.bio,
        phone: formData.phone,
        whatsapp: formData.whatsapp || null,
        province: formData.province,
        city: formData.city,
        experience_years: parseInt(formData.experience_years) || 0,
        hourly_rate: formData.hourly_rate ? parseFloat(formData.hourly_rate) : null,
        categories: formData.categories,
      });

      await refreshUser();
      Alert.alert('Sucesso', 'Perfil de prestador criado com sucesso!', [
        { text: 'OK', onPress: () => router.replace('/(tabs)/profile') }
      ]);
    } catch (error: any) {
      Alert.alert('Erro', error.response?.data?.detail || 'Erro ao criar perfil');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleCategory = (categoryId: string) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(categoryId)
        ? prev.categories.filter(c => c !== categoryId)
        : [...prev.categories, categoryId]
    }));
  };

  const getCategoryName = (categoryId: string): string => {
    const category = SERVICE_CATEGORIES.find(c => c.id === categoryId);
    return category?.name || categoryId;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Tornar-se Prestador</Text>
        </View>

        <View style={styles.form}>
          {/* Bio */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Descrição *</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Descreva seus serviços, experiência e especialidades..."
              placeholderTextColor={COLORS.textSecondary}
              value={formData.bio}
              onChangeText={(text) => setFormData({ ...formData, bio: text })}
              multiline
              numberOfLines={4}
            />
          </View>

          {/* Categories */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Categorias de Serviço *</Text>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => setShowCategoryModal(true)}
            >
              <Text style={formData.categories.length > 0 ? styles.selectText : styles.selectPlaceholder}>
                {formData.categories.length > 0
                  ? formData.categories.map(getCategoryName).join(', ')
                  : 'Selecione as categorias'}
              </Text>
              <Ionicons name="chevron-down" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Province */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Província *</Text>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => setShowProvinceModal(true)}
            >
              <Text style={formData.province ? styles.selectText : styles.selectPlaceholder}>
                {formData.province || 'Selecione a província'}
              </Text>
              <Ionicons name="chevron-down" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* City */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Cidade *</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="location-outline" size={20} color={COLORS.textSecondary} />
              <TextInput
                style={styles.input}
                placeholder="Ex: Luanda, Talatona..."
                placeholderTextColor={COLORS.textSecondary}
                value={formData.city}
                onChangeText={(text) => setFormData({ ...formData, city: text })}
              />
            </View>
          </View>

          {/* Phone */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Telefone *</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="call-outline" size={20} color={COLORS.textSecondary} />
              <TextInput
                style={styles.input}
                placeholder="+244 9XX XXX XXX"
                placeholderTextColor={COLORS.textSecondary}
                value={formData.phone}
                onChangeText={(text) => setFormData({ ...formData, phone: text })}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          {/* WhatsApp */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>WhatsApp (opcional)</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="logo-whatsapp" size={20} color={COLORS.textSecondary} />
              <TextInput
                style={styles.input}
                placeholder="+244 9XX XXX XXX"
                placeholderTextColor={COLORS.textSecondary}
                value={formData.whatsapp}
                onChangeText={(text) => setFormData({ ...formData, whatsapp: text })}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          {/* Experience */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Anos de Experiência</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="time-outline" size={20} color={COLORS.textSecondary} />
              <TextInput
                style={styles.input}
                placeholder="0"
                placeholderTextColor={COLORS.textSecondary}
                value={formData.experience_years}
                onChangeText={(text) => setFormData({ ...formData, experience_years: text })}
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Hourly Rate */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Preço por Hora (Kz)</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="cash-outline" size={20} color={COLORS.textSecondary} />
              <TextInput
                style={styles.input}
                placeholder="Ex: 5000"
                placeholderTextColor={COLORS.textSecondary}
                value={formData.hourly_rate}
                onChangeText={(text) => setFormData({ ...formData, hourly_rate: text })}
                keyboardType="numeric"
              />
            </View>
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
                <Ionicons name="checkmark-circle" size={20} color="#000" />
                <Text style={styles.submitButtonText}>Criar Perfil de Prestador</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

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
              <Text style={styles.modalTitle}>Selecionar Categorias</Text>
              <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {SERVICE_CATEGORIES.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.modalOption,
                    formData.categories.includes(category.id) && styles.modalOptionActive,
                  ]}
                  onPress={() => toggleCategory(category.id)}
                >
                  <Ionicons
                    name={category.icon as any}
                    size={20}
                    color={formData.categories.includes(category.id) ? '#000' : COLORS.text}
                  />
                  <Text
                    style={[
                      styles.modalOptionText,
                      formData.categories.includes(category.id) && styles.modalOptionTextActive,
                    ]}
                  >
                    {category.name}
                  </Text>
                  {formData.categories.includes(category.id) && (
                    <Ionicons name="checkmark" size={20} color="#000" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.modalDoneButton}
              onPress={() => setShowCategoryModal(false)}
            >
              <Text style={styles.modalDoneButtonText}>Concluído</Text>
            </TouchableOpacity>
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
              {ANGOLA_PROVINCES.map((province) => (
                <TouchableOpacity
                  key={province}
                  style={[
                    styles.modalOption,
                    formData.province === province && styles.modalOptionActive,
                  ]}
                  onPress={() => {
                    setFormData({ ...formData, province });
                    setShowProvinceModal(false);
                  }}
                >
                  <Ionicons
                    name="location"
                    size={20}
                    color={formData.province === province ? '#000' : COLORS.text}
                  />
                  <Text
                    style={[
                      styles.modalOptionText,
                      formData.province === province && styles.modalOptionTextActive,
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
    minHeight: 120,
    textAlignVertical: 'top',
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  selectText: {
    color: COLORS.text,
    fontSize: 16,
    flex: 1,
  },
  selectPlaceholder: {
    color: COLORS.textSecondary,
    fontSize: 16,
    flex: 1,
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
    flex: 1,
  },
  modalOptionTextActive: {
    color: '#000',
    fontWeight: '500',
  },
  modalDoneButton: {
    backgroundColor: COLORS.primary,
    margin: 20,
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalDoneButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
});
