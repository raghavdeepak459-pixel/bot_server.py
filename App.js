// ╔══════════════════════════════════════════════════════════════╗
// ║         TRADING BOT — SINGLE FILE APP (App.js)              ║
// ║  Expo Snack par directly paste karo aur phone par dekho!    ║
// ╚══════════════════════════════════════════════════════════════╝
//
// STEP 1: https://snack.expo.dev kholein
// STEP 2: Baayein taraf "App.js" mein yeh pura code paste karein
// STEP 3: Phone par Expo Go app install karein
// STEP 4: Snack ka QR code scan karein — Done!
//
// ⚠️  APNA BACKEND URL YAHAN DAALO (line ~30):
//     Agar Render/PythonAnywhere par deploy kiya hai toh woh URL
//     Agar local test karna hai: 'http://YOUR_IP:5000'
// ══════════════════════════════════════════════════════════════

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, FlatList,
  StyleSheet, SafeAreaView, StatusBar, ActivityIndicator,
  RefreshControl, Animated, Dimensions,
} from 'react-native';

// ─────────────────────────────────────────────
//  ⚙️  CONFIG — YAHAN APNA URL CHANGE KAREIN
// ─────────────────────────────────────────────
const BACKEND_URL = 'https://your-app.onrender.com'; // Render.com URL
// const BACKEND_URL = 'http://192.168.1.105:5000';  // Local laptop URL

const REFRESH_INTERVAL = 5000; // 5 second mein auto-refresh

