#!/usr/bin/env python3
"""Replace all floating top-right buttons with a single Apps menu button."""
import re

filepath = '/home/z/my-project/repos/Babftss/src/pages/BlockSimulator3Dv2.jsx'

with open(filepath, 'r') as f:
    content = f.read()

# Find the block of floating buttons (from first "top: 16, right:" button to the closing </div></div>) 
# that comes after the AI Helper v2 panel and before the final </div></div></div>

# Strategy: Find all button elements with "top: 16, right:" and replace them with a single Apps button + panel
# The panels (content) stay where they are - only buttons get consolidated

# Find the start: first button with top: 16, right: 1
lines = content.split('\n')
start_idx = None
end_idx = None
button_lines = []

for i, line in enumerate(lines):
    if "position: 'fixed', top: 16, right:" in line and '<button' in line:
        if start_idx is None:
            start_idx = i
        button_lines.append(i)
    
# Find the last button line + its closing
if button_lines:
    last_btn = button_lines[-1]
    # Find the closing of that button (either /> or </button>)
    for i in range(last_btn, min(last_btn + 5, len(lines))):
        if '</button>' in lines[i] or '/>' in lines[i]:
            end_idx = i
            break

if start_idx is None or end_idx is None:
    print("Could not find button block!")
    exit(1)

print(f"Found {len(button_lines)} floating buttons from line {start_idx+1} to {end_idx+1}")

