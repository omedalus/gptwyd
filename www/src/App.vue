<script setup lang="ts">
import { ref, onMounted } from 'vue';

import Header from '@/components/Header.vue';
import PanelSlider from './components/PanelSlider.vue';
import NextWordExplorer from './components/NextWordExplorer.vue';
import EmbeddingTriangulator from './components/EmbeddingTriangulator.vue';

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

const currentSlideState = ref('middle' as 'middle' | 'left' | 'right');

const onSlide = (dir: 'left' | 'right') => {
  if (currentSlideState.value === 'middle') {
    currentSlideState.value = dir;
    return;
  }
  if (currentSlideState.value === 'left' && dir === 'right') {
    currentSlideState.value = 'middle';
    return;
  }
  if (currentSlideState.value === 'right' && dir === 'left') {
    currentSlideState.value = 'middle';
    return;
  }
};

onMounted(() => {});
</script>

<template>
  <Header></Header>

  <main>
    <div class="interactive-panels mainblock" :class="`panel-slider-${currentSlideState}`">
      <div class="interactive-panel panel-left interactive-panels--nextword">
        <NextWordExplorer :openai="openai"></NextWordExplorer>
      </div>
      <div class="panelchooser">
        <PanelSlider @slide="onSlide($event)"></PanelSlider>
      </div>
      <div class="panelseparator"></div>
      <div class="interactive-panel panel-right interactive-panels--embeddingdistance">
        <EmbeddingTriangulator :openai="openai"></EmbeddingTriangulator>
      </div>
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

  &.panel-slider-left {
    .panel-left {
      flex: 0;
      & > * {
        display: none;
      }
    }
  }

  &.panel-slider-right {
    .panel-right {
      flex: 0;
      & > * {
        display: none;
      }
    }
  }

  .panelseparator {
    display: none;
  }

  @media screen and (max-width: 1024px) {
    display: block;
    max-width: 640px;
    margin-left: auto;
    margin-right: auto;

    .panelchooser {
      display: none;
    }

    .panelseparator {
      display: block;
      height: 3em;
    }
  }

  .interactive-panel {
    position: relative;

    flex: 1;
    margin-top: 0;
    text-align: center;

    border: 2px solid #cc8;
    border-radius: 1em;

    background-color: #fff;

    transition: flex 0.25s;
  }
}
</style>
