import { useRef, useState } from 'react';
import { Image, PanResponder, StyleSheet, Text, View } from 'react-native';
import { theme } from '@/lib/theme';

interface Props {
  before: string;
  after: string;
  height?: number;
}

/** Draggable before/after comparison slider. */
export default function BeforeAfter({ before, after, height = 420 }: Props) {
  const [position, setPosition] = useState(0.5);
  const [width, setWidth] = useState(0);

  const update = (x: number) => {
    if (width > 0) setPosition(clamp(x / width));
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => update(e.nativeEvent.locationX),
      onPanResponderMove: (e) => update(e.nativeEvent.locationX),
    }),
  ).current;

  return (
    <View
      style={[styles.container, { height }]}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      {...panResponder.panHandlers}
    >
      {/* After (restored) fills the whole frame */}
      <Image source={{ uri: after }} style={styles.full} resizeMode="cover" />

      {/* Before is clipped to the left of the divider */}
      <View style={[styles.beforeClip, { width: width * position }]}>
        <Image
          source={{ uri: before }}
          style={[styles.beforeImage, { width }]}
          resizeMode="cover"
        />
      </View>

      {/* Divider */}
      <View style={[styles.divider, { left: width * position }]}>
        <View style={styles.handle}>
          <Text style={styles.handleText}>‹ ›</Text>
        </View>
      </View>

      <View style={[styles.chip, styles.chipLeft]}>
        <Text style={styles.chipText}>Before</Text>
      </View>
      <View style={[styles.chip, styles.chipRight]}>
        <Text style={styles.chipText}>After</Text>
      </View>
    </View>
  );
}

function clamp(v: number) {
  return Math.min(0.96, Math.max(0.04, v));
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: theme.radius,
    overflow: 'hidden',
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
  },
  full: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    right: 0,
  },
  beforeClip: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  beforeImage: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
  },
  divider: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 3,
    marginLeft: -1.5,
    backgroundColor: theme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  handle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  handleText: {
    color: '#161210',
    fontWeight: '800',
    fontSize: 16,
  },
  chip: {
    position: 'absolute',
    top: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  chipLeft: { left: 12 },
  chipRight: { right: 12 },
  chipText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
});
