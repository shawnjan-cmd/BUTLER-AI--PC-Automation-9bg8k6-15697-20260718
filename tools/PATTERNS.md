# BUTLER AI — CODE PATTERNS REFERENCE
> Common patterns used throughout this codebase. Copy-paste ready.

---

## ── LAYOUT LAW — PERMANENT RULE (apply to ALL pages) ─────────────────────
> NEVER use single-column rows for stat cards, action buttons, script buttons, or badges.
> ALWAYS use 3-column grids (flexWrap + 1/3 width) for any set of 3+ similar items.
> ALWAYS fill the full phone width — items should nearly touch left and right edges (14px padding each side).
> Group related sections with a thin colored divider line + section label. Never jumble different types together.
> Section order: hero metric → live data (rings/bars) → actions (3-col grid) → details (2-col grid) → charts → journal/log
> REMOVE "HOW IT WORKS" explainer blocks — users do not need tutorials inside the app pages.
> COMBINE lone 1-item rows with adjacent rows — a single button never sits alone on its own row.
> Combine SIGMA-NET / Crawlers / KB cards into ONE compact inline strip, not giant separate cards.

```ts
// 3-column grid item width formula (standard):
const COL3_W = Math.floor((SW - 28 - 8 * 2) / 3); // 14px padding each side, 8px gap between 3 items
// 2-column grid item width formula:
const COL2_W = Math.floor((SW - 28 - 8) / 2);
```

---

## ── STANDARD TAB PAGE STRUCTURE ─────────────────────────────────────────
```tsx
export default function XxxScreen() {
  const insets = useSafeAreaInsets();
  const { T } = useCosmetic();
  const PR = T.primary || '#00CCDD';
  const conn = useConnection();        // OR: manual isConnected state
  const isConnected = conn.isConnected;
  const serverAddr = conn.addr;

  return (
    <View style={[s.root, { backgroundColor: T.bg || '#020407' }]}>
      <TabSwipeOverlay leftRoute="/(tabs)/prevTab" rightRoute="/(tabs)/nextTab" />
      <CompactPageHeader
        accent={PR}
        icon="icon-name"
        iconLib="community"
        title="PAGE TITLE"
        badge="BADGE TEXT"
        badgeColor={PR}
        isConnected={isConnected}
        safeTop={insets.top}
        rightAction={{ icon: 'refresh', onPress: () => {}, color: PR }}
      />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 14, paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}>
        {/* content */}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
});
```

---

## ── SERVER FETCH PATTERN ────────────────────────────────────────────────
```ts
// Standard authenticated server fetch with timeout
const withTimeout = (ms: number) => {
  const c = new AbortController();
  setTimeout(() => c.abort(), ms);
  return c.signal;
};

try {
  const res = await serverConnection.fetchWithAuth(
    serverConnection.buildUrl('/api/endpoint'),
    { method: 'POST', body: JSON.stringify({ key: value }), signal: withTimeout(8000) }
  );
  if (!res.ok) throw new Error(`Server error ${res.status}`);
  const data = await res.json();
} catch (e: any) {
  if (e?.name === 'AbortError') { /* timeout */ }
}
```

---

## ── FOCUS EFFECT + CONNECTION LISTENER ─────────────────────────────────
```ts
useEffect(() => {
  const seed = autoConnectEngine.getCurrentConnection();
  if (seed.connected && seed.ip) {
    setIsConnected(true);
    setServerAddr(`${seed.ip}:${seed.port}`);
  }
  const unsub = autoConnectEngine.onEvent((evt: EngineEvent) => {
    if (evt.status === 'connected') {
      setIsConnected(true);
      setServerAddr(`${evt.ip}:${evt.port}`);
    } else if (evt.status === 'idle') {
      setIsConnected(false);
      setServerAddr('');
    }
  });
  return () => unsub();
}, []);

useFocusEffect(useCallback(() => {
  if (isConnected) fetchData();
}, [isConnected]));
```

---

## ── PULSE DOT ANIMATION ──────────────────────────────────────────────────
```ts
const pulseAnim = useRef(new Animated.Value(0.4)).current;
useEffect(() => {
  const a = Animated.loop(Animated.sequence([
    Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
    Animated.timing(pulseAnim, { toValue: 0.2, duration: 900, useNativeDriver: true }),
  ]));
  a.start();
  return () => a.stop();
}, []);
// Usage: <Animated.View style={{ opacity: pulseAnim }} />
```

---

## ── COMPACT CARD TEMPLATE ────────────────────────────────────────────────
```tsx
// Standard "data card" used throughout logs/nexushome/scripts
<View style={[card.wrap, { borderColor: accent + '30' }]}>
  <View style={[card.topBar, { backgroundColor: accent }]} />
  <View style={card.header}>
    <View style={[card.iconBox, { borderColor: accent + '40', backgroundColor: accent + '12' }]}>
      <MaterialIcons name="icon" size={15} color={accent} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={card.title}>TITLE</Text>
      <Text style={card.subtitle}>SUBTITLE</Text>
    </View>
    <View style={[card.statusPill, { borderColor: color+'50', backgroundColor: color+'0C' }]}>
      <Animated.View style={{ width:5, height:5, borderRadius:3, backgroundColor: color, opacity: pulseAnim }} />
      <Text style={[card.statusTxt, { color }]}>STATUS</Text>
    </View>
  </View>
  {/* body */}
</View>

const card = StyleSheet.create({
  wrap:       { backgroundColor: '#070D16', borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  topBar:     { height: 3 },
  header:     { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingTop: 12, paddingBottom: 10 },
  iconBox:    { width: 36, height: 36, borderRadius: 10, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  title:      { fontSize: 14, fontWeight: '900', fontFamily: MONO, color: '#D2E8F6' },
  subtitle:   { fontSize: 9, fontFamily: MONO, letterSpacing: 1.2, marginTop: 2, color: '#6890A8' },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 8, borderWidth: 1 },
  statusTxt:  { fontSize: 9, fontWeight: '900', fontFamily: MONO, letterSpacing: 0.5 },
});
```

