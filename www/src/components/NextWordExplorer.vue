<script setup lang="ts">
import type { OpenAIApi } from 'openai';
import { ref } from 'vue';

// This guide is useful for working with contenteditable elements
// in Vue3.
// https://dev.to/pyrsmk/how-to-use-the-contenteditable-attribute-in-vue-3-a89

const elemSeedText = ref();

const seedtext = ref('');
const isEditableFocused = ref(false);

defineProps<{
  openai: OpenAIApi;
}>();

const blurEventTarget = (ev: Event) => {
  // Don't blur if shift key is being pressed.
  if ((ev as KeyboardEvent).shiftKey) {
    return;
  }
  (ev?.target as HTMLInputElement)?.blur();
};

const submitSeedText = () => {
  seedtext.value = elemSeedText?.value?.innerText?.trim() || '';
  console.log('Submitting seedtext ', seedtext.value);
};
</script>

<template>
  <div class="nextwordexplorer">
    <h2>Next Word Explorer</h2>

    <div class="current-text-display">
      <div class="current-text-display-entry-area">
        <div
          class="current-text-editable"
          :class="{ 'editable-empty': !seedtext && !isEditableFocused }"
          ref="elemSeedText"
          contenteditable
          spellcheck="true"
          @keydown.enter="blurEventTarget($event)"
          @focus="isEditableFocused = true"
          @blur="
            isEditableFocused = false;
            submitSeedText();
          "
        >
          {{ seedtext }}
        </div>
      </div>
      <div class="submission-instructions">
        To submit, press Enter or click out of the editable box.
      </div>
    </div>

    <div class="completion-tree-view">
      <h3>Completion tree</h3>
      <p>
        {{ seedtext }}
      </p>
    </div>
  </div>
</template>

<style scoped lang="scss">
.nextwordexplorer {
  .current-text-display {
    .current-text-display-entry-area {
      border: 1px solid #888;
      margin: 0 1em;
      border-radius: 1ex;
      text-align: left;

      position: relative;

      .current-text-editable {
        min-height: 5em;
        position: relative;
        padding: 0.5ex 1ex;
        box-sizing: border-box;

        &::after {
          content: 'Enter the beginning of a text passage here. GPT will continue it using various explorable branches of possibilities that you can unfold word by word.';
          padding: 0.5ex 1ex;
          box-sizing: border-box;
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          font-style: italic;
          color: #888;
          display: none;
        }

        &.editable-empty {
          &::after {
            display: block;
          }
        }
      }
    }
  }

  .submission-instructions {
    font-size: 0.875rem;
    text-align: right;
    font-style: italic;
    margin-right: 2em;
    color: #888;
  }
}
</style>
