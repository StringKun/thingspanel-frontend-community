<script lang="ts" setup>
import { computed, ref } from 'vue';
import { usePanelStore } from '@/store/modules/panel';
// import type { ICardData } from "@/components/panel/card";

const props = defineProps<{
  view?: boolean;
  data: any;
}>();
const refComp = ref<any>();
const cardId = computed(() => props.data?.cardId);
const store = usePanelStore();
const findCardComponent = (id: string) => {
  console.log('zh_favor', id);
  const cIds = id.split('-');
  const cId = `${cIds[0]}-${cIds[1]}`;
  return store.$state.cardMap.get(cId)?.component || null;
};
const componentStyle = computed(() => ({
  height: props.data.basicSettings?.showTitle ? 'calc(100% - 28px)' : '100%'
}));
defineExpose({
  getComponent: () => {
    return refComp.value;
  }
});
</script>

<template>
  <NCard
    class="relative h-full w-full"
    content-style="padding: 0px; display: flex; flex-direction: column; height: 100%;"
  >
    <div
      v-if="data.basicSettings?.showTitle"
      class="min-title-height h-7 w-full truncate border-gray-200 px-2 font-size-16px leading-7 dark:border-gray-200/10"
    >
      {{ data.basicSettings?.title }}
    </div>
    <div
      class="w-full flex-1"
      :style="componentStyle"
      :class="{ 'p-0 pb-1px': view, 'p-4': !view, 'pt-0': data.basicSettings?.showTitle }"
    >
      <component
        :is="findCardComponent(cardId || '')"
        ref="refComp"
        class="relative h-full w-full"
        :card="props.data"
        :view="view"
      />
    </div>
  </NCard>
</template>

<style scoped>
.w {
  width: 100%;
  height: 100%;
}
.min-title-height {
  min-height: 28px;
}
</style>