# Build the Apps menu replacement
apps_menu = """        {/* CONSOLIDATED APPS MENU — all floating buttons in one scrollable panel */}
        <button
          onClick={() => setAppsMenuOpen(v => !v)}
          title="All Apps & Features"
          style={{
            position: 'fixed', top: 16, right: 60, zIndex: 250,
            width: 48, height: 48, borderRadius: 12,
            backgroundColor: appsMenuOpen ? '#3b82f6' : '#1e293b',
            border: '2px solid rgba(99,102,241,0.5)',
            color: '#fff', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(99,102,241,0.4)',
            fontSize: 22, transition: 'all 0.2s',
          }}
        >{appsMenuOpen ? '✕' : '⊞'}</button>
        {appsMenuOpen && (
          <div style={{
            position: 'fixed', top: 70, right: 16, width: 320, maxHeight: '85dvh',
            backgroundColor: 'rgba(14,20,32,0.98)',
            border: '1px solid rgba(99,102,241,0.5)',
            borderRadius: 12, backdropFilter: 'blur(12px)',
            boxShadow: '0 16px 48px rgba(0,0,0,0.5), 0 0 24px rgba(99,102,241,0.2)',
            zIndex: 300, display: 'flex', flexDirection: 'column', overflow: 'hidden',
          }}>
            <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(99,102,241,0.3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#6366f1', fontFamily: 'Orbitron, sans-serif' }}>⊞ All Features</span>
              <button onClick={() => setAppsMenuOpen(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 18 }}>×</button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
              {/* Each button opens its respective panel */}
              <button onClick={() => { setNnPanelOpen(v => !v); }} title="Neural Network Predictor" style={appsBtnStyle(nnPanelOpen, '#6366f1')}>🧠</button>
              <button onClick={() => { toggleHolographic(); }} title="Holographic Display" style={appsBtnStyle(holographicMode, '#06b6d4')}>🔮</button>
              <button onClick={() => { ensureAudioContext(); setDawPanelOpen(v => !v); }} title="Music DAW" style={appsBtnStyle(dawPanelOpen, '#f59e0b')}>🎵</button>
              <button onClick={() => { setClimatePanelOpen(v => !v); }} title="Climate Simulation" style={appsBtnStyle(climatePanelOpen, '#10b981')}>🌡</button>
              <button onClick={() => { setBlockchainPanelOpen(v => !v); }} title="Blockchain" style={appsBtnStyle(blockchainPanelOpen, '#fbbf24')}>⛓</button>
              <button onClick={() => { setDungeonPanelOpen(v => !v); }} title="AI Dungeon Master" style={appsBtnStyle(dungeonPanelOpen, '#7c3aed')}>🐉</button>
              <button onClick={() => { setFluidPanelOpen(v => !v); }} title="Fluid Dynamics" style={appsBtnStyle(fluidPanelOpen, '#0ea5e9')}>💧</button>
              <button onClick={() => { setSolarPanelOpen(v => !v); }} title="Solar System" style={appsBtnStyle(solarPanelOpen, '#fbbf24')}>🪐</button>
              <button onClick={() => { setDnaPanelOpen(v => !v); }} title="DNA Sequencer" style={appsBtnStyle(dnaPanelOpen, '#22c55e')}>🧬</button>
              <button onClick={() => { setTimeTravelPanelOpen(v => !v); }} title="Time Travel Debugger" style={appsBtnStyle(timeTravelPanelOpen, '#3b82f6')}>⏰</button>
              <button onClick={() => { setGalacticPanelOpen(v => !v); }} title="Galactic Structure" style={appsBtnStyle(galacticPanelOpen, '#4f46e5')}>🌌</button>
              <button onClick={() => { setCaPanelOpen(v => !v); }} title="Cellular Automata" style={appsBtnStyle(caPanelOpen, '#10b981')}>🟦</button>
              <button onClick={() => { setArtGalleryOpen(v => !v); }} title="AI Art Gallery" style={appsBtnStyle(artGalleryOpen, '#ec4899')}>🎨</button>
              <button onClick={() => { setPhysLabPanelOpen(v => !v); }} title="Physics Lab" style={appsBtnStyle(physLabPanelOpen, '#06b6d4')}>🔬</button>
              <button onClick={() => { setHfsPanelOpen(v => !v); }} title="Holographic File System" style={appsBtnStyle(hfsPanelOpen, '#f97316')}>📁</button>
              <button onClick={() => { setStorybookOpen(v => !v); }} title="AI Storybook" style={appsBtnStyle(storybookOpen, '#ec4899')}>📖</button>
              <button onClick={() => { setQuantumCompOpen(v => !v); }} title="Quantum Computing" style={appsBtnStyle(quantumCompOpen, '#a855f7')}>⚛</button>
              <button onClick={() => { setEcoPanelOpen(v => !v); }} title="Ecosystem Simulator" style={appsBtnStyle(ecoPanelOpen, '#22c55e')}>🌿</button>
              <button onClick={() => { if (!fountainPlaying) { ensureAudioContext(); startFountain(); } else { stopFountain(); } setFountainOpen(v => !v); }} title="Musical Fountain" style={appsBtnStyle(fountainPlaying, '#0ea5e9')}>⛲</button>
              <button onClick={() => { setArchCriticOpen(v => !v); if (!archCriticReport) runArchitectureCritic(); }} title="Architecture Critic" style={appsBtnStyle(archCriticOpen, '#f59e0b')}>🏛</button>
              <button onClick={() => { setWorldBuilderProOpen(v => !v); }} title="World Builder Pro" style={appsBtnStyle(worldBuilderProOpen, '#22c55e')}>🗺</button>
              <button onClick={() => { setFractalPanelOpen(v => !v); }} title="Fractal Explorer" style={appsBtnStyle(fractalPanelOpen, '#a855f7')}>🔺</button>
              <button onClick={() => { setChemLabOpen(v => !v); }} title="Chemistry Lab" style={appsBtnStyle(chemLabOpen, '#3b82f6')}>🧪</button>
              <button onClick={() => { setWeatherCtrlOpen(v => !v); }} title="Weather Control" style={appsBtnStyle(!!weatherEffect, '#0ea5e9')}>🌪</button>
              <button onClick={() => { setTimelapseOpen(v => !v); }} title="Time-Lapse Recorder" style={appsBtnStyle(timelapseRecording, '#ef4444')}>⏱</button>
              <button onClick={() => { setPerfPanelOpen(v => !v); }} title="Performance Monitor" style={appsBtnStyle(perfPanelOpen, '#22c55e')}>⚡</button>
              <button onClick={() => { setHelpPanelOpen(v => !v); }} title="Help & Docs" style={appsBtnStyle(helpPanelOpen, '#0891b2')}>❓</button>
              <button onClick={() => { setA11yPanelOpen(v => !v); }} title="Accessibility" style={appsBtnStyle(a11yPanelOpen, '#3b82f6')}>♿</button>
              <button onClick={() => { setPluginPanelOpen(v => !v); }} title="Plugin System" style={appsBtnStyle(pluginPanelOpen, '#8b5cf6')}>🔌</button>
              <button onClick={() => { setCodeReviewPanelOpen(v => !v); if (!codeReviewReport) runCodeReview(); }} title="AI Code Review" style={appsBtnStyle(codeReviewPanelOpen, '#10b981')}>🔍</button>
              <button onClick={() => { setCollabPanelOpen(v => !v); }} title="Collaboration" style={appsBtnStyle(collabConnected, '#22c55e')}>🔗</button>
              <button onClick={() => { setAssetStoreOpen(v => !v); if (!storeResults.length) searchAssetStore(); }} title="Asset Store" style={appsBtnStyle(assetStoreOpen, '#f97316')}>🏪</button>
              <button onClick={() => { setMlPanelOpen(v => !v); }} title="ML Auto-Complete" style={appsBtnStyle(mlPanelOpen, '#a855f7')}>🧠</button>
              <button onClick={() => { setArPanelOpen(v => !v); }} title="AR Mobile" style={appsBtnStyle(!!arMobileSession, '#06b6d4')}>📷</button>
              <button onClick={() => { setProcGenPanelOpen(v => !v); }} title="Procedural Gen" style={appsBtnStyle(procGenPanelOpen, '#84cc16')}>🌍</button>
              <button onClick={() => { setPhysicsPlaygroundOpen(v => !v); }} title="Physics Playground" style={appsBtnStyle(physicsPlaygroundOpen, '#0d9488')}>🎪</button>
              <button onClick={() => { setWhiteboardOpen(v => !v); }} title="Whiteboard" style={appsBtnStyle(whiteboardOpen, '#ef4444')}>✏</button>
              <button onClick={() => { setVcsPanelOpen(v => !v); }} title="Version Control" style={appsBtnStyle(vcsPanelOpen, '#f97316')}>📊</button>
              <button onClick={() => { setQuantumPanelOpen(v => !v); }} title="Quantum Blocks" style={appsBtnStyle(quantumPanelOpen, '#a855f7')}>⚛</button>
              <button onClick={() => { setSceneManagerOpen(v => !v); }} title="Scene Manager" style={appsBtnStyle(sceneManagerOpen, '#0891b2')}>💾</button>
              <button onClick={() => { setAssetMarketplaceOpen(v => !v); }} title="Asset Marketplace" style={appsBtnStyle(assetMarketplaceOpen, '#f97316')}>🛍</button>
              <button onClick={() => { setAdvancedPhysicsPanelOpen(v => !v); }} title="Advanced Physics" style={appsBtnStyle(advancedPhysicsPanelOpen, '#0d9488')}>⚛</button>
              <button onClick={() => { setRecordingPanelOpen(v => !v); }} title="Recording Studio" style={appsBtnStyle(recordingPanelOpen, '#dc2626')}>⏺</button>
              <button onClick={() => { setTemplatesPanelOpen(v => !v); }} title="Scene Templates" style={appsBtnStyle(templatesPanelOpen, '#8b5cf6')}>🗺</button>
              <button onClick={() => { setBlockShapePanelOpen(v => !v); }} title="Block Shapes" style={appsBtnStyle(blockShapePanelOpen, '#10b981')}>🧱</button>
              <button onClick={() => { setLightingPanelOpen(v => !v); }} title="Lighting Studio" style={appsBtnStyle(lightingPanelOpen, '#f59e0b')}>💡</button>
              <button onClick={() => { setParticleStudioOpen(v => !v); }} title="Particle Studio" style={appsBtnStyle(particleStudioOpen, '#ec4899')}>✨</button>
              <button onClick={() => { setGameModeOpen(v => !v); }} title="Game Mode" style={appsBtnStyle(gameModeOpen, '#22c55e')}>🎮</button>
              <button onClick={() => { setAudioPanelOpen(v => !v); }} title="Audio Studio" style={appsBtnStyle(audioPanelOpen, '#eab308')}>🔊</button>
              <button onClick={() => { setEnvStudioOpen(v => !v); }} title="Environment Studio" style={appsBtnStyle(envStudioOpen, '#0891b2')}>🌫</button>
              <button onClick={() => { setCharStudioOpen(v => !v); }} title="Character Studio" style={appsBtnStyle(charStudioOpen, '#9333ea')}>🧍</button>
              <button onClick={() => { setTerrainPanelOpen(v => !v); }} title="Terrain Editor" style={appsBtnStyle(terrainPanelOpen, '#65a30d')}>⛰</button>
              <button onClick={() => { setExportHubOpen(v => !v); }} title="Export & Share" style={appsBtnStyle(exportHubOpen, '#2563eb')}>📤</button>
              <button onClick={() => { setCloudPanelOpen(v => !v); }} title="Cloud Sync" style={appsBtnStyle(!!cloudUser, '#22c55e')}>☁</button>
              <button onClick={() => { setOnlinePanelOpen(v => !v); }} title="Online Multiplayer" style={appsBtnStyle(onlineRoomJoined, '#22c55e')}>🌐</button>
            </div>
            <div style={{ padding: '4px 12px', borderTop: '1px solid rgba(99,102,241,0.15)', fontSize: 8, color: '#64748b', textAlign: 'center' }}>Scroll for more • {50}+ features available</div>
          </div>
        )}"""

