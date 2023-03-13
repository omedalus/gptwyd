<script setup lang="ts">
import type { OpenAIApi } from 'openai';
import { ref, watch } from 'vue';

import WordTreeNode from '@/model/WordTreeNode';

// This guide is useful for working with contenteditable elements
// in Vue3.
// https://dev.to/pyrsmk/how-to-use-the-contenteditable-attribute-in-vue-3-a89

const elemSeedText = ref();

const seedtext = ref('');
const isEditableFocused = ref(false);

const rootWordTreeNode = ref(new WordTreeNode());
const currentWordTreeNode = ref(rootWordTreeNode.value);

const isRequestInFlight = ref(false);

const props = defineProps<{
  openai: OpenAIApi;
}>();

const blurEventTarget = (ev: Event) => {
  // Don't blur if shift key is being pressed.
  if ((ev as KeyboardEvent).shiftKey) {
    return;
  }
  (ev?.target as HTMLInputElement)?.blur();
};

const updateSeedText = () => {
  seedtext.value = elemSeedText?.value?.innerText?.trim() || '';

  rootWordTreeNode.value = new WordTreeNode();
  rootWordTreeNode.value.word = seedtext.value;
  currentWordTreeNode.value = rootWordTreeNode.value;
};

const requestNextOptionList = async (prompt: string) => {
  if (!prompt) {
    return [];
  }
  isRequestInFlight.value = true;
  const completion = await props.openai.createCompletion({
    model: 'text-davinci-003',
    prompt: prompt,
    max_tokens: 1,
    logprobs: 5 // The most we can request is 5.
  });
  isRequestInFlight.value = false;
  const topLogProbsArray = completion.data.choices[0].logprobs?.top_logprobs || [];
  if (!topLogProbsArray.length) {
    return [];
  }
  const topLogProbsDict = topLogProbsArray[0] as { [key: string]: number };
  let nextWordChoices = [] as { word: string; prob: number }[];
  [...Object.keys(topLogProbsDict)].forEach((word: string) => {
    if (!word.trim() || word === '↵') {
      return;
    }
    const logit = topLogProbsDict[word];
    const prob = Math.exp(logit);
    nextWordChoices.push({ word, prob });
  });
  nextWordChoices = nextWordChoices.sort((a, b) => b.prob - a.prob);
  return nextWordChoices;
};

watch(currentWordTreeNode, async (newVal, oldVal) => {
  console.log('New current node.');
  if (!currentWordTreeNode.value.word) {
    return;
  }
  if (currentWordTreeNode.value.haveChildrenBeenPopulated) {
    return;
  }

  console.log('Current node children have not been populated. Requesting.');
  const prompt = currentWordTreeNode.value.cumulativeText;
  const nextWordChoices = await requestNextOptionList(prompt);
  nextWordChoices.forEach((wordchoice) => {
    const wtnode = new WordTreeNode();
    wtnode.parent = currentWordTreeNode.value;
    wtnode.word = wordchoice.word;
    wtnode.probability = wordchoice.prob;
    currentWordTreeNode.value.children.push(wtnode);
  });
  currentWordTreeNode.value.haveChildrenBeenPopulated = true;
});

const getColorFromProbability = (prob: number) => {
  prob = Math.max(0, prob);
  prob = Math.min(1, prob);

  const PEAK_V = 240;
  const v = Math.floor(PEAK_V * (1 - prob));

  const retval = `rgb(${v}, 255, ${v})`;
  return retval;
};
</script>

<template>
  <div class="nextwordexplorer">
    <h2>Next Word Explorer</h2>

    <div class="current-text-display">
      <div class="current-text-display-entry-area" v-if="currentWordTreeNode.parent === null">
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
            updateSeedText();
          "
        >
          {{ seedtext }}
        </div>
        <div class="submission-instructions">
          To submit, press Enter or click out of the editable box.
        </div>
      </div>
      <div class="current-text-treedeep" v-else>
        {{ currentWordTreeNode.parent.cumulativeText
        }}<strong>{{ currentWordTreeNode.word }}</strong>
      </div>
    </div>

    <div class="completion-tree-view">
      <div class="completion-tree-view-options">
        <div
          class="completion-tree-view-option"
          v-for="(child, iChild) in currentWordTreeNode.children"
          :key="iChild"
          @click="currentWordTreeNode = child"
        >
          <div
            class="completion-tree-view-option-inner"
            :style="{
              height: (child.probability * 100).toFixed(2) + '%',
              backgroundColor: getColorFromProbability(child.probability)
            }"
          >
            <div class="completion-option-word">
              {{ child.word }}
            </div>
            <div class="completion-option-probability">
              {{ (child.probability * 100).toFixed(2) }}%
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.nextwordexplorer {
  .current-text-display {
    .current-text-display-entry-area {
      margin: 0 1em;
      text-align: left;

      position: relative;

      .current-text-editable {
        border: 1px solid #888;
        border-radius: 1ex;

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

  .completion-tree-view {
    height: 20em;
  }

  .completion-tree-view-options {
    display: flex;
    flex-direction: row;
    gap: 1ex;
    height: 100%;
    margin-top: 1em;
    margin-left: 1ex;
    margin-right: 1ex;
    background-color: #eee;
    border-radius: 1ex;

    .completion-tree-view-option {
      flex: 1;
      height: 100%;
      background-color: #e0e0e0;
      border-radius: 1ex;
      cursor: pointer;

      &:hover {
        background-color: #e0ece0;

        .completion-tree-view-option-inner {
          outline-color: #0f0;
          background-color: #ffd !important;
        }
      }
    }

    .completion-tree-view-option-inner {
      border: 1px solid #664;
      min-height: 3em;
      border-radius: 1ex;
      box-shadow: inset 0 -0.5ex 0.5ex #242a;
      outline: 2px solid transparent;

      .completion-option-word {
        color: #000;
        font-weight: bold;
      }
      .completion-option-probability {
        font-size: 0.875rem;
        font-style: italic;
      }
    }
  }

  .current-text-treedeep {
    margin-right: 1em;
    margin-left: 1em;
    border: 1px solid #888;
    border-radius: 1ex;
    text-align: left;
    padding: 0.5ex 1ex;
    background-color: #eed;
  }
}
</style>
