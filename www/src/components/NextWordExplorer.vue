<script setup lang="ts">
import type { OpenAIApi } from 'openai';
import { ref, computed, watch, onMounted } from 'vue';

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

const selectedChildIndex = ref(0);

const props = defineProps<{
  openai: OpenAIApi;
}>();

const selectedChild = computed(() => {
  if (!currentWordTreeNode.value) {
    return null;
  }
  const retval = currentWordTreeNode.value.children[selectedChildIndex.value];
  if (!retval) {
    return null;
  }
  return retval;
});

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
    if (!word.trim() || word === '↵' || word.startsWith('bytes')) {
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
  if (!currentWordTreeNode.value.word) {
    return;
  }
  if (currentWordTreeNode.value.haveChildrenBeenPopulated) {
    return;
  }

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
  selectedChildIndex.value = 0;
});

const getColorFromProbability = (prob: number) => {
  prob = Math.max(0, prob);
  prob = Math.min(1, prob);

  const PEAK_V = 240;
  const v = Math.floor(PEAK_V * (1 - prob));

  const retval = `rgb(${v}, 255, ${v})`;
  return retval;
};

const onKeydown = (event: KeyboardEvent) => {
  if (event.target !== document.body) {
    // Only pay attention to key presses that have nowhere else to go.
    return;
  }

  if (
    event.key === 'ArrowDown' &&
    selectedChildIndex.value < currentWordTreeNode.value.children.length - 1
  ) {
    selectedChildIndex.value++;
    event.preventDefault();
    return;
  }
  if (event.key === 'ArrowUp' && selectedChildIndex.value > 0) {
    selectedChildIndex.value--;
    event.preventDefault();
    return;
  }

  if (event.key === 'ArrowLeft' && currentWordTreeNode.value.parent !== null) {
    currentWordTreeNode.value = currentWordTreeNode.value.parent;
    event.preventDefault();
    return;
  }

  if (selectedChild.value) {
    if (event.key === 'ArrowRight' || event.key === 'Enter') {
      currentWordTreeNode.value = selectedChild.value;
      event.preventDefault();
      return;
    }
  }
};

onMounted(() => {
  window.addEventListener('keydown', onKeydown);
});

