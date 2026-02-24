import React, { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { criarReserva, listarProdutos } from '../services/marketplaceService';
import { Produto } from '../types';

const ID_CLIENTE_DEMO = '00000000-0000-0000-0000-000000000001';

export function CustomerHomeScreen() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [quantidade, setQuantidade] = useState('1');

  const carregarProdutos = useCallback(async () => {
    setCarregando(true);
    const itens = await listarProdutos();
    setProdutos(itens);
    setCarregando(false);
  }, []);

  useEffect(() => {
    carregarProdutos();
  }, [carregarProdutos]);

  const reservar = async (idProduto: string) => {
    const quantidadeConvertida = Number(quantidade);

    if (!Number.isInteger(quantidadeConvertida) || quantidadeConvertida <= 0) {
      Alert.alert('Quantidade inválida', 'Insere um número inteiro maior que 0.');
      return;
    }

    const resposta = await criarReserva({
      id_cliente: ID_CLIENTE_DEMO,
      id_produto: idProduto,
      quantidade: quantidadeConvertida
    });

    Alert.alert(resposta.sucesso ? 'Sucesso' : 'Erro', resposta.mensagem);
  };

  return (
    <SafeAreaView style={estilos.container}>
      <Text style={estilos.title}>Reservar Produtos</Text>
      <TextInput
        value={quantidade}
        onChangeText={setQuantidade}
        keyboardType="number-pad"
        style={estilos.input}
        placeholder="Quantidade padrão para reserva"
      />

      {carregando ? (
        <Text>A carregar produtos...</Text>
      ) : (
        <FlatList
          data={produtos}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={<Text>Nenhum produto encontrado. Adiciona produtos no Supabase.</Text>}
          renderItem={({ item }) => (
            <View style={estilos.card}>
              <Text style={estilos.name}>{item.nome}</Text>
              <Text style={estilos.price}>{item.preco} Kz</Text>
              <Text style={estilos.stock}>Estoque: {item.estoque}</Text>
              <TouchableOpacity onPress={() => reservar(item.id)} style={estilos.button}>
                <Text style={estilos.buttonText}>Reservar</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f6f7fb' },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 12 },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#dbe1ee',
    padding: 10,
    marginBottom: 12
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10
  },
  name: { fontSize: 16, fontWeight: '600' },
  price: { marginTop: 4, color: '#60656f' },
  stock: { marginTop: 2, color: '#60656f' },
  button: {
    marginTop: 10,
    backgroundColor: '#0077ff',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center'
  },
  buttonText: { color: '#fff', fontWeight: '700' }
});
