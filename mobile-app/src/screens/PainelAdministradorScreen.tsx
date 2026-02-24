import React, { useEffect, useState } from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { obterResumoAdministrador } from '../services/marketplaceService';

export function PainelAdministradorScreen() {
  const [resumo, setResumo] = useState({ totalNegocios: 0, totalProdutos: 0, totalReservas: 0 });

  useEffect(() => {
    obterResumoAdministrador().then(setResumo);
  }, []);

  return (
    <SafeAreaView style={estilos.container}>
      <Text style={estilos.titulo}>Painel Administrativo</Text>
      <View style={estilos.card}>
        <Text style={estilos.item}>Negócios cadastrados: {resumo.totalNegocios}</Text>
        <Text style={estilos.item}>Produtos ativos: {resumo.totalProdutos}</Text>
        <Text style={estilos.item}>Reservas totais: {resumo.totalReservas}</Text>
      </View>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f7fb', padding: 16 },
  titulo: { fontSize: 24, fontWeight: '700', marginBottom: 16 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, gap: 8 },
  item: { fontSize: 16, color: '#273043' }
});
