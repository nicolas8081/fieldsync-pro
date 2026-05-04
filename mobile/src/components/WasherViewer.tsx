import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { Asset } from 'expo-asset';

interface Props {
  highlightPart?: string;
  modelUrl?: string | null;
  affectedParts?: string;
}

const PART_TO_ZONE: Record<string, string> = {
  control_board: 'control', control_panel: 'control', display_board: 'control',
  button_panel: 'control', timer: 'control', buzzer: 'control',
  timer_display: 'control', timer_circuit: 'control', thermal_fuse: 'control',
  wiring_harness: 'control', wiring: 'control', power_cord: 'control',
  ui_board: 'control', ribbon_cable: 'control', sensors: 'control',
  temperature_sensor: 'control', thermistor: 'control',
  pressure_switch: 'control', water_level_sensor: 'control',

  door_seal: 'door', door_lock: 'door', door_latch: 'door',
  door_glass: 'door', door_hinge: 'door', door_handle: 'door',
  door_boot: 'door', door_gasket: 'door', door_assembly: 'door',
  door_spring: 'door', door_strike: 'door', lock_actuator: 'door',
  manual_release: 'door', emergency_release: 'door', gasket: 'door',
  strike_plate: 'door', handle_assembly: 'door', hinge_mount: 'door',
  door_front: 'door',

  drum: 'drum', drum_bearing: 'drum', drum_paddle: 'drum',
  drum_spider: 'drum', drive_belt: 'drum', motor: 'drum',
  agitator: 'drum', motor_pulley: 'drum', belt_tensioner: 'drum',
  idler_pulley: 'drum', motor_bearing: 'drum', motor_coupling: 'drum',
  transmission: 'drum', capacitor: 'drum', drum_light: 'drum',
  drum_baffle: 'drum', agitator_dogs: 'drum',

  detergent_dispenser: 'dispenser', fabric_softener_dispenser: 'dispenser',
  dispenser_siphon: 'dispenser', dispenser_housing: 'dispenser',
  inlet_valve: 'dispenser', inlet_hose: 'dispenser', inlet_hoses: 'dispenser',
  water_inlet_valve: 'dispenser', inlet_screen: 'dispenser',
  inlet_valve_screen: 'dispenser', hose_washers: 'dispenser',
  air_tube: 'dispenser', heating_element: 'dispenser',

  drain_pump: 'drain', drain_hose: 'drain', tub_seal: 'drain',
  pump_filter: 'drain', pump_mount: 'drain', coin_trap: 'drain',
  standpipe: 'drain', hose_clamps: 'drain', internal_hoses: 'drain',
  seals: 'drain', valves: 'drain', hoses: 'drain',
  dispenser_drain: 'drain', cabinet_drain: 'drain',

  shock_absorber: 'suspension', shock_absorbers: 'suspension',
  leveling_feet: 'suspension', suspension: 'suspension',
  suspension_springs: 'suspension', suspension_rods: 'suspension',
  counterweight: 'suspension', shipping_bolts: 'suspension',
  cabinet: 'suspension', cabinet_panels: 'suspension', pulley: 'suspension',
};

function getActiveZones(affectedParts?: string): Set<string> {
  if (!affectedParts) return new Set();
  const parts = affectedParts.split('|').map((p) => p.trim().toLowerCase());
  const zones = new Set<string>();
  parts.forEach((part) => {
    const zone = PART_TO_ZONE[part];
    if (zone) zones.add(zone);
  });
  return zones;
}

function isRemoteModelUrl(url: string | undefined | null): url is string {
  if (!url || typeof url !== 'string') return false;
  const u = url.trim().toLowerCase();
  return u.startsWith('https://') || u.startsWith('http://');
}