const explanationShow = ref(true);
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
      </div>
      <div class="current-text-treedeep-holder" v-else>
        <div
          class="current-text-arrow-back gptwyd-btn"
          @click="currentWordTreeNode = currentWordTreeNode.parent || currentWordTreeNode"
        >
          <span class="unicode-droid"> 🡄 </span>
        </div>
        <div class="current-text-treedeep">
          {{ currentWordTreeNode.parent.cumulativeText
          }}<strong>{{ currentWordTreeNode.word }}</strong>
        </div>
      </div>

      <div class="submission-instructions">
        <div v-if="currentWordTreeNode.parent === null">
          To submit, press Enter or click out of the editable box.
        </div>
        <div v-else>You can use your arrow keys to navigate the options.</div>
      </div>
    </div>

    <div class="completion-tree-view">
      <div class="completion-tree-view-options">
        <div
          class="completion-tree-view-option"
          v-for="(child, iChild) in currentWordTreeNode.children"
          :key="iChild"
          @click="currentWordTreeNode = child"
          :class="{ 'child-selected': iChild === selectedChildIndex }"
        >
          <div class="completion-tree-view-option-bar-groove">
            <div
              class="completion-tree-view-option-bar"
              :style="{
                width: (child.probability * 100).toFixed(2) + '%',
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
          <div class="next-descendant-texts-holder">
            <div class="next-descendant-texts">
              <div class="next-descendant-text-items">
                <div
                  v-for="nexttext in child.descendantTexts"
                  :key="nexttext"
                  class="next-descendant-text-item"
                >
                  {{ nexttext }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="nextword-explanation">
      <div class="explanation-showhide" style="text-align: right; padding-bottom: 0.5ex">
        <a v-if="explanationShow" @click="explanationShow = false">Hide explanation</a>
        <a v-if="!explanationShow" @click="explanationShow = true">Show explanation</a>
      </div>
      <div class="explanation-content" v-if="explanationShow">
        <p>
          On its most fundamental level, GPT is simply
          <a target="_blank" href="https://www.google.com/search?q=%22turbocharged+autocomplete%22">
            "turbocharged autocomplete"</a
          >. It's a very large deep neural network whose input is all of the words in a conversation
          (including its own), and whose output is the next word that is likeliest to follow. With
          the <em>Next Word Explorer</em> presented here, you can investigate its lists of likeliest
          output word candidates, and see how its choices unfold.
        </p>
        <p>
          For more visualization and discussion, please read
          <a target="_blank" href="https://alpa84.github.io/garden_of_forking_paths">
            "ChatGPT as a garden of forking paths" by Alejandro Panza</a
          >.
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.nextwordexplorer {
  display: flex;
  flex-direction: column;
  height: 100%;

  .current-text-display {
    .current-text-display-entry-area {
      margin: 0 1em;
      text-align: left;

      position: relative;

      .current-text-editable {
        border: 1px solid #888;
        border-radius: 1ex;

        min-height: 3.5em;
        position: relative;
        padding: 0.5ex 1ex;
        box-sizing: border-box;

        @media screen and (max-width: 1280px) {
          min-height: 5.5em;
        }

        &::after {
          content: 'Enter the beginning of a text passage here. GPT will autocomplete it using various explorable branches of possibilities that you can unfold word by word.';
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
    height: 100%;
    user-select: none;
  }

  .completion-tree-view-options {
    display: flex;
    flex-direction: column;
    gap: 1ex;
    height: calc(100% - 1em);
    min-height: 35em;
    margin-top: 1em;
    margin-left: 1ex;
    margin-right: 1ex;
    background-color: #eee;
    border-radius: 1ex;

    .completion-tree-view-option {
      flex: 1;
      height: 100%;
      border-radius: 1ex;
      cursor: pointer;

      &:hover,
      &.child-selected {
        .completion-tree-view-option-bar-groove {
          background-color: #8c8;
        }

        .completion-tree-view-option-bar {
          outline-color: #0f0;
          background-color: #ffd !important;
          box-shadow: inset 0 -0.25ex 0.25ex #242a;
        }
      }
    }

    .completion-tree-view-option-bar-groove {
      background-color: #e0e0e0;
      position: relative;
    }

    .completion-tree-view-option-bar {
      border: 1px solid #664;
      height: 1.5em;
      border-radius: 1ex;
      outline: 2px solid transparent;
      text-align: left;

      .completion-option-word {
        color: #000;
        font-weight: bold;
        margin-left: 1em;
        position: relative;
        z-index: 1;
      }
      .completion-option-probability {
        font-size: 0.875rem;
        font-style: italic;
        position: absolute;
        top: 0.5ex;
        right: 0;
      }
    }
  }

  .current-text-treedeep-holder {
    margin-right: 1em;
    margin-left: 1em;
    display: flex;
    flex-direction: row;
    gap: 1em;

    .current-text-treedeep {
      flex-grow: 1;
      border: 1px solid #888;
      border-radius: 1ex;
      text-align: left;
      padding: 0.5ex 1ex;
      background-color: #eed;
      min-height: 3em;

      @media screen and (max-width: 1280px) {
        min-height: 5em;
      }
    }
  }

  .next-descendant-texts-holder {
    position: relative;
    height: calc(100% - 2em);
  }
  .next-descendant-texts {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: 100%;

    text-align: left;
    padding: 1ex 1em;
    padding-right: 0;

    display: flex;
    flex-direction: column;
    box-sizing: border-box;

    h3 {
      margin-bottom: 0;
    }

    .next-descendant-text-items {
      height: 100%;
      max-height: 100%;
      min-height: 3em;
      overflow-y: auto;
      margin-left: 1em;
      padding: 0.5ex 1em;
      font-size: 0.875rem;

      .next-descendant-text-item {
        white-space: nowrap;
        text-overflow: ellipsis;
        background-color: #ffd;
        margin-bottom: 0.5ex;
      }
    }
  }

  .nextword-explanation {
    margin: 1ex 1em;
    font-size: 0.875rem;
    text-align: left;
  }

  .current-text-arrow-back {
    font-size: 2rem;
  }
}
</style>
