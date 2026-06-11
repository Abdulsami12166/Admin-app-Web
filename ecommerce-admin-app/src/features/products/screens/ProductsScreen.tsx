import React from 'react';
import {Alert, Pressable, StyleSheet, Text, TextInput, View} from 'react-native';

import {ActionButton} from '../../../components/ActionButton';
import {InfoCard} from '../../../components/InfoCard';
import {ListEmpty} from '../../../components/ListEmpty';
import {Screen} from '../../../components/Screen';
import {useDashboardStore} from '../../../store/dashboardStore';
import {palette} from '../../../theme/palette';

const productCategories = [
  'Electronics',
  'Mobiles',
  'Computers',
  'Fashion',
  'Men Clothing',
  'Women Clothing',
  'Kids Clothing',
  'Footwear',
  'Accessories',
  'Beauty',
  'Home & Kitchen',
  'Sports',
  'Toys',
  'Grocery',
];
const fashionCategories = ['fashion', 'men clothing', 'women clothing', 'kids clothing', 'footwear'];
const defaultSizesByCategory: Record<string, string[]> = {
  fashion: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  'men clothing': ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  'women clothing': ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  'kids clothing': ['2Y', '4Y', '6Y', '8Y', '10Y', '12Y'],
  footwear: ['5', '6', '7', '8', '9', '10', '11'],
};

