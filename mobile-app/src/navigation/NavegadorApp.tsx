import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { TelaReservasCliente } from '../screens/TelaReservasCliente';
import { TelaEmpreendedor } from '../screens/TelaEmpreendedor';
import { TelaRastreamento } from '../screens/TelaRastreamento';
import { TelaPainelAdministrador } from '../screens/TelaPainelAdministrador';
import { TelaPainelEmpreendedor } from '../screens/TelaPainelEmpreendedor';

const Abas = createBottomTabNavigator();

const icones: Record<string, keyof typeof Ionicons.glyphMap> = {
  Início: 'home',
  Buscar: 'search',
  Pedidos: 'receipt',
  Favoritos: 'heart',
  Perfil: 'person'
};

export function NavegadorApp() {
  return (
    <NavigationContainer>
      <Abas.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: '#0B5ED7',
          tabBarInactiveTintColor: '#64748B',
          tabBarStyle: {
            height: 64,
            paddingBottom: 8,
            paddingTop: 6,
            borderTopWidth: 0,
            elevation: 8
          },
          tabBarIcon: ({ color, size }) => <Ionicons name={icones[route.name]} color={color} size={size} />
        })}
      >
        <Abas.Screen name="Início" component={TelaReservasCliente} />
        <Abas.Screen name="Buscar" component={TelaEmpreendedor} />
        <Abas.Screen name="Pedidos" component={TelaPainelEmpreendedor} />
        <Abas.Screen name="Favoritos" component={TelaRastreamento} />
        <Abas.Screen name="Perfil" component={TelaPainelAdministrador} />
      </Abas.Navigator>
    </NavigationContainer>
  );
}