// ─────────────────────────────────────────────
//  API FUNCTIONS
// ─────────────────────────────────────────────
const api = {
  fetchStatus: async () => {
    const r = await fetch(`${BACKEND_URL}/api/status`);
    return r.json();
  },
  toggleBot: async () => {
    const r = await fetch(`${BACKEND_URL}/api/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    return r.json();
  },
  fetchTrades: async () => {
    const r = await fetch(`${BACKEND_URL}/api/trades`);
    return r.json();
  },
  fetchLogs: async () => {
    const r = await fetch(`${BACKEND_URL}/api/logs`);
    return r.json();
  },
};

// ─────────────────────────────────────────────
//  COLORS (Dark Theme)
// ─────────────────────────────────────────────
const C = {
  bg:       '#0f172a',
  surface:  '#1e293b',
  surface2: '#0d1a2d',
  border:   '#334155',
  text:     '#f1f5f9',
  muted:    '#64748b',
  green:    '#4ade80',
  red:      '#f87171',
  blue:     '#60a5fa',
  amber:    '#fbbf24',
  greenBg:  '#052e16',
  redBg:    '#450a0a',
};

// ─────────────────────────────────────────────
//  SCREEN ENUM
// ─────────────────────────────────────────────
const SCREENS = { DASHBOARD: 'dashboard', TRADES: 'trades', LOGS: 'logs' };

// ══════════════════════════════════════════════
//  MAIN APP COMPONENT
// ══════════════════════════════════════════════
export default function App() {
  const [screen,    setScreen]    = useState(SCREENS.DASHBOARD);
  const [status,    setStatus]    = useState(null);
  const [trades,    setTrades]    = useState([]);
  const [logs,      setLogs]      = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [toggling,  setToggling]  = useState(false);
  const [refreshing,setRefreshing]= useState(false);
  const [error,     setError]     = useState(null);
  const priceAnim = useRef(new Animated.Value(1)).current;

  // ── Data Loaders ──────────────────────────
  const loadAll = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setError(null);
      const [s, t, l] = await Promise.all([
        api.fetchStatus(),
        api.fetchTrades(),
        api.fetchLogs(),
      ]);
      // Price flash animation
      if (status && s.last_price !== status.last_price) {
        Animated.sequence([
          Animated.timing(priceAnim, { toValue: 1.08, duration: 150, useNativeDriver: true }),
          Animated.timing(priceAnim, { toValue: 1,    duration: 150, useNativeDriver: true }),
        ]).start();
      }
      setStatus(s);
      setTrades(t.trades || []);
      setLogs(l.logs     || []);
    } catch (e) {
      setError('Backend se connect nahi ho pa raha.\nURL check karein: ' + BACKEND_URL);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [status]);

  useEffect(() => {
    loadAll();
    const t = setInterval(() => loadAll(true), REFRESH_INTERVAL);
    return () => clearInterval(t);
  }, []);

  const handleToggle = async () => {
    setToggling(true);
    try {
      const result = await api.toggleBot();
      setStatus(result);
    } catch { setError('Toggle failed. Backend check karein.'); }
    setToggling(false);
  };

  const onRefresh = () => { setRefreshing(true); loadAll(); };

  // ── Render ────────────────────────────────
  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      {/* ── TOP HEADER ── */}
      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>TradingBot Pro</Text>
          <Text style={s.headerSub}>
            {screen === SCREENS.DASHBOARD ? 'Dashboard' :
             screen === SCREENS.TRADES    ? 'Trade History' : 'Live Logs'}
          </Text>
        </View>
        <StatusBadge running={status?.is_running} />
      </View>

      {/* ── ERROR BANNER ── */}
      {error && (
        <View style={s.errorBanner}>
          <Text style={s.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => loadAll()}>
            <Text style={s.errorRetry}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── SCREEN CONTENT ── */}
      {loading ? (
        <View style={s.centerFull}>
          <ActivityIndicator color={C.green} size="large" />
          <Text style={[s.muted, { marginTop: 12 }]}>Backend se data aa raha hai...</Text>
        </View>
      ) : (
        <>
          {screen === SCREENS.DASHBOARD &&
            <DashboardView
              status={status}
              trades={trades}
              toggling={toggling}
              onToggle={handleToggle}
              onRefresh={onRefresh}
              refreshing={refreshing}
              priceAnim={priceAnim}
            />}
          {screen === SCREENS.TRADES &&
            <TradesView trades={trades} onRefresh={onRefresh} refreshing={refreshing} />}
          {screen === SCREENS.LOGS &&
            <LogsView logs={logs} onRefresh={onRefresh} refreshing={refreshing} />}
        </>
      )}

      {/* ── BOTTOM TAB BAR ── */}
      <View style={s.tabBar}>
        {[
          { id: SCREENS.DASHBOARD, label: 'Dashboard', icon: '▦' },
          { id: SCREENS.TRADES,    label: 'Trades',    icon: '↕' },
          { id: SCREENS.LOGS,      label: 'Logs',      icon: '≡' },
        ].map(tab => (
          <TouchableOpacity
            key={tab.id}
            style={s.tabItem}
            onPress={() => setScreen(tab.id)}
          >
            <Text style={[s.tabIcon, screen === tab.id && s.tabActive]}>{tab.icon}</Text>
            <Text style={[s.tabLabel, screen === tab.id && s.tabActive]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

// ══════════════════════════════════════════════
//  DASHBOARD SCREEN
// ══════════════════════════════════════════════
function DashboardView({ status, trades, toggling, onToggle, onRefresh, refreshing, priceAnim }) {
  const pnl = status?.pnl ?? 0;
  const recentTrades = trades.slice(0, 3);

  return (
    <ScrollView
      contentContainerStyle={s.scrollPad}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.green} />}
    >
      {/* Price Card */}
      <View style={[s.card, { marginBottom: 12 }]}>
        <Text style={s.cardLabel}>Last Price</Text>
        <Animated.Text style={[s.priceText, { transform: [{ scale: priceAnim }] }]}>
          {status?.last_price ? `₹${Number(status.last_price).toFixed(2)}` : '—'}
        </Animated.Text>
        <Text style={[s.priceChange, { color: (status?.price_change ?? '').startsWith('+') ? C.green : C.red }]}>
          {status?.price_change ?? '0.00%'}
        </Text>
      </View>

      {/* Stats Row */}
      <View style={s.row2}>
        <StatCard label="P&L Today"  value={pnl !== 0 ? `${pnl >= 0 ? '+' : ''}₹${pnl}` : '₹0'} valueColor={pnl >= 0 ? C.green : C.red} />
        <StatCard label="Trades"     value={String(status?.trade_count ?? 0)} />
        <StatCard label="Symbol"     value={status?.symbol ?? '—'} />
        <StatCard label="Position"   value={status?.position ?? 'FLAT'} valueColor={C.blue} />
      </View>

      {/* Recent Trades */}
      <View style={s.card}>
        <Text style={s.sectionTitle}>Recent Trades</Text>
        {recentTrades.length === 0 ? (
          <Text style={s.muted}>Abhi koi trade nahi</Text>
        ) : recentTrades.map((t, i) => (
          <View key={i} style={[s.tradeRow, i < recentTrades.length - 1 && s.tradeBorder]}>
            <Text style={s.tradeSymbol}>{t.symbol}</Text>
            <TypeBadge type={t.type} />
            <Text style={[s.tradePnl, { color: (t.pnl ?? 0) >= 0 ? C.green : C.red }]}>
              {t.pnl !== undefined ? `${t.pnl >= 0 ? '+' : ''}₹${t.pnl}` : '—'}
            </Text>
          </View>
        ))}
      </View>

      {/* Toggle Button */}
      <TouchableOpacity
        style={[s.toggleBtn, status?.is_running ? s.btnStop : s.btnStart]}
        onPress={onToggle}
        disabled={toggling}
      >
        {toggling
          ? <ActivityIndicator color="#fff" />
          : <Text style={s.toggleText}>
              {status?.is_running ? '⏹  Bot Band Karo' : '▶  Bot Shuru Karo'}
            </Text>
        }
      </TouchableOpacity>
    </ScrollView>
  );
}

// ══════════════════════════════════════════════
//  TRADES SCREEN
// ══════════════════════════════════════════════
function TradesView({ trades, onRefresh, refreshing }) {
  const totalPnl = trades.reduce((sum, t) => sum + (t.pnl ?? 0), 0);

  return (
    <View style={{ flex: 1 }}>
      <View style={s.summaryBar}>
        <View style={s.summaryItem}>
          <Text style={s.cardLabel}>Total Trades</Text>
          <Text style={s.summaryVal}>{trades.length}</Text>
        </View>
        <View style={[s.summaryItem, { borderLeftWidth: 1, borderLeftColor: C.border }]}>
          <Text style={s.cardLabel}>Net P&L</Text>
          <Text style={[s.summaryVal, { color: totalPnl >= 0 ? C.green : C.red }]}>
            {totalPnl >= 0 ? '+' : ''}₹{totalPnl.toFixed(2)}
          </Text>
        </View>
      </View>

      {/* Table Header */}
      <View style={s.tableHead}>
        <Text style={[s.tableHCell, { flex: 1.4 }]}>Symbol</Text>
        <Text style={[s.tableHCell, { flex: 0.8, textAlign: 'center' }]}>Type</Text>
        <Text style={[s.tableHCell, { flex: 1.2, textAlign: 'right' }]}>Price</Text>
        <Text style={[s.tableHCell, { flex: 0.9, textAlign: 'right' }]}>P&L</Text>
        <Text style={[s.tableHCell, { flex: 1, textAlign: 'right' }]}>Time</Text>
      </View>

      {trades.length === 0 ? (
        <View style={s.centerFull}>
          <Text style={s.muted}>Koi trade history nahi</Text>
        </View>
      ) : (
        <FlatList
          data={trades}
          keyExtractor={(_, i) => String(i)}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.green} />}
          renderItem={({ item, index }) => (
            <View style={[s.tableRow, index % 2 === 0 ? { backgroundColor: C.bg } : { backgroundColor: C.surface2 }]}>
              <Text style={[s.tableCell, { flex: 1.4 }]}>{item.symbol}</Text>
              <View style={{ flex: 0.8, alignItems: 'center' }}>
                <TypeBadge type={item.type} />
              </View>
              <Text style={[s.tableCell, { flex: 1.2, textAlign: 'right' }]}>₹{item.price}</Text>
              <Text style={[s.tableCell, { flex: 0.9, textAlign: 'right', color: (item.pnl ?? 0) >= 0 ? C.green : C.red }]}>
                {item.pnl !== undefined ? `${item.pnl >= 0 ? '+' : ''}₹${item.pnl}` : '—'}
              </Text>
              <Text style={[s.tableCell, { flex: 1, textAlign: 'right', color: C.muted }]}>{item.time ?? '—'}</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

// ══════════════════════════════════════════════
//  LOGS SCREEN
// ══════════════════════════════════════════════
function LogsView({ logs, onRefresh, refreshing }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current && logs.length > 0) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 200);
    }
  }, [logs]);

  const getColor = (msg) => {
    if (!msg) return C.muted;
    if (/error|ERROR/.test(msg))  return C.red;
    if (/BUY|buy/.test(msg))      return C.green;
    if (/SELL|sell/.test(msg))    return C.amber;
    if (/WARN|warn/.test(msg))    return C.amber;
    if (/profit|Target/.test(msg))return C.green;
    return '#94a3b8';
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={s.logsHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={s.liveDot} />
          <Text style={{ color: C.green, fontSize: 12 }}>LIVE</Text>
        </View>
        <Text style={s.muted}>{logs.length} entries</Text>
      </View>

      <ScrollView
        ref={scrollRef}
        style={s.terminal}
        contentContainerStyle={{ padding: 12 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.green} />}
      >
        {logs.length === 0 ? (
          <Text style={{ color: C.border, fontFamily: 'monospace', fontSize: 12 }}>
            Bot se koi log nahi...
          </Text>
        ) : (
          [...logs].reverse().map((log, i) => (
            <View key={i} style={{ flexDirection: 'row', marginBottom: 3, gap: 8 }}>
              <Text style={{ color: C.border, fontSize: 10, fontFamily: 'monospace', minWidth: 30, paddingTop: 1 }}>
                {String(logs.length - i).padStart(3, '0')}
              </Text>
              <Text style={{ color: getColor(log), fontSize: 11, fontFamily: 'monospace', flex: 1, lineHeight: 16 }}>
                {log}
              </Text>
            </View>
          ))
        )}
        <Text style={{ color: C.green, fontSize: 12 }}>█</Text>
      </ScrollView>
    </View>
  );
}

// ══════════════════════════════════════════════
//  SMALL COMPONENTS
// ══════════════════════════════════════════════
function StatusBadge({ running }) {
  return (
    <View style={[s.badge, running ? s.badgeGreen : s.badgeRed]}>
      <Text style={[s.badgeText, { color: running ? C.green : C.red }]}>
        {running ? '● ACTIVE' : '● STOPPED'}
      </Text>
    </View>
  );
}

function StatCard({ label, value, valueColor }) {
  return (
    <View style={s.statCard}>
      <Text style={s.cardLabel}>{label}</Text>
      <Text style={[s.statVal, valueColor && { color: valueColor }]}>{value}</Text>
    </View>
  );
}

function TypeBadge({ type }) {
  const isBuy = type === 'BUY';
  return (
    <View style={[s.typePill, { backgroundColor: isBuy ? C.greenBg : C.redBg }]}>
      <Text style={[s.typeText, { color: isBuy ? C.green : C.red }]}>{type}</Text>
    </View>
  );
}

// ══════════════════════════════════════════════
//  STYLES
// ══════════════════════════════════════════════
const s = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: C.bg },
  header:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  headerTitle: { color: C.text, fontSize: 17, fontWeight: '700' },
  headerSub:   { color: C.muted, fontSize: 11, marginTop: 1 },
  badge:       { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  badgeGreen:  { backgroundColor: C.greenBg, borderColor: '#16a34a' },
  badgeRed:    { backgroundColor: C.redBg,   borderColor: '#b91c1c' },
  badgeText:   { fontSize: 11, fontWeight: '700' },
  errorBanner: { backgroundColor: '#450a0a', padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  errorText:   { color: C.red, fontSize: 12, flex: 1 },
  errorRetry:  { color: C.blue, fontSize: 13, marginLeft: 12 },
  centerFull:  { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollPad:   { padding: 14, gap: 12, paddingBottom: 30 },
  card:        { backgroundColor: C.surface, borderRadius: 14, padding: 14 },
  cardLabel:   { color: C.muted, fontSize: 11, marginBottom: 4 },
  priceText:   { color: C.text, fontSize: 32, fontWeight: '700', letterSpacing: -0.5 },
  priceChange: { fontSize: 13, marginTop: 2, fontWeight: '600' },
  row2:        { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statCard:    { backgroundColor: C.surface, borderRadius: 12, padding: 12, flex: 1, minWidth: '44%' },
  statVal:     { color: C.text, fontSize: 18, fontWeight: '700' },
  sectionTitle:{ color: C.text, fontSize: 13, fontWeight: '600', marginBottom: 10 },
  tradeRow:    { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  tradeBorder: { borderBottomWidth: 1, borderBottomColor: C.border },
  tradeSymbol: { color: C.text, fontSize: 13, flex: 1 },
  tradePnl:    { fontSize: 13, fontWeight: '600', minWidth: 60, textAlign: 'right' },
  toggleBtn:   { borderRadius: 14, padding: 16, alignItems: 'center' },
  btnStart:    { backgroundColor: '#15803d' },
  btnStop:     { backgroundColor: '#991b1b' },
  toggleText:  { color: '#fff', fontSize: 15, fontWeight: '700' },
  muted:       { color: C.muted, fontSize: 12 },
  // Trades
  summaryBar:  { flexDirection: 'row', backgroundColor: C.surface, margin: 12, borderRadius: 12 },
  summaryItem: { flex: 1, padding: 14, alignItems: 'center' },
  summaryVal:  { color: C.text, fontSize: 20, fontWeight: '700' },
  tableHead:   { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.border },
  tableHCell:  { color: C.muted, fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  tableRow:    { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 11, alignItems: 'center' },
  tableCell:   { color: C.text, fontSize: 12, flex: 1 },
  typePill:    { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 5 },
  typeText:    { fontSize: 10, fontWeight: '800' },
  // Logs
  logsHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.border },
  liveDot:     { width: 7, height: 7, borderRadius: 4, backgroundColor: C.green },
  terminal:    { flex: 1, backgroundColor: '#020617', margin: 12, borderRadius: 12, borderWidth: 1, borderColor: C.border },
  // Tabs
  tabBar:      { flexDirection: 'row', backgroundColor: C.surface, borderTopWidth: 1, borderTopColor: C.border, paddingBottom: 8 },
  tabItem:     { flex: 1, alignItems: 'center', paddingTop: 10, gap: 3 },
  tabIcon:     { fontSize: 18, color: C.muted },
  tabLabel:    { fontSize: 10, color: C.muted },
  tabActive:   { color: C.green },
});
