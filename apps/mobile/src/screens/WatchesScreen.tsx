import React, { useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import AppHeader from '../components/AppHeader';
import CategoryPickerModal from '../components/CategoryPickerModal';
import ConfirmModal from '../components/ConfirmModal';
import EditWatchModal from '../components/EditWatchModal';
import WatchCard from '../components/WatchCard';
import { useWatches } from '../hooks/use-watches';
import { styles } from './styles/watches.styles';
import type { Watch } from '../types';
import { Loading, SectionLabel } from '../ui';

export default function WatchesScreen({ onHome }: { onHome?: () => void }) {
  const model = useWatches();
  const [deleteTarget, setDeleteTarget] = useState<Watch | null>(null);
  const [categoryTarget, setCategoryTarget] = useState<Watch | null>(null);
  const [editTarget, setEditTarget] = useState<Watch | null>(null);

  async function confirmDelete() {
    if (!deleteTarget) return;
    if (await model.remove(deleteTarget)) setDeleteTarget(null);
  }

  async function saveEdit(prompt: string, requiredTerms: string[]) {
    if (!editTarget) return;
    if (await model.edit(editTarget, prompt, requiredTerms)) setEditTarget(null);
  }

  return (
    <>
      <View style={styles.root}>
        <View style={styles.header}>
          <AppHeader
            title="Takiplerim"
            subtitle="Aktif takipleri yönet, kategoriyi değiştir veya istediğin an manuel tarama başlat."
            kicker="HEADSUP / WATCH CONTROL"
            onLogoPress={onHome}
          />
        </View>

        {model.error ? (
          <View style={styles.globalError}>
            <Text style={styles.globalErrorText}>{model.error}</Text>
          </View>
        ) : null}

        {model.loading ? (
          <Loading label="Takipler yükleniyor" />
        ) : (
          <FlatList
            data={model.watches}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.list}
            ListHeaderComponent={
              <View style={styles.listHeader}>
                <SectionLabel>{`${model.watches.length} aktif kayıt / kontrol paneli`}</SectionLabel>
              </View>
            }
            ListEmptyComponent={<EmptyWatches />}
            renderItem={({ item, index }) => (
              <WatchCard
                watch={item}
                index={index}
                running={Boolean(model.running[item.id])}
                runStatus={model.runStatus[item.id]}
                onCategory={() => setCategoryTarget(item)}
                onEdit={() => setEditTarget(item)}
                onPatch={patch => void model.patch(item, patch).catch(() => undefined)}
                onRun={() => void model.runNow(item)}
                onDelete={() => setDeleteTarget(item)}
              />
            )}
          />
        )}
      </View>

      <ConfirmModal
        visible={Boolean(deleteTarget)}
        title="Takibi sil"
        message={
          deleteTarget
            ? `“${deleteTarget.topic}” takibi ve bu takibe bağlı kayıtlar silinsin mi?`
            : ''
        }
        busy={model.deleting}
        onCancel={() => !model.deleting && setDeleteTarget(null)}
        onConfirm={() => void confirmDelete()}
      />

      <EditWatchModal
        watch={editTarget}
        busy={model.editing}
        onClose={() => !model.editing && setEditTarget(null)}
        onSave={(prompt, requiredTerms) => void saveEdit(prompt, requiredTerms)}
      />

      <CategoryPickerModal
        visible={Boolean(categoryTarget)}
        current={categoryTarget?.category}
        categories={model.categories}
        onClose={() => setCategoryTarget(null)}
        onSelect={category => {
          if (!categoryTarget) return;
          void model.patch(categoryTarget, { category }).catch(() => undefined);
        }}
      />
    </>
  );
}

function EmptyWatches() {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyLine} />
      <Text style={styles.emptyKicker}>WATCH LIST</Text>
      <Text style={styles.emptyTitle}>Henüz takip yok</Text>
      <Text style={styles.emptyText}>Yeni Takip bölümünden ilk konunu ekleyebilirsin.</Text>
    </View>
  );
}