---

## ── HORIZONTAL SCROLL FILTER CHIPS ──────────────────────────────────────
```tsx
// Standard pattern for category filter bars
<ScrollView horizontal showsHorizontalScrollIndicator={false}
  contentContainerStyle={{ gap: 7, paddingHorizontal: 14, paddingVertical: 8 }}>
  {OPTIONS.map(opt => {
    const isActive = activeOpt === opt;
    return (
      <TouchableOpacity key={opt}
        style={[chip.wrap, isActive && { borderColor: PR, backgroundColor: PR + '18' }]}
        onPress={() => { haptics.selection(); setActiveOpt(opt); }}
        activeOpacity={0.8}
      >
        <Text style={[chip.txt, isActive && { color: PR }]}>{opt}</Text>
      </TouchableOpacity>
    );
  })}
</ScrollView>

const chip = StyleSheet.create({
  wrap: { borderWidth: 1.5, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6,
          borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(0,0,0,0.3)' },
  txt:  { fontSize: 10, fontWeight: '700', fontFamily: MONO, color: '#6A8090' },
});
```

---

## ── EXECUTE SCRIPT ON SERVER ─────────────────────────────────────────────
```ts
// Minimal execute pattern — always use /api/execute
const ip = serverConnection.getIP();
const port = serverConnection.getPort();
const token = serverConnection.getToken();
if (!ip || !port) { Alert.alert('Not connected'); return; }

const ctrl = new AbortController();
setTimeout(() => ctrl.abort(), 30000);
const headers: Record<string,string> = { 'Content-Type': 'application/json' };
if (token) headers['Authorization'] = `Bearer ${token}`;

const res = await fetch(`http://${ip}:${port}/api/execute`, {
  method: 'POST',
  headers,
  body: JSON.stringify({ script: pythonCode }),
  signal: ctrl.signal,
});
const data = await res.json();
const output = data.output || '';
const hasErr = output.toLowerCase().includes('traceback') || !!data.error;
```

---

## ── AI CHAT RESPONSE PARSING ─────────────────────────────────────────────
```ts
// Server v20 /api/butler/chat response has multiple possible keys:
const reply = data.content || data.response || data.message || data.reply || data.text || '';
```

---

## ── SECTION LABEL HEADER ─────────────────────────────────────────────────
```tsx
// Used in nexushome and other pages
<View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 10 }}>
  <View style={{ width: 3, height: 14, backgroundColor: color, borderRadius: 2 }} />
  <MaterialIcons name="icon" size={11} color={color} />
  <Text style={{ fontFamily: MONO, fontSize: 10, fontWeight: '900', color, letterSpacing: 1.5 }}>
    SECTION LABEL
  </Text>
  <View style={{ flex: 1, height: 1, backgroundColor: color + '25', marginLeft: 4 }} />
  {/* optional right content */}
</View>
```

---

## ── USEFOCUSEFFECT SAFE PATTERN ──────────────────────────────────────────
```ts
// Always import from expo-router (NOT @react-navigation/native)
import { useFocusEffect } from 'expo-router';

useFocusEffect(useCallback(() => {
  // runs on focus
  loadData();
  return () => {
    // runs on blur (cleanup)
  };
}, [deps]));
```

---

## ── FLATLIST PERFORMANCE PATTERN ────────────────────────────────────────
```tsx
<FlatList
  data={items}
  keyExtractor={(item, idx) => `${item.id}-${idx}`}
  renderItem={({ item }) => <ItemCard item={item} />}
  contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
  showsVerticalScrollIndicator={false}
  initialNumToRender={8}
  maxToRenderPerBatch={5}
  windowSize={7}
  removeClippedSubviews={Platform.OS === 'android'}
/>
```

---

## ── GLOBAL TAB SWITCH ────────────────────────────────────────────────────
```ts
// Switch tabs from anywhere (prefer this over router.navigate inside tabs)
(global as any).__butlerSwitchTab?.('nexushome');  // or: scripts, butler, knowledge, logs, builder, settings, cosmetic
```

---

## ── SAFE KEYBOARD AVOIDING VIEW ─────────────────────────────────────────
```tsx
<KeyboardAvoidingView
  behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
  style={{ flex: 1 }}
>
  {/* content with TextInput */}
</KeyboardAvoidingView>
```

---

## ── COLOR PALETTE (NEXUS DEFAULT) ───────────────────────────────────────
```
bg:         #020407   surface:   #070D16   surfaceHi: #0C1420
teal:       #00FFFF   green:     #00FF88   amber:     #F5A623
purple:     #BF00FF   red:       #FF3131   blue:      #4A9EFF
cyan:       #00BFFF   yellow:    #FFD700   sigma:     #CC33FF
text:       #D8E8F4   textMid:   #7A9AB8   textDim:   #3A5068
border:     rgba(0,255,255,0.12)
```

---

## ── MONO FONT ────────────────────────────────────────────────────────────
```ts
const MONO: any = Platform.OS === 'ios' ? 'Courier' : 'monospace';
```

---

## ── ANDROID FONT PADDING FIX ─────────────────────────────────────────────
```ts
// Android adds extra padding to text with fontFamily. Fix:
// includeFontPadding: false  (in StyleSheet)
```
