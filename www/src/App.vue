<script setup lang="ts">
import { ref, onMounted } from 'vue';

import Header from '@/components/Header.vue';

onMounted(() => {});
</script>

<template>
  <Header></Header>

  <main>
    <div class="interactive-panels mainblock">
      <div class="interactive-panel interactive-panels--nextword"></div>
      <div class="interactive-panel interactive-panels--embeddingdistance"></div>
    </div>
  </main>
</template>

<style scoped lang="scss">
.mainblock {
  margin: auto;
}

.interactive-panels {
  display: flex;
  flex-direction: row;
  min-height: calc(100vh - 6em);
  padding: 1em;
  gap: 1em;

  @media screen and (max-width: 960px) {
    display: block;
    max-width: 640px;
    margin-left: auto;
    margin-right: auto;
  }

  .interactive-panel {
    flex: 1;
    margin-top: 0;
    text-align: center;
    min-width: 16em;

    border: 2px solid #cc8;
    border-radius: 1em;

    background-color: #fff;
  }
}
</style>