# Replace the button block
new_lines = lines[:start_idx] + [apps_menu] + lines[end_idx+1:]
new_content = '\n'.join(new_lines)

# Add appsMenuOpen state + appsBtnStyle helper before the component return
# Find a good place to add the state (after other useState declarations near the top of render)
state_inject = """
  // Consolidated Apps Menu state
  const [appsMenuOpen, setAppsMenuOpen] = useState(false);
  const appsBtnStyle = (active, color) => ({
    width: '100%', aspectRatio: '1', borderRadius: 10,
    background: active ? `rgba(${parseInt(color.slice(1,3),16)},${parseInt(color.slice(3,5),16)},${parseInt(color.slice(5,7),16)},0.2)` : 'rgba(15,23,42,0.6)',
    border: `1px solid ${active ? color + '99' : 'rgba(148,163,184,0.15)'}`,
    color: active ? color : '#94a3b8',
    fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'all 0.15s', fontFamily: 'Inter, sans-serif',
  });
"""

# Find where to inject — right before "return (" in the main component
# Look for the pattern: "  return (" that comes after all the hooks
return_match = re.search(r'\n  return \(\s*\n', new_content)
if return_match:
    insert_pos = return_match.start()
    new_content = new_content[:insert_pos] + '\n' + state_inject + '\n' + new_content[insert_pos:]
    print("Injected appsMenuOpen state + appsBtnStyle helper")
else:
    print("WARNING: Could not find return ( to inject state!")

with open(filepath, 'w') as f:
    f.write(new_content)

print(f"Done! Replaced {len(button_lines)} floating buttons with single Apps menu")
