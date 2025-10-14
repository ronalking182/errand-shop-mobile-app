import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import {
    Dimensions,
    FlatList,
    Image,
    Pressable,
    StyleSheet,
    Text,
    View,
    ViewToken,
} from "react-native";
import { useTheme } from "../../theme/ThemeProvider";
import { authService } from "../../services/authService";

const { width, height } = Dimensions.get("window");

type Slide = {
  id: string;
  title: string;
  body: string;
  icon?: React.ReactNode;
  image?: any;
};

const slides: Slide[] = [
  {
    id: "1",
    title: "Fresh & Quality",
    body: "Your trusted companion for fresh groceries delivered with care.",
    image: require("../../../assets/images/hand-heart.png"),
  },
  {
    id: "2",
    title: "Easy Shopping",
    body: "Discover fresh products from organic vegetables to daily cooking ingredients.",
    image: require("../../../assets/images/signature-cart.png"),
  },
  {
    id: "3",
    title: "Fast Delivery",
    body: "Ready to start shopping? Fast, reliable, and convenient delivery to your door.",
    image: require("../../../assets/images/phone-basket.png"),
  },
];

export default function OnboardingScreen() {
  const { colors } = useTheme();
  const listRef = useRef<FlatList<Slide>>(null);
  const [index, setIndex] = useState(0);

  const viewableChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length) {
        const i = viewableItems[0].index ?? 0;
        setIndex(i);
      }
    }
  ).current;

  const complete = async () => {
    await authService.setOnboardingSeen();
    // After onboarding, go to login instead of home
    router.replace("/login");
  };

  const next = async () => {
    if (index < slides.length - 1) {
      listRef.current?.scrollToIndex({ index: index + 1, animated: true });
    } else {
      await complete();
    }
  };

  const skip = async () => {
    await complete();
  };

  const renderHeaderSlide = ({ item }: { item: Slide }) => (
    <Pressable
      style={[styles.header, { width, backgroundColor: colors.brand }]}
      onPress={() => {
        if (index < slides.length - 1) {
          listRef.current?.scrollToIndex({ index: index + 1, animated: true });
        }
      }}
    >
      <Pressable style={styles.skip} onPress={skip}>
        <Text style={styles.skipTxt}>Skip</Text>
      </Pressable>

      <View style={styles.iconWrap}>
        {item.image ? (
          <Image
            source={item.image}
            style={{ width: 150, height: 150 }}
            resizeMode="contain"
          />
        ) : (
          item.icon
        )}
      </View>

      <Text style={styles.bodyTxt}>{item.body}</Text>
      <Text style={styles.swipeHint}>Swipe or tap to continue</Text>
    </Pressable>
  );

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      {/* ORANGE HEADER (swipeable) */}
      <FlatList
        ref={listRef}
        data={slides}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        renderItem={renderHeaderSlide}
        onViewableItemsChanged={viewableChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
        style={{ flexGrow: 0 }}
      />

      {/* WHITE CARD (static) */}
      <View style={[styles.card, { backgroundColor: colors.bg }]}>
        {/* dots */}
        <View style={styles.dotsRow}>
          {slides.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                { backgroundColor: i === index ? colors.brand : colors.border },
              ]}
            />
          ))}
        </View>

        <Text style={[styles.title, { color: colors.text }]}>
          {slides[index]?.title}
        </Text>
        <Text style={[styles.sub, { color: colors.sub }]}>
          Join our happy customers who trust us for their grocery needs.
        </Text>

        {/* continue / get started */}
        <Pressable
          onPress={next}
          style={[styles.primaryButton, { backgroundColor: colors.brand }]}
        >
          <Text style={styles.primaryButtonText}>
            {index < slides.length - 1 ? "Continue" : "Get Started"}
          </Text>
          <Ionicons name="arrow-forward" size={18} color="#fff" />
        </Pressable>

        {/* feature badges */}
        <View style={styles.badgesRow}>
          <Badge color="#FFEECC" icon="leaf" label="Fresh Products" />
          <Badge color="#E5F8F5" icon="flash" label="Quick Delivery" />
          <Badge color="#E8F0FF" icon="shield-checkmark" label="Secure Shopping" />
        </View>
      </View>
    </View>
  );
}

function Badge({
  color,
  icon,
  label,
}: {
  color: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
}) {
  return (
    <View style={styles.badgeWrap}>
      <View style={[styles.badgeIcon, { backgroundColor: color }]}>
        <Ionicons name={icon} size={20} color="#1E1E1E" />
      </View>
      <Text style={styles.badgeTxt}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    height: height * 0.5,
    paddingTop: 56,
    paddingBottom: 28,
    paddingHorizontal: 22,
    justifyContent: "center",
  },
  skip: {
    position: "absolute",
    right: 16,
    top: 16,
    backgroundColor: "rgba(255,255,255,0.25)",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
  },
  skipTxt: { color: "#fff", fontWeight: "700" },
  iconWrap: { alignItems: "center", marginTop: 8, marginBottom: 16 },
  bodyTxt: {
    color: "#fff",
    textAlign: "center",
    fontSize: 18,
    lineHeight: 24,
    marginTop: 10,
  },
  swipeHint: {
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
    fontSize: 14,
    marginTop: 16,
  },
  card: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  dotsRow: {
    alignSelf: "center",
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  title: { textAlign: "center", fontSize: 26, fontWeight: "800" },
  sub: { textAlign: "center", marginTop: 8, fontSize: 16 },
  badgesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 22,
  },
  badgeWrap: { alignItems: "center", width: "33%" },
  badgeIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  badgeTxt: { fontSize: 13, color: "#666", textAlign: "center" },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 50,
    borderRadius: 12,
    marginTop: 24,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  primaryButtonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
