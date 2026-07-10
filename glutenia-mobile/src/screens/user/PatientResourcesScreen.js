import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";

import Screen from "../../components/Screen";
import AppIcon from "../../components/AppIcon";
import { Colors, Radius, Shadow, Spacing } from "../../theme/colors";

// ─────────────────────────────────────────────────────────────────────────────
//  STATIC CONTENT
// ─────────────────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { key: "celiac",    icon: "activity",     bg: Colors.secondaryPale, color: Colors.secondary },
  { key: "diet",      icon: "utensils",     bg: Colors.primaryPale,   color: Colors.primary   },
  { key: "safe",      icon: "shield-check", bg: Colors.primaryPale,   color: Colors.primary   },
  { key: "lifestyle", icon: "star",         bg: "#FFF9E6",            color: "#F59E0B"        },
];

const RESOURCES = [
  {
    id: "1",
    resourceKey: "r1",
    title: "Starting a Gluten-Free Diet",
    description: "Learn which foods to avoid, how to read ingredient labels, and how to set up a safe gluten-free kitchen from day one.",
    readTime: "5 min",
    icon: "utensils",
    bg: Colors.primaryPale,
    color: Colors.primary,
    body: `Transitioning to a gluten-free diet is the only treatment for celiac disease. Here is how to do it safely.

Foods to avoid:
• Wheat (bread, pasta, couscous, semolina, spelt)
• Barley (beer, malt, malt vinegar)
• Rye (rye bread, some cereals)
• Regular oats unless labelled "gluten-free"

Safe grains and starches:
• Rice, quinoa, corn, millet, buckwheat, teff, amaranth, sorghum, potatoes, and certified gluten-free oats.

Reading labels:
Look for the words "contains wheat", "contains gluten", or the certified GF symbol. Watch out for terms like "modified starch", "malt flavouring", and "hydrolysed vegetable protein" — these often contain gluten.

Setting up a safe kitchen:
• Use separate cutting boards, toasters, and colanders.
• Replace non-stick pans that have been scratched.
• Store gluten-free products on higher shelves to prevent crumbs falling in.
• Always wash hands and surfaces before preparing GF meals.

In the first weeks, stick to naturally gluten-free whole foods (meat, fish, eggs, vegetables, fruit, rice) while you learn to read labels confidently.`,
  },
  {
    id: "2",
    resourceKey: "r2",
    title: "Hidden Sources of Gluten",
    description: "Gluten hides in soy sauce, salad dressings, medications, and more. Discover the unexpected products to watch out for.",
    readTime: "4 min",
    icon: "shield",
    bg: Colors.primaryPale,
    color: Colors.primary,
    body: `Gluten does not only hide in obvious foods like bread and pasta. Many everyday products contain hidden gluten.

Common hidden sources:

Condiments and sauces:
• Soy sauce (use tamari or coconut aminos instead)
• Worcestershire sauce, ketchup, salad dressings, and marinades
• Gravy powders and stock cubes

Processed and packaged foods:
• Flavoured crisps and chips
• Processed meats (sausages, cold cuts)
• Imitation crab and seafood sticks
• Some chocolate bars and sweets

Drinks:
• Regular beer, ale, lager, and stout
• Some flavoured spirits and liqueurs
• Barley water and malt drinks

Medications and personal care:
• Some tablets and capsules use wheat starch as a filler — always check with your pharmacist.
• Lipsticks and lip balms (small amounts may be ingested).
• Communion wafers (ask for a certified GF host).

Cross-contamination risks:
• Shared deep fryers in restaurants and chip shops
• Bulk bins at grocery stores
• Shared toasters and butter dishes at home

When in doubt, contact the manufacturer directly or choose products with a certified GF label.`,
  },
  {
    id: "3",
    resourceKey: "r3",
    title: "Nutritional Deficiencies in Celiac Patients",
    description: "Celiac disease often causes low levels of iron, calcium, vitamin D, and B12. Learn how to identify and correct them.",
    readTime: "6 min",
    icon: "activity",
    bg: Colors.secondaryPale,
    color: Colors.secondary,
    body: `Untreated celiac disease damages the small intestine, reducing its ability to absorb nutrients. Even after going gluten-free, deficiencies can persist for months while the gut heals.

Most common deficiencies:

Iron:
The most frequent deficiency. Causes fatigue, pale skin, and shortness of breath. Iron is absorbed mainly in the upper small intestine — the area most damaged by celiac disease. Eat iron-rich foods (red meat, lentils, spinach) and pair with vitamin C to boost absorption.

Calcium and Vitamin D:
Essential for bone health. Long-term deficiency leads to osteoporosis. Dairy products, fortified plant milks, sardines with bones, and sun exposure help. Your doctor may prescribe supplements.

Vitamin B12 and Folate:
Needed for nerve function and red blood cell production. Found in meat, eggs, dairy, and leafy greens. Often require supplementation in the first year after diagnosis.

Zinc:
Supports immune function and wound healing. Found in meat, shellfish, legumes, and seeds.

Fibre:
Gluten-free products are often low in fibre. Include more vegetables, fruit, legumes, and GF whole grains (quinoa, brown rice, buckwheat).

What to do:
Ask your doctor for a full blood panel at diagnosis and again at 6 and 12 months. Do not self-supplement without guidance — excess iron and vitamin D can cause harm. A dietitian specialising in celiac disease can build a plan tailored to your results.`,
  },
  {
    id: "4",
    resourceKey: "r4",
    title: "Dining Out Safely",
    description: "Tips for eating at restaurants with confidence — how to communicate with staff and spot hidden gluten on any menu.",
    readTime: "4 min",
    icon: "star",
    bg: "#FFF9E6",
    color: "#F59E0B",
    body: `Eating at restaurants with celiac disease requires preparation, but it is entirely possible to dine out safely.

Before you go:
• Research the restaurant online and look for a GF menu.
• Call ahead during quiet hours and explain that you have celiac disease — not just a preference.
• Avoid busy times when kitchen staff are rushed and more likely to make mistakes.

At the restaurant:
• Tell your server you have celiac disease and ask to speak with the chef if necessary.
• Ask specifically about cross-contamination: shared fryers, shared pasta water, and shared prep surfaces.
• Avoid sauces, gravies, and dressings unless confirmed GF — these are common gluten traps.
• Choose simple dishes: grilled meat or fish, plain rice or potatoes, and steamed vegetables.

Questions to ask:
• "Is this dish prepared in a dedicated gluten-free area?"
• "Are your fries cooked in a shared fryer with breaded items?"
• "Does the chef change gloves when preparing my meal?"

Types of restaurants that are generally safer:
• Naturally gluten-free cuisines: Mexican (corn-based), Japanese (sashimi, rice dishes), and Vietnamese (rice noodle dishes, if soy sauce is excluded).
• Dedicated gluten-free restaurants or those with an allergy-aware culture.

Red flags:
• Staff who do not know what gluten is.
• Kitchens with no separate preparation area.
• "We can just remove the croutons" — cross-contamination is the real risk, not just visible gluten.

If in doubt, choose a simpler venue or prepare your own food. Your health comes first.`,
  },
];

