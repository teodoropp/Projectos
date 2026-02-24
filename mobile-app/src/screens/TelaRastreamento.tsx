import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { obterRastreamentoAtual, subscreverRastreamento } from '../services/servicoEntrega';
import { RastreamentoEntrega } from '../types';

const ID_PEDIDO_DEMO = 'pedido-demo-1';

export function TelaRastreamento() {
  const [rastreamento, setRastreamento] = useState<RastreamentoEntrega | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let montado = true;

    obterRastreamentoAtual(ID_PEDIDO_DEMO).then((dados) => {
      if (montado) {
        setRastreamento(dados);
        setCarregando(false);
      }
    });

    const canal = subscreverRastreamento(ID_PEDIDO_DEMO, setRastreamento);

    return () => {
      montado = false;
      canal.unsubscribe();
    };
  }, []);

  const htmlMapa = useMemo(() => {
    const latitudeMotoqueiro = rastreamento?.latitude_motoqueiro ?? -8.8383;
    const longitudeMotoqueiro = rastreamento?.longitude_motoqueiro ?? 13.2344;
    const latitudeCliente = rastreamento?.latitude_cliente ?? -8.82;
    const longitudeCliente = rastreamento?.longitude_cliente ?? 13.24;
    const chaveHere = process.env.EXPO_PUBLIC_HERE_API_KEY ?? '';

    return `<!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <script src="https://js.api.here.com/v3/3.1/mapsjs-core.js"></script>
        <script src="https://js.api.here.com/v3/3.1/mapsjs-service.js"></script>
        <script src="https://js.api.here.com/v3/3.1/mapsjs-ui.js"></script>
        <link rel="stylesheet" href="https://js.api.here.com/v3/3.1/mapsjs-ui.css" />
        <style>html,body,#mapa{margin:0;padding:0;height:100%;}</style>
      </head>
      <body>
        <div id="mapa"></div>
        <script>
          var plataforma = new H.service.Platform({ apikey: '${chaveHere}' });
          var camadas = plataforma.createDefaultLayers();
          var mapa = new H.Map(document.getElementById('mapa'), camadas.vector.normal.map, {
            center: { lat: ${latitudeMotoqueiro}, lng: ${longitudeMotoqueiro} },
            zoom: 13
          });
          var marcadorMotoqueiro = new H.map.Marker({ lat: ${latitudeMotoqueiro}, lng: ${longitudeMotoqueiro} });
          var marcadorCliente = new H.map.Marker({ lat: ${latitudeCliente}, lng: ${longitudeCliente} });
          mapa.addObjects([marcadorMotoqueiro, marcadorCliente]);
        </script>
      </body>
      </html>`;
  }, [rastreamento]);

  if (carregando) {
    return (
      <View style={estilos.loader}>
        <ActivityIndicator size="large" />
        <Text>A carregar rastreamento...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={estilos.container}>
      <Text style={estilos.title}>Acompanhar Entrega</Text>
      <WebView originWhitelist={['*']} source={{ html: htmlMapa }} style={estilos.map} />
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: '700', margin: 16 },
  map: { flex: 1 },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 }
});
