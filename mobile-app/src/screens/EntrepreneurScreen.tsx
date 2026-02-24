import React, { useState } from 'react';
import { Alert, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { criarNegocio } from '../services/marketplaceService';

const ID_DONO_DEMO = '00000000-0000-0000-0000-000000000002';

export function EntrepreneurScreen() {
  const [nome, setNome] = useState('');
  const [categoria, setCategoria] = useState('');
  const [porte, setPorte] = useState<'pequeno' | 'medio' | 'grande'>('pequeno');

  const submeter = async () => {
    if (!nome.trim() || !categoria.trim()) {
      Alert.alert('Campos obrigatórios', 'Preenche o nome do negócio e a categoria.');
      return;
    }

    const resposta = await criarNegocio({
      id_dono: ID_DONO_DEMO,
      nome,
      categoria,
      tipo_porte: porte,
      taxa_comissao: 10
    });

    Alert.alert(resposta.sucesso ? 'Sucesso' : 'Erro', resposta.mensagem);

    if (resposta.sucesso) {
      setNome('');
      setCategoria('');
      setPorte('pequeno');
    }
  };

  return (
    <SafeAreaView style={estilos.container}>
      <Text style={estilos.title}>Cadastrar Negócio Parceiro</Text>
      <Text style={estilos.label}>Nome do negócio</Text>
      <TextInput placeholder="Ex: Gelados do Bairro" style={estilos.input} value={nome} onChangeText={setNome} />
      <Text style={estilos.label}>Categoria</Text>
      <TextInput placeholder="Ex: Gelados e bebidas" style={estilos.input} value={categoria} onChangeText={setCategoria} />

      <Text style={estilos.label}>Porte da loja</Text>
      <View style={estilos.linhaPorte}>
        {(['pequeno', 'medio', 'grande'] as const).map((item) => (
          <TouchableOpacity
            key={item}
            onPress={() => setPorte(item)}
            style={[estilos.chip, porte === item && estilos.chipAtivo]}
          >
            <Text style={[estilos.chipTexto, porte === item && estilos.chipTextoAtivo]}>{item}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={estilos.noteBox}>
        <Text style={estilos.note}>Comissão padrão da plataforma: 10% por pedido concluído.</Text>
      </View>
      <TouchableOpacity style={estilos.button} onPress={submeter}>
        <Text style={estilos.buttonText}>Cadastrar negócio</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f7fb', padding: 16 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 16 },
  label: { fontSize: 14, marginBottom: 6, color: '#3f4654' },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e3e7ef'
  },
  linhaPorte: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  chip: { backgroundColor: '#e9edf5', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8 },
  chipAtivo: { backgroundColor: '#0077ff' },
  chipTexto: { color: '#3f4654', textTransform: 'capitalize' },
  chipTextoAtivo: { color: '#fff' },
  noteBox: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#eef3ff',
    borderRadius: 10
  },
  note: { color: '#2f4588' },
  button: {
    marginTop: 14,
    backgroundColor: '#0077ff',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center'
  },
  buttonText: { color: '#fff', fontWeight: '700' }
});