const VIDEOS = [
  {
    id: "1",
    videoKey: "v1",
    title: "Living with Celiac Disease",
    author: "Dr. Amira Ben Ali",
    duration: "12 min",
    youtubeId: "z-kyx4wgz2c",
  },
  {
    id: "2",
    videoKey: "v2",
    title: "Gluten-Free Meal Prep",
    author: "Nutritionist Panel",
    duration: "18 min",
    youtubeId: "fTi4-3VwMUE",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
//  SCREEN
// ─────────────────────────────────────────────────────────────────────────────

export default function PatientResourcesScreen({ navigation }) {
  const { t } = useTranslation();
  const openVideo = (video) => {
    navigation.navigate("VideoPlayer", {
      youtubeId: video.youtubeId,
      title: video.title,
    });
  };
  return (
    <Screen>
      {/* ── Navigation bar ── */}
      <View style={styles.navBar}>
        <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
          <AppIcon name="arrow-back" size={22} color={Colors.textDark} />
        </Pressable>
        <Text style={styles.navTitle}>{t("patientResources.title")}</Text>
        <View style={styles.navSpacer} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── Categories ── */}
        <Text style={styles.sectionMeta}>{t("patientResources.categories")}</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.catRow}
        >
          {CATEGORIES.map((cat) => (
            <Pressable key={cat.key} style={styles.catCard}>
              <View style={[styles.catIconWrap, { backgroundColor: cat.bg }]}>
                <AppIcon name={cat.icon} size={22} color={cat.color} />
              </View>
              <Text style={styles.catLabel}>{t(`patientResources.categoryLabels.${cat.key}`)}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* ── Featured ── */}
        <Text style={styles.sectionMeta}>{t("patientResources.featured")}</Text>
        <View style={styles.featuredCard}>
          <View style={styles.featuredIconCircle}>
            <AppIcon name="activity" size={34} color={Colors.secondary} />
          </View>
          <Text style={styles.featuredTitle}>{t("patientResources.featuredTitle")}</Text>
          <Text style={styles.featuredDesc}>{t("patientResources.featuredDesc")}</Text>
          <View style={styles.featuredFooter}>
            <View style={styles.readTimeRow}>
              <AppIcon name="clock" size={13} color={Colors.textMuted} />
              <Text style={styles.readTimeText}>{t("patientResources.readTime", { time: t("patientResources.featuredReadTime") })}</Text>
            </View>
            <Pressable
              style={styles.readMoreBtn}
              onPress={() => navigation.navigate("ResourceDetail", {
                resource: {
                  title: t("patientResources.featuredTitle"),
                  icon: "activity",
                  bg: Colors.secondaryPale,
                  color: Colors.secondary,
                  readTime: t("patientResources.featuredReadTime"),
                  body: `Celiac disease is a chronic autoimmune condition in which the ingestion of gluten — a protein found in wheat, barley, and rye — causes damage to the lining of the small intestine.

How it works:
When someone with celiac disease eats gluten, their immune system mistakenly attacks the villi — the tiny finger-like projections lining the small intestine. Over time, this damage reduces the intestine's ability to absorb nutrients, leading to malnutrition and a wide range of symptoms.

Symptoms:
Celiac disease presents differently in every person.
• Digestive: bloating, diarrhoea, constipation, abdominal pain, and nausea.
• Non-digestive: fatigue, anaemia, joint pain, skin rash (dermatitis herpetiformis), headaches, and brain fog.
• In children: poor growth, delayed puberty, and irritability.
• Silent celiac: some people have no symptoms at all but still suffer intestinal damage.

Diagnosis:
• Blood test: elevated tTG-IgA antibodies (tissue transglutaminase).
• Endoscopy and biopsy: a small sample of the small intestinal lining is taken to confirm damage (Marsh score).
• Important: do not start a gluten-free diet before testing — it will make the results inaccurate.

Treatment:
There is currently no medication for celiac disease. The only treatment is a strict, lifelong gluten-free diet. Most people see significant improvement in symptoms within weeks, though full intestinal healing can take 1–2 years.

Living with celiac disease:
With the right knowledge, celiac disease is entirely manageable. Most people lead full, healthy lives. The key is education — learning to read labels, avoid cross-contamination, and communicate your needs when eating out.`,
                },
              })}
            >
              <Text style={styles.readMoreText}>{t("patientResources.readMore")}</Text>
              <AppIcon name="chevron-right" size={14} color={Colors.primary} />
            </Pressable>
          </View>
        </View>

        {/* ── All resources ── */}
        <Text style={styles.sectionMeta}>{t("patientResources.allResources")}</Text>
        <View style={styles.resourceList}>
          {RESOURCES.map((item) => (
            <Pressable
              key={item.id}
              style={styles.resourceCard}
              onPress={() => navigation.navigate("ResourceDetail", {
                resource: { ...item, title: t(`patientResources.resources.${item.resourceKey}.title`), description: t(`patientResources.resources.${item.resourceKey}.description`) },
              })}
            >
              <View style={[styles.resourceIconWrap, { backgroundColor: item.bg }]}>
                <AppIcon name={item.icon} size={22} color={item.color} />
              </View>
              <View style={styles.resourceBody}>
                <Text style={styles.resourceTitle}>{t(`patientResources.resources.${item.resourceKey}.title`)}</Text>
                <Text style={styles.resourceDesc} numberOfLines={2}>
                  {t(`patientResources.resources.${item.resourceKey}.description`)}
                </Text>
                <View style={styles.resourceFooter}>
                  <AppIcon name="clock" size={12} color={Colors.textMuted} />
                  <Text style={styles.resourceTime}>{t(`patientResources.resources.${item.resourceKey}.readTime`)}</Text>
                  <Text style={styles.resourceReadMore}>  {t("patientResources.readMore")} →</Text>
                </View>
              </View>
            </Pressable>
          ))}
        </View>

        {/* ── Videos & Sessions ── */}
        <View style={styles.videosSectionRow}>
          <Text style={styles.videosSectionTitle}>{t("patientResources.videosSection")}</Text>
          <Pressable style={styles.seeAll}>
            <Text style={styles.seeAllText}>{t("patientResources.seeAll")}</Text>
            <AppIcon name="chevron-right" size={14} color={Colors.secondary} />
          </Pressable>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.videosRow}
        >
          {VIDEOS.map((video) => (
            <Pressable key={video.id} style={styles.videoCard} onPress={() => openVideo(video)}>
              <View style={styles.videoThumb}>
                <AppIcon name="play-circle" size={44} color={Colors.secondary} />
                <View style={styles.durationBadge}>
                  <Text style={styles.durationText}>{video.duration}</Text>
                </View>
              </View>
              <Text style={styles.videoTitle} numberOfLines={2}>
                {t(`patientResources.videos.${video.videoKey}.title`)}
              </Text>
              <Text style={styles.videoAuthor}>{t(`patientResources.videos.${video.videoKey}.author`)}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* ── Disclaimer ── */}
        <View style={styles.disclaimer}>
          <AppIcon name="info" size={16} color={Colors.secondary} />
          <Text style={styles.disclaimerText}>{t("patientResources.disclaimer")}</Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </Screen>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  STYLES
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Nav bar
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  navTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 17,
    fontWeight: "800",
    color: Colors.textDark,
  },
  navSpacer: { width: 40 },

  // Section meta labels (Categories / Featured / All resources)
  sectionMeta: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textMuted,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },

  // Categories
  catRow: {
    paddingHorizontal: Spacing.md,
    gap: 10,
    paddingBottom: 4,
  },
  catCard: {
    width: 80,
    alignItems: "center",
    gap: 8,
  },
  catIconWrap: {
    width: 60,
    height: 60,
    borderRadius: Radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  catLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.textDark,
    textAlign: "center",
    lineHeight: 15,
  },

  // Featured card
  featuredCard: {
    marginHorizontal: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    gap: Spacing.sm,
    ...Shadow,
  },
  featuredIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.secondaryPale,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: Spacing.sm,
  },
  featuredTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: Colors.textDark,
    lineHeight: 24,
  },
  featuredDesc: {
    fontSize: 14,
    color: Colors.textMuted,
    lineHeight: 20,
  },
  featuredFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: Spacing.sm,
  },
  readTimeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  readTimeText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: "600",
  },
  readMoreBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  readMoreText: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.primary,
  },

  // Resource list
  resourceList: {
    marginHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  resourceCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
    ...Shadow,
  },
  resourceIconWrap: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  resourceBody: {
    flex: 1,
    gap: 4,
  },
  resourceTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: Colors.textDark,
    lineHeight: 20,
  },
  resourceDesc: {
    fontSize: 12,
    color: Colors.textMuted,
    lineHeight: 17,
  },
  resourceFooter: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  resourceTime: {
    fontSize: 11,
    color: Colors.textMuted,
    marginLeft: 4,
  },
  resourceReadMore: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.primary,
    marginLeft: 6,
  },

  // Videos section header row
  videosSectionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  videosSectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textMuted,
  },
  seeAll: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.secondary,
  },

  // Video cards
  videosRow: {
    paddingHorizontal: Spacing.md,
    gap: 12,
    paddingBottom: 4,
  },
  videoCard: {
    width: 180,
    gap: 8,
  },
  videoThumb: {
    width: 180,
    height: 115,
    borderRadius: Radius.lg,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.secondaryPale,
  },
  durationBadge: {
    position: "absolute",
    bottom: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.58)",
    borderRadius: Radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  durationText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },
  videoTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: Colors.textDark,
    lineHeight: 18,
  },
  videoAuthor: {
    fontSize: 11,
    color: Colors.textMuted,
  },

  // Disclaimer
  disclaimer: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.lg,
    backgroundColor: Colors.secondaryPale,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    flexDirection: "row",
    gap: Spacing.sm,
    alignItems: "flex-start",
  },
  disclaimerText: {
    flex: 1,
    fontSize: 12,
    color: Colors.secondary,
    lineHeight: 18,
  },
});
