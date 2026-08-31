import React, { useEffect, useRef, useState } from 'react';
import { Animated, FlatList, Pressable, Text, View } from 'react-native';
import AppHeader from '../components/AppHeader';
import FeedCategoryChips from '../components/FeedCategoryChips';
import { FeedCard } from '../components/FeedCard';
import FilterChip from '../components/FilterChip';
import TopicDropdown from '../components/TopicDropdown';
import { useFeed } from '../hooks/use-feed';
import { styles } from './styles/feed.styles';
import { Divider, Loading, SectionLabel } from '../ui';

export { FeedCard } from '../components/FeedCard';
export { formatFeedDate } from '../components/FeedCard';

type Props = {
  onOpenArchive: () => void;
  onHome?: () => void;
};

export default function FeedScreen({ onOpenArchive, onHome }: Props) {
  const model = useFeed();
  const [compactVisible, setCompactVisible] = useState(false);
  const compactAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(compactAnim, {
      toValue: compactVisible ? 1 : 0,
      duration: compactVisible ? 190 : 145,
      useNativeDriver: true,
    }).start();
  }, [compactAnim, compactVisible]);

  return (
    <View style={styles.root}>
      <FlatList
        data={model.loading ? [] : model.items}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={32}
        onScroll={event => {
          const y = event.nativeEvent.contentOffset.y;
          setCompactVisible(current => (current ? y >= 130 : y > 210));
        }}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.fullHeader}>
            <AppHeader
              title="Gündem"
              subtitle="Takiplerinle ilgili son bulunan kayıtlar burada. Bir kaydın burada görünmesi yeni yayımlandığı anlamına gelmez; yayın tarihi haber kartında gösterilir."
              kicker="HEADSUP / DISCOVERY FEED"
              onLogoPress={onHome}
            />

            <View style={styles.headerControls}>
              <View style={styles.streamBadge}>
                <View style={styles.streamDot} />
                <Text style={styles.streamText}>SON KAYITLAR</Text>
              </View>
              <Pressable onPress={onOpenArchive} style={styles.archiveButton}>
                <Text style={styles.archiveButtonText}>Eski haberleri göster</Text>
                <View style={styles.archiveLine} />
              </Pressable>
            </View>

            <Divider />
            <SectionLabel>Kategoriler</SectionLabel>
            <FeedCategoryChips
              categories={model.sortedCategories}
              category={model.category}
              onSelect={model.selectCategory}
            />

            <View style={styles.topicSection}>
              <View style={styles.topicSectionHeader}>
                <SectionLabel>Başlıklar</SectionLabel>
                <Text style={styles.topicSectionMeta}>
                  {model.category ? `${model.category} içindeki takipler` : 'Tüm takipler'} ·
                  alfabetik
                </Text>
              </View>
              <TopicDropdown
                options={model.topicOptions}
                selectedId={model.watchId}
                onChange={model.setWatchId}
                allLabel="Hepsi"
              />
            </View>

            <View style={styles.filtersRow}>
              <SectionLabel>Görünüm</SectionLabel>
              <View style={styles.filters}>
                <FilterChip
                  label="Hepsi"
                  selected={model.filter === 'all'}
                  onPress={() => model.setFilter('all')}
                />
                <FilterChip
                  label="Önemli"
                  selected={model.filter === 'important'}
                  onPress={() => model.setFilter('important')}
                />
                <FilterChip
                  label="Okunmamış"
                  selected={model.filter === 'unread'}
                  onPress={() => model.setFilter('unread')}
                />
              </View>
            </View>

            {model.error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{model.error}</Text>
                <Pressable onPress={() => void model.loadFeed()}>
                  <Text style={styles.retryText}>Tekrar dene</Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          model.loading ? (
            <View style={styles.loadingBox}>
              <Loading label="Kayıtlar yükleniyor" />
            </View>
          ) : (
            <EmptyFeed />
          )
        }
        renderItem={({ item, index }) => <FeedCard item={item} index={index} />}
        ListFooterComponent={
          model.items.length && !model.loading ? (
            <Pressable onPress={onOpenArchive} style={styles.footerArchive}>
              <View style={styles.footerArchiveRule} />
              <Text style={styles.footerArchiveTitle}>Eski haberleri göster</Text>
              <Text style={styles.footerArchiveMeta}>Arşiv · 3 kayıt / sayfa</Text>
            </Pressable>
          ) : null
        }
      />

      <Animated.View
        pointerEvents={compactVisible ? 'auto' : 'none'}
        style={[
          styles.compactPanel,
          {
            opacity: compactAnim,
            transform: [
              {
                translateY: compactAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-12, 0],
                }),
              },
            ],
          },
        ]}
      >
        <View style={styles.compactTopRow}>
          <Text style={styles.compactTitle}>Gündem</Text>
          <Pressable onPress={onOpenArchive}>
            <Text style={styles.compactArchive}>ARŞİV</Text>
          </Pressable>
        </View>
        <FeedCategoryChips
          categories={model.sortedCategories}
          category={model.category}
          onSelect={model.selectCategory}
          compact
        />
        <TopicDropdown
          options={model.topicOptions}
          selectedId={model.watchId}
          onChange={model.setWatchId}
          allLabel="Hepsi"
          compact
        />
        <View style={styles.compactFilters}>
          <FilterChip
            label="Hepsi"
            selected={model.filter === 'all'}
            compact
            onPress={() => model.setFilter('all')}
          />
          <FilterChip
            label="Önemli"
            selected={model.filter === 'important'}
            compact
            onPress={() => model.setFilter('important')}
          />
          <FilterChip
            label="Okunmamış"
            selected={model.filter === 'unread'}
            compact
            onPress={() => model.setFilter('unread')}
          />
        </View>
      </Animated.View>
    </View>
  );
}

function EmptyFeed() {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyGold} />
      <Text style={styles.emptyKicker}>NO MATCHING RECORD</Text>
      <Text style={styles.emptyTitle}>Bu görünümde kayıt yok</Text>
      <Text style={styles.emptyText}>
        Yeni bir gelişme bulunduğunda veya geçmiş taramasında ilgili bir kayıt keşfedildiğinde
        burada görünür.
      </Text>
    </View>
  );
}
