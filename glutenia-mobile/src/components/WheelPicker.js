import { useEffect, useRef } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Colors } from "../theme/colors";

const ITEM_HEIGHT = 40;
const VISIBLE_ITEMS = 5;
const CONTAINER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;
const PADDING = (CONTAINER_HEIGHT - ITEM_HEIGHT) / 2;

export default function WheelPicker({ items, selectedIndex, onChange, width = 72 }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ y: selectedIndex * ITEM_HEIGHT, animated: false });
    // Only run on mount so the wheel starts at the current value.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleMomentumEnd = (event) => {
    const y = event.nativeEvent.contentOffset.y;
    const index = Math.max(0, Math.min(items.length - 1, Math.round(y / ITEM_HEIGHT)));
    onChange(index);
  };

  return (
    <View style={[styles.container, { width }]}>
      <View pointerEvents="none" style={styles.highlight} />
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        contentContainerStyle={styles.content}
        onMomentumScrollEnd={handleMomentumEnd}
        scrollEventThrottle={16}
      >
        {items.map((label, index) => (
          <View key={label} style={styles.item}>
            <Text style={[styles.itemText, index === selectedIndex && styles.itemTextActive]}>
              {label}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: CONTAINER_HEIGHT,
  },
  highlight: {
    position: "absolute",
    left: 0,
    right: 0,
    top: PADDING,
    height: ITEM_HEIGHT,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.secondary,
    backgroundColor: Colors.secondaryPale,
    borderRadius: 8,
  },
  content: {
    paddingVertical: PADDING,
  },
  item: {
    height: ITEM_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
  },
  itemText: {
    fontSize: 17,
    color: Colors.textMuted,
    fontWeight: "600",
  },
  itemTextActive: {
    color: Colors.textDark,
    fontWeight: "800",
  },
});