export const ProductsScreen = () => {
  const {createProduct, products, refreshProducts} = useDashboardStore();
  const categories = React.useMemo(() => {
    const counts = new Map<string, number>(productCategories.map(category => [category, 0]));

    products.forEach(product => {
      const category = product.category || 'Uncategorized';
      counts.set(category, (counts.get(category) || 0) + 1);
    });

    return Array.from(counts.entries()).map(([name, count]) => ({name, count}));
  }, [products]);
  const [hiddenCategories, setHiddenCategories] = React.useState<string[]>([]);
  const [form, setForm] = React.useState({
    title: '',
    description: '',
    category: '',
    brand: '',
    price: '',
    discountedPrice: '',
    stock: '',
    image: '',
    sizes: '',
  });
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const normalizedCategory = form.category.trim().toLowerCase();
  const showSizeField = fashionCategories.includes(normalizedCategory);
  const suggestedSizes = defaultSizesByCategory[normalizedCategory] || [];

  function toggleCategoryVisibility(category: string) {
    setHiddenCategories(current =>
      current.includes(category)
        ? current.filter(item => item !== category)
        : [...current, category],
    );
  }

  function selectCategory(category: string) {
    const nextSizes = defaultSizesByCategory[category.trim().toLowerCase()]?.join(', ') || '';
    setForm(current => ({...current, category, sizes: nextSizes}));
  }

  async function handlePushProduct() {
    if (!form.title.trim() || !form.description.trim() || !form.category.trim() || !form.price.trim()) {
      Alert.alert('Complete product', 'Add title, description, category, and price before pushing.');
      return;
    }

    try {
      setIsSubmitting(true);
      await createProduct({
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category.trim(),
        brand: form.brand.trim() || undefined,
        image: form.image.trim() || undefined,
        price: Number(form.price),
        discountedPrice: form.discountedPrice ? Number(form.discountedPrice) : undefined,
        stock: form.stock ? Number(form.stock) : undefined,
        sizes: showSizeField
          ? form.sizes.split(',').map(size => size.trim()).filter(Boolean)
          : undefined,
      });
      setForm({
        title: '',
        description: '',
        category: '',
        brand: '',
        price: '',
        discountedPrice: '',
        stock: '',
        image: '',
        sizes: '',
      });
      Alert.alert('Product pushed', 'The new product is now visible to the ecommerce app.');
    } catch (error: any) {
      Alert.alert('Push failed', error?.message || 'Unable to push the product right now.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Screen
      title="Products Management"
      subtitle="Push a new product with title, image, description, and pricing, then review the live catalog."
      rightSlot={
        <ActionButton
          label="Refresh"
          variant="secondary"
          onPress={() => refreshProducts().catch(() => {})}
        />
      }>
      <View style={styles.categoryCard}>
        <Text style={styles.formTitle}>Category List With Show / Hide</Text>
        {categories.length ? (
          categories.map(category => {
            const hidden = hiddenCategories.includes(category.name);

            return (
              <View key={category.name} style={styles.categoryRow}>
                <View style={styles.categoryCopy}>
                  <Text style={styles.categoryName}>{category.name}</Text>
                  <Text style={styles.categoryMeta}>
                    {category.count} products | {hidden ? 'Hidden locally' : 'Visible'}
                  </Text>
                </View>
                <ActionButton
                  label={hidden ? 'Show' : 'Hide'}
                  variant="secondary"
                  onPress={() => toggleCategoryVisibility(category.name)}
                />
              </View>
            );
          })
        ) : (
          <Text style={styles.emptyCategory}>No categories returned by the product service.</Text>
        )}
      </View>

      <View style={styles.formCard}>
        <Text style={styles.formTitle}>Push Product To Ecommerce</Text>
        <TextInput
          placeholder="Title"
          placeholderTextColor={palette.muted}
          style={styles.input}
          value={form.title}
          onChangeText={value => setForm(current => ({...current, title: value}))}
        />
        <TextInput
          placeholder="Description"
          placeholderTextColor={palette.muted}
          multiline
          style={[styles.input, styles.textArea]}
          value={form.description}
          onChangeText={value => setForm(current => ({...current, description: value}))}
        />
        <TextInput
          placeholder="Category"
          placeholderTextColor={palette.muted}
          style={styles.input}
          value={form.category}
          onChangeText={value => {
            const nextSizes = defaultSizesByCategory[value.trim().toLowerCase()]?.join(', ') || '';
            setForm(current => ({...current, category: value, sizes: nextSizes}));
          }}
        />
        <View style={styles.categoryPicker}>
          {productCategories.map(category => {
            const selected = category === form.category.trim();

            return (
              <Pressable
                key={category}
                onPress={() => selectCategory(category)}
                style={[styles.categoryChip, selected && styles.categoryChipActive]}>
                <Text style={[styles.categoryChipText, selected && styles.categoryChipTextActive]}>
                  {category}
                </Text>
              </Pressable>
            );
          })}
        </View>
        {showSizeField ? (
          <View style={styles.sizeBox}>
            <Text style={styles.sizeLabel}>Sizes for {form.category.trim()}</Text>
            <TextInput
              placeholder="Sizes: S, M, L, XL"
              placeholderTextColor={palette.muted}
              style={styles.input}
              value={form.sizes}
              onChangeText={value => setForm(current => ({...current, sizes: value}))}
            />
            <Text style={styles.sizeHint}>{suggestedSizes.join(' | ')}</Text>
          </View>
        ) : null}
        <TextInput
          placeholder="Brand"
          placeholderTextColor={palette.muted}
          style={styles.input}
          value={form.brand}
          onChangeText={value => setForm(current => ({...current, brand: value}))}
        />
        <TextInput
          placeholder="Image URL"
          placeholderTextColor={palette.muted}
          style={styles.input}
          value={form.image}
          onChangeText={value => setForm(current => ({...current, image: value}))}
        />
        <View style={styles.row}>
          <TextInput
            placeholder="Price"
            placeholderTextColor={palette.muted}
            keyboardType="numeric"
            style={[styles.input, styles.rowInput]}
            value={form.price}
            onChangeText={value => setForm(current => ({...current, price: value}))}
          />
          <TextInput
            placeholder="Discounted price"
            placeholderTextColor={palette.muted}
            keyboardType="numeric"
            style={[styles.input, styles.rowInput]}
            value={form.discountedPrice}
            onChangeText={value => setForm(current => ({...current, discountedPrice: value}))}
          />
        </View>
        <TextInput
          placeholder="Stock"
          placeholderTextColor={palette.muted}
          keyboardType="numeric"
          style={styles.input}
          value={form.stock}
          onChangeText={value => setForm(current => ({...current, stock: value}))}
        />
        <ActionButton label="Push Product" onPress={() => handlePushProduct()} loading={isSubmitting} />
      </View>
      {products.length ? (
        products.map(product => (
          <InfoCard
            key={product._id}
            title={product.title || product.name || product.slug || 'Product'}
            body={`Product ID: ${product._id}\nCategory: ${product.category || 'n/a'}\nBrand: ${product.brand || 'n/a'}\nStock: ${product.stock || 0}\nSizes: ${product.sizes?.length ? product.sizes.join(', ') : 'n/a'}\nDescription: ${product.description || 'n/a'}`}
            footer={`Price: Rs ${product.price || 0} | Published: ${product.isPublished ? 'Yes' : 'No'} | Slug: ${product.slug || 'auto'}`}
          />
        ))
      ) : (
        <ListEmpty message="No products returned by the admin API." />
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  categoryCard: {
    backgroundColor: palette.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: palette.border,
    marginBottom: 16,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: palette.border,
  },
  categoryCopy: {
    flex: 1,
    paddingRight: 10,
  },
  categoryName: {
    color: palette.text,
    fontWeight: '800',
  },
  categoryMeta: {
    color: palette.muted,
    marginTop: 4,
  },
  emptyCategory: {
    color: palette.muted,
    lineHeight: 20,
  },
  formCard: {
    backgroundColor: palette.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: palette.border,
    marginBottom: 16,
  },
  formTitle: {
    color: palette.text,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 12,
  },
  input: {
    minHeight: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.background,
    color: palette.text,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  categoryPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  categoryChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.background,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  categoryChipActive: {
    backgroundColor: palette.primary,
    borderColor: palette.primary,
  },
  categoryChipText: {
    color: palette.text,
    fontWeight: '700',
  },
  categoryChipTextActive: {
    color: palette.background,
  },
  textArea: {
    minHeight: 88,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  rowInput: {
    flex: 1,
  },
  sizeBox: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.background,
    padding: 12,
    marginBottom: 10,
  },
  sizeLabel: {
    color: palette.text,
    fontWeight: '800',
    marginBottom: 8,
  },
  sizeHint: {
    color: palette.muted,
    lineHeight: 20,
  },
});
