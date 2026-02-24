import React from 'react';
import { Image, SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const categorias = [
  { nome: 'Restaurantes', emoji: '🍔', cor: 'bg-amber-500' },
  { nome: 'Mercado', emoji: '🛒', cor: 'bg-lime-500' },
  { nome: 'Farmácia', emoji: '💊', cor: 'bg-red-500' },
  { nome: 'Bebidas', emoji: '🍷', cor: 'bg-violet-500' },
  { nome: 'Lanches', emoji: '🥪', cor: 'bg-orange-500' },
  { nome: 'Doces', emoji: '🧁', cor: 'bg-pink-500' },
  { nome: 'Pet Shop', emoji: '🐾', cor: 'bg-sky-500' },
  { nome: 'Envios', emoji: '📦', cor: 'bg-yellow-500' }
];

const maisPedidos = [
  {
    nome: 'Pizza Hot',
    tempo: '30-40 min',
    taxa: 'A partir de R$ 14,90',
    imagem:
      'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=800&auto=format&fit=crop'
  },
  {
    nome: 'Empório Express',
    tempo: '20-30 min',
    taxa: 'Entrega rápida',
    imagem:
      'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=800&auto=format&fit=crop'
  }
];

export function TelaReservasCliente() {
  return (
    <SafeAreaView className="flex-1 bg-fundo">
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
        <View className="flex-row items-center justify-between">
          <Text className="text-3xl font-bold text-slate-800">Olá, João!</Text>
          <TouchableOpacity className="h-10 w-10 items-center justify-center rounded-full bg-white">
            <Ionicons name="notifications" size={20} color="#334155" />
            <View className="absolute right-1 top-1 h-4 w-4 items-center justify-center rounded-full bg-red-500">
              <Text className="text-[10px] font-bold text-white">2</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View className="mt-3 self-start rounded-full bg-white px-4 py-2">
          <Text className="text-xs font-semibold text-slate-600">📍 Minha Localização</Text>
        </View>

        <View className="mt-4 flex-row items-center rounded-2xl bg-white px-4 py-1">
          <TextInput placeholder="O que você precisa hoje?" className="flex-1 py-3 text-slate-700" placeholderTextColor="#94A3B8" />
          <Ionicons name="search" size={22} color="#0B5ED7" />
        </View>

        <View className="mt-4 flex-row flex-wrap justify-between">
          {categorias.map((categoria) => (
            <TouchableOpacity key={categoria.nome} className="mb-3 w-[23%] items-center rounded-2xl bg-white p-2">
              <View className={`h-12 w-12 items-center justify-center rounded-xl ${categoria.cor}`}>
                <Text className="text-2xl">{categoria.emoji}</Text>
              </View>
              <Text className="mt-2 text-center text-xs font-semibold text-slate-700">{categoria.nome}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View className="mt-2 overflow-hidden rounded-2xl bg-orange-500 p-4">
          <Text className="text-2xl font-extrabold text-white">Ofertas do Dia</Text>
          <Text className="text-xs text-orange-100">Promoções Especiais para Você</Text>
          <TouchableOpacity className="mt-3 w-28 rounded-xl bg-white px-3 py-2">
            <Text className="font-bold text-orange-600">Ver Ofertas</Text>
          </TouchableOpacity>
        </View>

        <Text className="mt-6 text-2xl font-bold text-slate-800">Mais Pedidos</Text>
        <View className="mt-3 flex-row justify-between">
          {maisPedidos.map((item) => (
            <View key={item.nome} className="w-[48%] overflow-hidden rounded-2xl bg-white">
              <Image source={{ uri: item.imagem }} className="h-28 w-full" />
              <View className="p-3">
                <Text className="text-base font-bold text-slate-800">{item.nome}</Text>
                <Text className="mt-1 text-xs text-slate-500">{item.tempo}</Text>
                <Text className="text-xs font-semibold text-red-500">{item.taxa}</Text>
              </View>
            </View>
          ))}
        </View>

        <View className="mt-4 flex-row items-center justify-center">
          <MaterialCommunityIcons name="circle" size={9} color="#0B5ED7" />
          <MaterialCommunityIcons name="circle" size={9} color="#CBD5E1" style={{ marginLeft: 6 }} />
          <MaterialCommunityIcons name="circle" size={9} color="#CBD5E1" style={{ marginLeft: 6 }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
