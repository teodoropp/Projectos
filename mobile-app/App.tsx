import React from 'react';
import { StatusBar } from 'expo-status-bar';
import './global.css';
import { NavegadorApp } from './src/navigation/NavegadorApp';

export default function App() {
  return (
    <>
      <StatusBar style="dark" />
      <NavegadorApp />
    </>
  );
}
