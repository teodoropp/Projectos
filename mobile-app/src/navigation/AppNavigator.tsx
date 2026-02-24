import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { CustomerHomeScreen } from '../screens/CustomerHomeScreen';
import { EntrepreneurScreen } from '../screens/EntrepreneurScreen';
import { TrackingScreen } from '../screens/TrackingScreen';
import { PainelAdministradorScreen } from '../screens/PainelAdministradorScreen';
import { PainelEmpreendedorScreen } from '../screens/PainelEmpreendedorScreen';

const Abas = createBottomTabNavigator();

export function AppNavigator() {
  return (
    <NavigationContainer>
      <Abas.Navigator screenOptions={{ headerShown: false }}>
        <Abas.Screen name="Reservas" component={CustomerHomeScreen} />
        <Abas.Screen name="Empreender" component={EntrepreneurScreen} />
        <Abas.Screen name="Painel" component={PainelEmpreendedorScreen} />
        <Abas.Screen name="Admin" component={PainelAdministradorScreen} />
        <Abas.Screen name="Entrega" component={TrackingScreen} />
      </Abas.Navigator>
    </NavigationContainer>
  );
}
