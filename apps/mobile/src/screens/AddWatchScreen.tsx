import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import AppHeader from '../components/AppHeader';
import CategoryPickerModal from '../components/CategoryPickerModal';
import RequiredTermsPicker from '../components/RequiredTermsPicker';
import SoftProgressBar from '../components/SoftProgressBar';
import { useAddWatch } from '../hooks/use-add-watch';
import { styles } from './styles/add-watch.styles';
import type { NotificationMode } from '../types';
import { Button, Divider, Field, SectionLabel } from '../ui';

type Props = { onAdded: () => void; onHome?: () => void };

const modes: Array<[NotificationMode, string, string]> = [
  ['IMPORTANT_ONLY', 'Sadece önemli gelişmeler', 'Önerilen'],
  ['ALL_RELEVANT', 'Her ilgili haberde', 'Yoğun'],
  ['SELECTED_EVENTS', 'Takip isteğindeki olaylarda', 'Seçici'],
  ['OFF', 'Bildirim kapalı', 'Sessiz'],
];

export default function AddWatchScreen({ onAdded, onHome }: Props) {
  const model = useAddWatch(onAdded);
  const [categoryPickerOpen, setCategoryPickerOpen] = useState(false);

  return (
    <>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.root}
      >
        <AppHeader
          title="Yeni takip"
          subtitle="Konunu yaz, onayla ve haberde mutlaka geçmesini istediğin kelimeleri seç. Yazım, aksan ve büyük/küçük harf farkları eşleşmeyi bozmaz."
          kicker="HEADSUP / CREATE WATCH"
          onLogoPress={onHome}
        />

        <SectionLabel>Takip isteği</SectionLabel>
        <View style={styles.promptCard}>
          <View style={styles.promptHeader}>
            <View style={styles.promptIndex}>
              <Text style={styles.promptIndexText}>01</Text>
            </View>
            <View style={styles.promptHeaderText}>
              <Text style={styles.promptTitle}>Neyi takip etmemi istiyorsun?</Text>
              <Text style={styles.example}>
                Örn. “Neon Genesis Evangelion Yōko Taro ile ilgili gelişmeleri takip et.”
              </Text>
            </View>
          </View>
          <Divider />
          <Field
            multiline
            value={model.prompt}
            onChangeText={model.updatePrompt}
            placeholder="Takip edilecek konuyu doğal bir cümleyle yaz..."
            autoCapitalize="sentences"
            autoCorrect
            spellCheck
            style={styles.field}
          />

          <Pressable
            disabled={!model.canConfirm}
            onPress={() => model.setPromptConfirmed(true)}
            style={({ pressed }) => [
              styles.confirmTopic,
              model.promptConfirmed && styles.confirmTopicDone,
              !model.canConfirm && styles.disabled,
              pressed && styles.pressed,
            ]}
          >
            <Text
              style={[
                styles.confirmTopicText,
                model.promptConfirmed && styles.confirmTopicTextDone,
              ]}
            >
              {model.promptConfirmed ? 'Konu onaylandı' : 'Konuyu onayla'}
            </Text>
          </Pressable>

          {model.promptConfirmed ? (
            <RequiredTermsPicker
              text={model.analysisInput}
              selected={model.requiredTerms}
              onChange={model.setRequiredTerms}
            />
          ) : null}

          <View style={styles.analysisPanel}>
            <View style={styles.analysisTop}>
              <Text style={styles.analysisLabel}>OTOMATİK ANALİZ</Text>
              {model.suggestionBusy ? (
                <Text style={styles.analysisMuted}>Kontrol ediliyor...</Text>
              ) : null}
            </View>
            <View style={styles.analysisDivider} />
            <View style={styles.categoryRow}>
              <View style={styles.categoryCopy}>
                <Text style={styles.categoryCaption}>Kategori</Text>
                <Text style={styles.categoryValue}>
                  {model.selectedCategory || 'Henüz belirlenmedi'}
                </Text>
                {model.manualCategory ? <Text style={styles.manualBadge}>ELLE SEÇİLDİ</Text> : null}
              </View>
              <Pressable onPress={() => setCategoryPickerOpen(true)} style={styles.categoryButton}>
                <Text style={styles.categoryButtonText}>
                  {model.selectedCategory ? 'Değiştir' : 'Kategori seç'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>

        {model.showCorrection && model.suggestion ? (
          <View style={styles.suggestionCard}>
            <View style={styles.suggestionGoldLine} />
            <Text style={styles.suggestionEyebrow}>BUNU MU DEMEK İSTEDİNİZ?</Text>
            <Text style={styles.suggestionText}>{model.suggestion.correctedPrompt}</Text>
            <View style={styles.suggestionActions}>
              <Pressable onPress={model.useSuggestion} style={styles.useSuggestionButton}>
                <Text style={styles.useSuggestionText}>Düzeltmeyi kullan</Text>
              </Pressable>
              <Pressable onPress={model.ignoreSuggestion} style={styles.ignoreButton}>
                <Text style={styles.ignoreText}>Yok say</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        <View style={styles.sectionSpacer} />
        <SectionLabel>Bildirim tercihi</SectionLabel>
        <View style={styles.modeList}>
          {modes.map(([value, label, tag]) => {
            const selected = model.mode === value;
            return (
              <Pressable
                key={value}
                onPress={() => model.setMode(value)}
                style={[styles.modeCard, selected && styles.modeCardSelected]}
              >
                <View style={[styles.radio, selected && styles.radioSelected]}>
                  {selected ? <View style={styles.radioDot} /> : null}
                </View>
                <View style={styles.modeCopy}>
                  <Text style={[styles.modeText, selected && styles.modeTextSelected]}>
                    {label}
                  </Text>
                  <Text style={styles.modeTag}>{tag}</Text>
                </View>
                <View style={[styles.modeLine, selected && styles.modeLineSelected]} />
              </Pressable>
            );
          })}
        </View>

        {model.error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorTitle}>Takip oluşturulamadı</Text>
            <Text style={styles.errorText}>{model.error}</Text>
          </View>
        ) : null}
        <Button
          title={model.busy ? 'Takip kaydediliyor...' : 'Takibi başlat'}
          onPress={() => void model.save()}
          disabled={model.busy || !model.canSave}
          style={styles.button}
        />
        {model.busy ? (
          <View style={styles.saveProgress}>
            <SoftProgressBar label="Takip kaydediliyor. İlk haber taraması arka planda devam eder." />
          </View>
        ) : null}
      </ScrollView>

      <CategoryPickerModal
        visible={categoryPickerOpen}
        current={model.selectedCategory}
        categories={model.categories}
        onClose={() => setCategoryPickerOpen(false)}
        onSelect={model.setManualCategory}
      />
    </>
  );
}
