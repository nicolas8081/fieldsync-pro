import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { Asset } from 'expo-asset';

interface Props {
  highlightPart?: string;
  /**
   * Optional hosted GLB/GLTF (https). If missing or not http(s), the bundled team asset
   * (`assets/models/washer.glb`) is used so the model always loads in the demo app.
   */
  modelUrl?: string | null;
}

function isRemoteModelUrl(url: string | undefined | null): url is string {
  if (!url || typeof url !== 'string') return false;
  const u = url.trim().toLowerCase();
  return u.startsWith('https://') || u.startsWith('http://');
}

/** GLB source for model-viewer: remote URL as-is; else bundled asset (web URI or native base64 data URI). */
async function resolveModelSrc(remoteUrl?: string | null): Promise<string> {
  if (isRemoteModelUrl(remoteUrl)) {
    return remoteUrl.trim();
  }

  const asset = Asset.fromModule(require('../../assets/models/washer.glb'));
  await asset.downloadAsync();

  if (Platform.OS === 'web') {
    let uri = asset.uri;
    if (!uri) {
      throw new Error('Could not resolve model URL on web');
    }
    if (typeof window !== 'undefined' && uri.startsWith('/')) {
      uri = new URL(uri, window.location.origin).href;
    }
    return uri;
  }

  const FileSystem = await import('expo-file-system/legacy');
  const base64 = await FileSystem.readAsStringAsync(asset.localUri!, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return `data:model/gltf-binary;base64,${base64}`;
}

/** Safe for double-quoted HTML attribute (model src). */
function htmlAttrUrl(url: string): string {
  return url.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

function escapeHtmlText(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function WasherViewer({ highlightPart = 'Drum Bearing', modelUrl = null }: Props) {
  const [html, setHtml] = useState<string | null>(null);
  const [status, setStatus] = useState('Loading model...');

  useEffect(() => {
    const load = async () => {
      try {
        setHtml(null);
        setStatus(isRemoteModelUrl(modelUrl) ? 'Loading remote model...' : 'Loading team model...');

        const modelSrc = await resolveModelSrc(modelUrl);

        setStatus('Building viewer...');
        const safeSrc = htmlAttrUrl(modelSrc);
        const remoteAttrs = /^https?:\/\//i.test(modelSrc) ? '\n                crossorigin="anonymous"' : '';

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
                src="${safeSrc}"${remoteAttrs}
                auto-rotate
                camera-controls
                rotation-per-second="30deg"
                shadow-intensity="1"
                exposure="1"
                camera-orbit="0deg 75deg 2.5m"
              ></model-viewer>
              <div class="label">⚠ ${escapeHtmlText(highlightPart)}</div>
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
  }, [modelUrl, highlightPart]);

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