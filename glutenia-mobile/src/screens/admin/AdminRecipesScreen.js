import {
  Alert,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import AppIcon from "../../components/AppIcon";
import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import Screen from "../../components/Screen";
import SectionHeader from "../../components/SectionHeader";
import EmptyState from "../../components/EmptyState";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api/client";
import { Colors, Radius, Shadow, Spacing } from "../../theme/colors";

export default function AdminRecipesScreen({ navigation }) {
  const { token, logout } = useAuth();
  const { t } = useTranslation();
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadRecipes = async () => {
    try {
      setLoading(true);
      setRecipes(await api.recipes());
    } catch (error) {
      if (error.status === 401) {
        Alert.alert(t("admin.sessionExpired"), t("admin.sessionMsg"), [
          { text: t("admin.ok"), onPress: logout },
        ]);
      } else {
        Alert.alert(t("admin.recipes.errorTitle"), error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadRecipes();
    }, [token])
  );

  const deleteRecipe = (recipe) => {
    Alert.alert(
      t("admin.recipes.deleteTitle"),
      t("admin.recipes.deleteMsg", { name: recipe.name }),
      [
        { text: t("admin.recipes.cancel"), style: "cancel" },
        {
          text: t("admin.recipes.delete"),
          style: "destructive",
          onPress: async () => {
            try {
              if (!token) {
                Alert.alert(t("admin.sessionExpired"), t("admin.sessionMsgShort"));
                return;
              }
              await api.deleteRecipe(token, recipe._id);
              await loadRecipes();
            } catch (error) {
              Alert.alert(t("admin.recipes.deleteFailed"), error.message);
            }
          },
        },
      ]
    );
  };

  return (
    <Screen>
      <View style={styles.container}>
        <SectionHeader
          eyebrow={t("admin.recipes.eyebrow")}
          title={t("admin.recipes.title")}
          right={
            <Pressable
              style={styles.addButton}
              onPress={() => navigation.navigate("AdminRecipeForm")}
            >
              <AppIcon name="add" size={24} color={Colors.surface} />
            </Pressable>
          }
        />
        <FlatList
          data={recipes}
          keyExtractor={(item) => item._id}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={loadRecipes} />}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <EmptyState
              icon="utensils"
              title={t("admin.recipes.empty")}
              body={t("admin.recipes.emptyBody")}
            />
          }
          renderItem={({ item }) => (
            <View style={styles.recipeRow}>
              {item.imageUrl ? (
                <Image source={{ uri: item.imageUrl }} style={styles.visual} />
              ) : (
                <View style={[styles.visual, styles.visualPlaceholder]}>
                  <AppIcon name="utensils" size={24} color={Colors.primary} />
                </View>
              )}
              <View style={styles.recipeBody}>
                <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
                <Text style={styles.meta}>{item.category}</Text>
                {item.popular ? (
                  <Text style={styles.popular}>{t("admin.recipeForm.popular")}</Text>
                ) : null}
              </View>
              <View style={styles.actions}>
                <Pressable
                  style={styles.actionButton}
                  onPress={() => navigation.navigate("AdminRecipeForm", { recipeId: item._id })}
                >
                  <AppIcon name="pencil" size={18} color={Colors.primary} />
                  <Text style={styles.actionText}>{t("admin.recipes.edit")}</Text>
                </Pressable>
                <Pressable
                  style={styles.actionButton}
                  onPress={() => deleteRecipe(item)}
                >
                  <AppIcon name="trash" size={18} color={Colors.danger} />
                  <Text style={[styles.actionText, styles.deleteText]}>
                    {t("admin.recipes.delete")}
                  </Text>
                </Pressable>
              </View>
            </View>
          )}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  listContent: {
    gap: 12,
    paddingBottom: 24,
  },
  recipeRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: Radius.lg,
    backgroundColor: Colors.surface,
    padding: 10,
    gap: 12,
    ...Shadow,
  },
  visual: {
    width: 72,
    height: 72,
    borderRadius: Radius.md,
  },
  visualPlaceholder: {
    backgroundColor: Colors.primaryPale,
    alignItems: "center",
    justifyContent: "center",
  },
  recipeBody: {
    flex: 1,
    gap: 4,
  },
  name: {
    color: Colors.textDark,
    fontSize: 15,
    fontWeight: "900",
  },
  meta: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: "600",
  },
  popular: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: "800",
  },
  actions: {
    gap: 8,
  },
  actionButton: {
    minWidth: 74,
    minHeight: 38,
    borderRadius: Radius.pill,
    backgroundColor: Colors.primaryPale,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 5,
    paddingHorizontal: 10,
  },
  actionText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: "900",
  },
  deleteText: {
    color: Colors.danger,
  },
});
