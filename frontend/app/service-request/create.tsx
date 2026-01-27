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
import { COLORS, SERVICE_CATEGORIES, ANGOLA_PROVINCES, URGENCY_LEVELS } from '../../src/constants/data';
import api from '../../src/services/api';

export default function CreateServiceRequestScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showProvinceModal, setShowProvinceModal] = useState(false);
  const [showUrgencyModal, setShowUrgencyModal] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    province: '',
    city: '',
    budget_min: '',
    budget_max: '',
    urgency: 'normal',
    deadline: '',
  });

  const handleSubmit = async () => {
    if (!formData.title || !formData.description || !formData.category || !formData.province || !formData.city) {
      Alert.alert('Erro', 'Preencha todos os campos obrigatórios');
      return;
    }

    setIsLoading(true);
    try {
      await api.post('/service-requests', {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        province: formData.province,
        city: formData.city,
        budget_min: formData.budget_min ? parseFloat(formData.budget_min) : null,
        budget_max: formData.budget_max ? parseFloat(formData.budget_max) : null,
        urgency: formData.urgency,
        deadline: formData.deadline || null,
      });

      Alert.alert('Sucesso', 'Pedido publicado com sucesso! Os profissionais poderão enviar propostas.', [
        { text: 'OK', onPress: () => router.replace('/(tabs)') }
      ]);
    } catch (error: any) {
      Alert.alert('Erro', error.response?.data?.detail || 'Erro ao publicar pedido');
    } finally {
      setIsLoading(false);
    }
  };

  const getCategoryName = (categoryId: string): string => {
    const category = SERVICE_CATEGORIES.find(c => c.id === categoryId);
    return category?.name || categoryId;
  };

  const getUrgencyLabel = (urgencyId: string): string => {
    const urgency = URGENCY_LEVELS.find(u => u.id === urgencyId);
    return urgency?.name || urgencyId;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Cabeçalho */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Publicar Pedido</Text>
        </View>

        {/* Informação */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={24} color={COLORS.primary} />
          <Text style={styles.infoText}>
            Descreva o serviço que precisa e profissionais verificados enviarão propostas com os seus preços.
          </Text>
        </View>

        <View style={styles.form}>
          {/* Título */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Título do Pedido *</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Ex: Instalação eléctrica para escritório"
                placeholderTextColor={COLORS.textSecondary}
                value={formData.title}
                onChangeText={(text) => setFormData({ ...formData, title: text })}
              />
            </View>
          </View>

          {/* Descrição */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Descrição Detalhada *</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Descreva em detalhe o que precisa, incluindo medidas, quantidade, localização exacta, etc."
              placeholderTextColor={COLORS.textSecondary}
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              multiline
              numberOfLines={6}
            />
          </View>

          {/* Categoria */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Categoria *</Text>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => setShowCategoryModal(true)}
            >
              <Ionicons name="grid" size={20} color={COLORS.textSecondary} />
              <Text style={formData.category ? styles.selectText : styles.selectPlaceholder}>
                {formData.category ? getCategoryName(formData.category) : 'Seleccione a categoria'}
              </Text>
              <Ionicons name="chevron-down" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Província */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Província *</Text>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => setShowProvinceModal(true)}
            >
              <Ionicons name="location" size={20} color={COLORS.textSecondary} />
              <Text style={formData.province ? styles.selectText : styles.selectPlaceholder}>
                {formData.province || 'Seleccione a província'}
              </Text>
              <Ionicons name="chevron-down" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Cidade */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Cidade/Bairro *</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="location-outline" size={20} color={COLORS.textSecondary} />
              <TextInput
                style={styles.input}
                placeholder="Ex: Talatona, Morro Bento..."
                placeholderTextColor={COLORS.textSecondary}
                value={formData.city}
                onChangeText={(text) => setFormData({ ...formData, city: text })}
              />
            </View>
          </View>

          {/* Orçamento */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Orçamento Estimado (Kz)</Text>
            <View style={styles.budgetRow}>
              <View style={[styles.inputContainer, { flex: 1 }]}>
                <TextInput
                  style={styles.input}
                  placeholder="Mínimo"
                  placeholderTextColor={COLORS.textSecondary}
                  value={formData.budget_min}
                  onChangeText={(text) => setFormData({ ...formData, budget_min: text })}
                  keyboardType="numeric"
                />
              </View>
              <Text style={styles.budgetSeparator}>-</Text>
              <View style={[styles.inputContainer, { flex: 1 }]}>
                <TextInput
                  style={styles.input}
                  placeholder="Máximo"
                  placeholderTextColor={COLORS.textSecondary}
                  value={formData.budget_max}
                  onChangeText={(text) => setFormData({ ...formData, budget_max: text })}
                  keyboardType="numeric"
                />
              </View>
            </View>
            <Text style={styles.helperText}>Deixe em branco se preferir "A combinar"</Text>
          </View>

          {/* Urgência */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Urgência</Text>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => setShowUrgencyModal(true)}
            >
              <Ionicons name="time" size={20} color={COLORS.textSecondary} />
              <Text style={styles.selectText}>{getUrgencyLabel(formData.urgency)}</Text>
              <Ionicons name="chevron-down" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Prazo */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Prazo Desejado</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="calendar-outline" size={20} color={COLORS.textSecondary} />
              <TextInput
                style={styles.input}
                placeholder="Ex: Próxima semana, até dia 15..."
                placeholderTextColor={COLORS.textSecondary}
                value={formData.deadline}
                onChangeText={(text) => setFormData({ ...formData, deadline: text })}
              />
            </View>
          </View>

          {/* Botão de Submissão */}
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
                <Text style={styles.submitButtonText}>Publicar Pedido</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal de Categoria */}
      <Modal
        visible={showCategoryModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar Categoria</Text>
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
                    formData.category === category.id && styles.modalOptionActive,
                  ]}
                  onPress={() => {
                    setFormData({ ...formData, category: category.id });
                    setShowCategoryModal(false);
                  }}
                >
                  <Ionicons
                    name={category.icon as any}
                    size={20}
                    color={formData.category === category.id ? '#000' : COLORS.text}
                  />
                  <Text
                    style={[
                      styles.modalOptionText,
                      formData.category === category.id && styles.modalOptionTextActive,
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

      {/* Modal de Província */}
      <Modal
        visible={showProvinceModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowProvinceModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar Província</Text>
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

      {/* Modal de Urgência */}
      <Modal
        visible={showUrgencyModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowUrgencyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '40%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nível de Urgência</Text>
              <TouchableOpacity onPress={() => setShowUrgencyModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {URGENCY_LEVELS.map((urgency) => (
                <TouchableOpacity
                  key={urgency.id}
                  style={[
                    styles.modalOption,
                    formData.urgency === urgency.id && styles.modalOptionActive,
                  ]}
                  onPress={() => {
                    setFormData({ ...formData, urgency: urgency.id });
                    setShowUrgencyModal(false);
                  }}
                >
                  <View style={[styles.urgencyDot, { backgroundColor: urgency.color }]} />
                  <Text
                    style={[
                      styles.modalOptionText,
                      formData.urgency === urgency.id && styles.modalOptionTextActive,
                    ]}
                  >
                    {urgency.name}
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
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: `${COLORS.primary}15`,
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 12,
    gap: 12,
    marginBottom: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
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
    minHeight: 140,
    textAlignVertical: 'top',
  },
  selectButton: {
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
  selectText: {
    flex: 1,
    color: COLORS.text,
    fontSize: 16,
  },
  selectPlaceholder: {
    flex: 1,
    color: COLORS.textSecondary,
    fontSize: 16,
  },
  budgetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  budgetSeparator: {
    color: COLORS.textSecondary,
    fontSize: 16,
  },
  helperText: {
    fontSize: 12,
    color: COLORS.textSecondary,
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
  urgencyDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
});