async function resolveModelSrc(remoteUrl?: string | null): Promise<string> {
  if (isRemoteModelUrl(remoteUrl)) return remoteUrl.trim();
  const asset = Asset.fromModule(require('../../assets/models/washer.glb'));
  await asset.downloadAsync();
  if (Platform.OS === 'web') {
    let uri = asset.uri;
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

function htmlAttrUrl(url: string): string {
  return url.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

function buildHtml(modelSrc: string, activeZones: Set<string>): string {
  const zoneLabels: Record<string, string> = {
    control: 'Control Panel',
    door: 'Door / Lock',
    drum: 'Drum / Motor',
    dispenser: 'Dispenser / Inlet',
    drain: 'Drain / Pump',
    suspension: 'Suspension',
  };

  const activeList = Array.from(activeZones).map((z) => zoneLabels[z] ?? z).join(' · ');
  const remoteAttrs = /^https?:\/\//i.test(modelSrc) ? ' crossorigin="anonymous"' : '';
  const safeSrc = htmlAttrUrl(modelSrc);

  const controlOverlay = activeZones.has('control') ? `
  <div class="zone-dot" style="top:10%;left:70%"></div>
  <div class="zone-pill" style="top:7%;left:52%">⚡ Control Panel</div>
` : '';

const doorOverlay = activeZones.has('door') ? `
  <div class="zone-dot" style="top:42%;left:48%"></div>
  <div class="zone-pill" style="top:38%;left:30%">🚪 Door / Lock</div>
` : '';

const drumOverlay = activeZones.has('drum') ? `
  <div class="zone-dot" style="top:48%;left:52%"></div>
  <div class="zone-pill" style="top:54%;left:34%">⚙️ Drum / Motor</div>
` : '';

const dispenserOverlay = activeZones.has('dispenser') ? `
  <div class="zone-dot" style="top:18%;left:20%"></div>
  <div class="zone-pill" style="top:14%;left:22%">🧴 Dispenser</div>
` : '';

const drainOverlay = activeZones.has('drain') ? `
  <div class="zone-dot" style="bottom:28%;left:45%"></div>
  <div class="zone-pill" style="bottom:32%;left:28%">💧 Drain / Pump</div>
` : '';

const suspensionOverlay = activeZones.has('suspension') ? `
  <div class="zone-dot" style="top:65%;left:22%"></div>
  <div class="zone-pill" style="top:70%;left:24%">🔩 Suspension</div>
` : '';

 
  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script type="module" src="https://ajax.googleapis.com/ajax/libs/model-viewer/3.4.0/model-viewer.min.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #111827; width: 100vw; height: 100vh; overflow: hidden; }
    .viewer-wrap { position: relative; width: 100%; height: 100%; }
    model-viewer { width: 100%; height: 100%; background-color: #111827; }
    .overlay { position: absolute; top: 0; left: 0; right: 0; bottom: 0; pointer-events: none; }
    .zone-pill {
      position: absolute;
      background: rgba(255,71,87,0.92);
      color: white;
      font-family: sans-serif;
      font-size: 12px;
      font-weight: 700;
      padding: 5px 12px;
      border-radius: 20px;
      white-space: nowrap;
      animation: pulse 1.5s ease-in-out infinite;
    }
    .zone-dot {
      position: absolute;
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: #ff4757;
      border: 2.5px solid white;
      animation: pulse 1.5s ease-in-out infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.55; transform: scale(0.88); }
    }
    .affected-bar {
      position: absolute;
      bottom: 10px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0,0,0,0.75);
      color: #ff4757;
      font-family: sans-serif;
      font-size: 12px;
      font-weight: 700;
      padding: 6px 16px;
      border-radius: 20px;
      white-space: nowrap;
    }
  </style>
</head>
<body>
  <div class="viewer-wrap">
    <model-viewer
  src="${safeSrc}"${remoteAttrs}
  shadow-intensity="1"
  exposure="1"
  camera-orbit="0deg 75deg 4m"
></model-viewer>
    <div class="overlay">
      ${controlOverlay}
      ${doorOverlay}
      ${drumOverlay}
      ${dispenserOverlay}
      ${drainOverlay}
      ${suspensionOverlay}
    </div>
   
  </div>
</body>
</html>`;
}

export function WasherViewer({ highlightPart = 'Drum Bearing', modelUrl = null, affectedParts }: Props) {
  const [html, setHtml] = useState<string | null>(null);
  const [status, setStatus] = useState('Loading model...');

  useEffect(() => {
  const load = async () => {
    try {
      setHtml(null);
      setStatus('Loading model...');
      console.log('=== affectedParts received:', affectedParts);
      const modelSrc = await resolveModelSrc(modelUrl);
      const activeZones = getActiveZones(affectedParts);
      console.log('=== activeZones:', Array.from(activeZones));
      setHtml(buildHtml(modelSrc, activeZones));
    } catch (e: any) {
      setStatus(`Error: ${e.message}`);
      console.error(e);
    }
  };
  load();
}, [modelUrl, highlightPart, affectedParts]);

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
  container: { flex: 1, backgroundColor: '#111827' },
  webview: { flex: 1 },
  loading: {
    flex: 1,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: { color: '#fff', fontSize: 14 },
});