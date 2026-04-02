import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';

interface Props {
  highlightPart?: string;
}

export function WasherViewer({ highlightPart = 'Drum Bearing' }: Props) {
  const [html, setHtml] = useState<string | null>(null);
  const [status, setStatus] = useState('Loading model...');

  useEffect(() => {
    const load = async () => {
      try {
        setStatus('Loading asset...');
        const asset = Asset.fromModule(require('../../assets/models/washer.glb'));
        await asset.downloadAsync();
        setStatus('Reading file...');

        const base64 = await FileSystem.readAsStringAsync(asset.localUri!, {
          encoding: FileSystem.EncodingType.Base64,
        });

        setStatus('Building viewer...');
        const dataUri = `data:model/gltf-binary;base64,${base64}`;

        const htmlContent = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <script type="module" src="https://ajax.googleapis.com/ajax/libs/model-viewer/3.4.0/model-viewer.min.js"></script>
              <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body {
                  background: #1a2235;
                  width: 100vw;
                  height: 100vh;
                  overflow: hidden;
                }
                model-viewer {
                  width: 100%;
                  height: 100%;
                  background-color: #1a2235;
                }
                .label {
                  position: absolute;
                  top: 12px;
                  left: 12px;
                  background: rgba(255,71,87,0.9);
                  color: white;
                  padding: 6px 12px;
                  border-radius: 8px;
                  font-family: sans-serif;
                  font-size: 13px;
                  font-weight: 600;
                  pointer-events: none;
                }
              </style>
            </head>
            <body>
              <model-viewer
                src="${dataUri}"
                auto-rotate
                camera-controls
                rotation-per-second="30deg"
                shadow-intensity="1"
                exposure="1"
                camera-orbit="0deg 75deg 2.5m"
              ></model-viewer>
              <div class="label">⚠ ${highlightPart}</div>
            </body>
          </html>
        `;

        setHtml(htmlContent);
      } catch (e: any) {
        setStatus(`Error: ${e.message}`);
        console.error(e);
      }
    };
    load();
  }, []);

  if (!html) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>{status}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WebView
        source={{ html }}
        style={styles.webview}
        scrollEnabled={false}
        originWhitelist={['*']}
        mixedContentMode="always"
        javaScriptEnabled={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a2235' },
  webview: { flex: 1 },
  loading: {
    flex: 1,
    backgroundColor: '#1a2235',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 14,
  },
});