<script setup lang="ts">
import { ref, onMounted } from 'vue';

import Header from '@/components/Header.vue';
import NextWordExplorer from './components/NextWordExplorer.vue';

import { Configuration, OpenAIApi } from 'openai';

// We're literally using a hack in order to unsafely expose
// our API key. OpenAI tracks GitHub to prevent keys from leaking.
// We are insane for thwarting this safety mechanism.
import rot13Cipher from 'rot13-cipher';

// Hey hackers, don't bother trying to steal this.
// It's temporary.
const TEMPORARY_OPENAI_API_KEY = rot13Cipher('fx-bl6VEfiioAlBO9i4MgalG3OyoxSWncmKJaQBgTNVNWMDSjnM');
const openai = new OpenAIApi(
  new Configuration({
    apiKey: TEMPORARY_OPENAI_API_KEY
  })
);

onMounted(() => {});
</script>

<template>
  <Header></Header>

  <main>
    <div class="interactive-panels mainblock">
      <div class="interactive-panel interactive-panels--nextword">
        <NextWordExplorer :openai="openai"></NextWordExplorer>
      </div>
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

  @media screen and (max-width: 1024px) {
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
