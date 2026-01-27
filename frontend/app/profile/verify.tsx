import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { COLORS } from '../../src/constants/data';
import { useAuth } from '../../src/context/AuthContext';
import api from '../../src/services/api';

export default function VerifyProfileScreen() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [photo, setPhoto] = useState<string | null>(user?.photo || null);
  const [biPhoto, setBiPhoto] = useState<string | null>(null);

  const pickImage = async (type: 'photo' | 'bi') => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (!permissionResult.granted) {
      Alert.alert('Permissão necessária', 'Precisa dar permissão para aceder às fotos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: type === 'photo' ? [1, 1] : [4, 3],
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
      if (type === 'photo') {
        setPhoto(base64Image);
      } else {
        setBiPhoto(base64Image);
      }
    }
  };

  const takePhoto = async (type: 'photo' | 'bi') => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (!permissionResult.granted) {
      Alert.alert('Permissão necessária', 'Precisa dar permissão para usar a câmara');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: type === 'photo' ? [1, 1] : [4, 3],
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
      if (type === 'photo') {
        setPhoto(base64Image);
      } else {
        setBiPhoto(base64Image);
      }
    }
  };

  const showImageOptions = (type: 'photo' | 'bi') => {
    Alert.alert(
      type === 'photo' ? 'Foto de Perfil' : 'Foto do BI',
      'Como deseja adicionar a imagem?',
      [
        { text: 'Câmara', onPress: () => takePhoto(type) },
        { text: 'Galeria', onPress: () => pickImage(type) },
        { text: 'Cancelar', style: 'cancel' },
      ]
    );
  };

  const handleSubmit = async () => {
    if (!photo || !biPhoto) {
      Alert.alert('Erro', 'Adicione a foto de perfil e a foto do BI');
      return;
    }

    setIsLoading(true);
    try {
      await api.post('/users/upload-verification', {
        photo: photo,
        bi_photo: biPhoto,
      });

      await refreshUser();
      Alert.alert(
        'Documentos Enviados',
        'Os seus documentos foram enviados para verificação. Receberá uma notificação quando forem analisados.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error: any) {
      Alert.alert('Erro', error.response?.data?.detail || 'Erro ao enviar documentos');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Cabeçalho */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Verificar Perfil</Text>
        </View>

        {/* Explicação */}
        <View style={styles.infoSection}>
          <View style={styles.infoIcon}>
            <Ionicons name="shield-checkmark" size={40} color={COLORS.primary} />
          </View>
          <Text style={styles.infoTitle}>Ganhe o Selo de Confiança</Text>
          <Text style={styles.infoText}>
            Utilizadores verificados têm mais visibilidade e transmitem mais confiança. 
            A verificação é gratuita e protege todos na plataforma.
          </Text>
        </View>

        {/* Foto de Perfil */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Foto de Perfil</Text>
          <Text style={styles.sectionSubtitle}>Uma foto clara do seu rosto</Text>
          
          <TouchableOpacity
            style={styles.imageUploadBox}
            onPress={() => showImageOptions('photo')}
          >
            {photo ? (
              <Image source={{ uri: photo }} style={styles.uploadedImage} />
            ) : (
              <>
                <Ionicons name="camera" size={40} color={COLORS.textSecondary} />
                <Text style={styles.uploadText}>Toque para adicionar foto</Text>
              </>
            )}
            {photo && (
              <View style={styles.changePhotoOverlay}>
                <Ionicons name="camera" size={20} color="#FFF" />
                <Text style={styles.changePhotoText}>Alterar</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Foto do BI */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Foto do Bilhete de Identidade</Text>
          <Text style={styles.sectionSubtitle}>
            Foto da frente do seu BI onde se veja claramente o nome e foto
          </Text>
          
          <TouchableOpacity
            style={[styles.imageUploadBox, styles.biImageBox]}
            onPress={() => showImageOptions('bi')}
          >
            {biPhoto ? (
              <Image source={{ uri: biPhoto }} style={styles.uploadedBiImage} />
            ) : (
              <>
                <Ionicons name="card" size={40} color={COLORS.textSecondary} />
                <Text style={styles.uploadText}>Toque para adicionar foto do BI</Text>
              </>
            )}
            {biPhoto && (
              <View style={styles.changePhotoOverlay}>
                <Ionicons name="camera" size={20} color="#FFF" />
                <Text style={styles.changePhotoText}>Alterar</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Nota de privacidade */}
        <View style={styles.privacyNote}>
          <Ionicons name="lock-closed" size={16} color={COLORS.textSecondary} />
          <Text style={styles.privacyText}>
            Os seus documentos são encriptados e utilizados apenas para verificação. 
            Nunca serão partilhados com terceiros.
          </Text>
        </View>

        {/* Botão de submissão */}
        <TouchableOpacity
          style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#000" />
          ) : (
            <>
              <Ionicons name="shield-checkmark" size={20} color="#000" />
              <Text style={styles.submitButtonText}>Enviar para Verificação</Text>
            </>
          )}
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
  infoSection: {
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 24,
  },
  infoIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${COLORS.primary}20`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 16,
  },
  imageUploadBox: {
    width: '100%',
    height: 200,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  biImageBox: {
    height: 180,
  },
  uploadedImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  uploadedBiImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  uploadText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 8,
  },
  changePhotoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 8,
  },
  changePhotoText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '500',
  },
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.surface,
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  privacyText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    marginHorizontal: 20,
    marginTop: 24,
    height: 56,
    borderRadius: 12,
    gap: 8,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  bottomPadding: {
    height: 40,
  },
});
