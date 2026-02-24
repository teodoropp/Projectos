import React, { useEffect, useState } from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { obterResumoEmpreendedor } from '../services/marketplaceService';

const ID_DONO_DEMO = '00000000-0000-0000-0000-000000000002';

export function PainelEmpreendedorScreen() {
  const [resumo, setResumo] = useState({
    totalNegocios: 0,
    totalProdutos: 0,
    totalReservas: 0,
    negociosGrandePorte: 0
  });

  useEffect(() => {
    obterResumoEmpreendedor(ID_DONO_DEMO).then(setResumo);
  }, []);

  return (
    <SafeAreaView style={estilos.container}>
      <Text style={estilos.titulo}>Área do Empreendedor</Text>
      <View style={estilos.card}>
        <Text style={estilos.item}>Meus negócios: {resumo.totalNegocios}</Text>
        <Text style={estilos.item}>Produtos publicados: {resumo.totalProdutos}</Text>
        <Text style={estilos.item}>Reservas recebidas: {resumo.totalReservas}</Text>
      </View>

      {resumo.negociosGrandePorte > 0 ? (
        <View style={[estilos.card, estilos.cardParceiro]}>
          <Text style={estilos.subtitulo}>Painel Admin de Parceiro</Text>
          <Text style={estilos.item}>Lojas de grande porte: {resumo.negociosGrandePorte}</Text>
          <Text style={estilos.item}>Acesso liberado para gestão avançada de parceiro.</Text>
        </View>
      ) : (
        <View style={estilos.card}>
          <Text style={estilos.item}>Cria uma loja de grande porte para desbloquear o painel admin de parceiro.</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f7fb', padding: 16 },
  titulo: { fontSize: 24, fontWeight: '700', marginBottom: 16 },
  subtitulo: { fontSize: 18, fontWeight: '700', marginBottom: 10, color: '#1f3f75' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, gap: 8, marginBottom: 12 },
  cardParceiro: { backgroundColor: '#eaf2ff' },
  item: { fontSize: 16, color: '#273043' }
});
