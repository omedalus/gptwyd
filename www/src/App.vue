<script setup lang="ts">
import { ref, onMounted } from 'vue';

import Header from '@/components/Header.vue';

onMounted(() => {});
</script>

<template>
  <Header></Header>

  <main>
    <div class="mainblock"></div>
  </main>
</template>

<style scoped lang="scss">
.mainblock {
  margin: auto;
}
</style>
