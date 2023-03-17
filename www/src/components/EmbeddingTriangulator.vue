<script setup lang="ts">
import { ref, watch, computed } from 'vue';

import type { OpenAIApi } from 'openai';

const props = defineProps<{
  openai: OpenAIApi;
}>();

const textRefLeft = ref('');
const textRefRight = ref('');

const elemVariableInput = ref();

const embeddingRefLeft = ref(null as number[] | null);
const embeddingRefRight = ref(null as number[] | null);

const _dot = (v1: number[] | null, v2: number[] | null) => {
  if (!v1 || !v2) {
    return null;
  }
  if (v1.length !== v2.length) {
    return null;
  }
  let retval = 0;
  for (let i = 0; i < v1.length; i++) {
    retval += v1[i] * v2[i];
  }

  // Normalize to a realistic range, because embeddings from GPT
  // are in such a high dimensional space that it's practically impossible
  // to find an actual orthogonal pair.
  retval = (retval - 0.7) / (1 - 0.7);
  retval = Math.max(retval, 0);

  return retval;
};

const _getValueFromEventTarget = (ev: Event) => {
  const retval = (ev.target as HTMLInputElement)?.value || '';
  return retval;
};

const _getEmbeddingVectorForText = async (text: string) => {
  text = (text || '').replace('\n', ' ').trim();
  if (!text) {
    return null;
  }
  console.log('Getting embedding for ', text);
  const embeddingRequest = await props.openai.createEmbedding({
    model: 'text-embedding-ada-002',
    input: text
  });
  const embedding = embeddingRequest?.data?.data[0]?.embedding || [];
  if (!embedding.length) {
    return null;
  }
  return embedding;
};

watch(textRefLeft, async (newval) => {
  embeddingRefLeft.value = await _getEmbeddingVectorForText(newval);
});
watch(textRefRight, async (newval) => {
  embeddingRefRight.value = await _getEmbeddingVectorForText(newval);
});

const refComparison = computed(() => {
  return _dot(embeddingRefLeft.value, embeddingRefRight.value);
});

const colorSimilarity = (similarity: number) => {
  const r = similarity > 0.5 ? 2 * (1 - similarity) : 1;
  const g = similarity < 0.5 ? 2 * similarity : 1;
  const retval = `rgb(${Math.floor(r * 255)}, ${Math.floor(g * 255)}, 0)`;
  return retval;
};

type VariableText = {
  text: string;
  embedding: number[] | null;
};

const updateStupidVizTrick = ref(0);

const variableTexts = ref(Array<VariableText>());

const onVariableTextSubmitted = async (text: string) => {
  text = (text || '').replace('\n', ' ').trim();
  if (!text) {
    return;
  }
  const newVT = {
    text,
    embedding: null
  } as VariableText;
  variableTexts.value.push(newVT);
  newVT.embedding = await _getEmbeddingVectorForText(text);
  updateStupidVizTrick.value = Math.random();
};
</script>

<template>
  <div class="embedding-triangulator-component">
    <h2>Embedding Triangulator</h2>

    <div class="embedding-triangulator-refinput">
      <div class="refinput-instructions">
        <p>
          Enter a pair of "reference texts". These are two short pieces of text &mdash; each a
          phrase or a sentence. Then, enter a "variable text" and press the button to compare it to
          both reference texts.
        </p>
      </div>
      <div class="refinput-fields">
        <textarea
          style="border-left: none"
          :value="textRefLeft"
          @blur="textRefLeft = _getValueFromEventTarget($event)"
          placeholder='Enter a phrase or sentence for the Left Reference Text, e.g. "The cat sat on the rug."'
        ></textarea>
        <div class="refinput-affinities">
          <div v-if="refComparison !== null">
            <div style="padding: 0 1ex">These two texts have a conceptual similarity score of:</div>

            <div
              class="similarity-bar"
              :style="{ backgroundColor: colorSimilarity(refComparison) }"
            >
              {{ (refComparison * 100).toFixed(2) }}%
            </div>
          </div>
        </div>
        <textarea
          style="border-right: none"
          :value="textRefRight"
          @blur="textRefRight = _getValueFromEventTarget($event)"
          placeholder='Enter a phrase or sentence for the Left Reference Text, e.g. "The car sat in the road."'
        ></textarea>
      </div>
      <div class="variable-input-fields">
        <textarea
          ref="elemVariableInput"
          placeholder='Enter a "Variable Text". We&apos;ll compare this text to the two Reference Texts.'
        ></textarea>
        <div
          class="variable-input-button gptwyd-btn"
          @click="
            onVariableTextSubmitted(elemVariableInput.value);
            elemVariableInput.value = '';
          "
        >
          🡇 Compare this text to the two references 🡇
        </div>
      </div>
    </div>

    <div class="triangulated-variables">
      <div class="triangulated-list">
        <div class="triangulated-list-item" v-for="vt in variableTexts" :key="vt.text">
          <div class="triangulated-list-item-text">
            {{ vt.text }}
          </div>
          <div class="triangulated-similarity-bar-holder">
            <div
              v-if="embeddingRefLeft && embeddingRefRight && vt.embedding && updateStupidVizTrick"
            >
              <div class="triangulated-similarity-bar">
                Left: {{ _dot(embeddingRefLeft, vt.embedding) }} Right:
                {{ _dot(embeddingRefRight, vt.embedding) }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="explanation explanation-what-is-embedding">
      <p>
        In
        <a href="https://www.ibm.com/topics/natural-language-processing"
          >natural language processing</a
        >, a
        <a href="https://www.deepset.ai/blog/the-beginners-guide-to-text-embeddings"
          >text embedding</a
        >
        is a long numerical sequence that essentially represents a piece of text encoded as a
        "thoughtform". The numerical values that comprise an embedding are meaningless in and of
        themselves, but embeddings that represent similar concepts or ideas will be similar (i.e.
        proximate) to each other. And, by the same token, embeddings that represent completely
        unrelated concepts will be very dissimilar (i.e. far apart) from one another.
      </p>
    </div>
  </div>
</template>

<style scoped lang="scss">
.embedding-triangulator-component {
  padding: 0 1em;
  box-sizing: border-box;
  height: 100%;
  display: flex;
  flex-direction: column;

  .triangulated-variables {
    height: 100%;
    border: 2px solid #aa8;
    border-top: none;
    border-bottom: none;
    margin-bottom: 1em;
  }

  .embedding-triangulator-refinput {
    background-color: #eed;
    border-radius: 1em 1em 0 0;
    border: 2px solid #aa8;
    border-top-width: 1px;
    border-bottom: none;
    padding-bottom: 1em;

    .refinput-instructions {
      font-size: 0.875;
    }

    .refinput-fields {
      display: flex;
      flex-direction: row;

      & > textarea {
        flex: 1;
        height: 6em;
        resize: none;
      }

      .refinput-affinities {
        font-size: 0.875rem;
        flex: 0.75;
      }
    }
  }

  .explanation {
    text-align: left;
    font-size: 0.875rem;
  }

  .variable-input-fields {
    margin-top: 1em;

    & > textarea {
      height: 5em;
      resize: none;
      width: calc(100% - 4em);
    }
  }

  .variable-input-button {
    display: inline-block;
  }

  .similarity-bar {
    border-top: 1px solid #cc6;
    border-bottom: 1px solid #cc6;
    font-weight: bold;
  }

  .triangulated-list-item {
    margin-top: 1em;
    padding-top: 1ex;
    padding-bottom: 1ex;
    border: 1px solid #886;
    border-left: none;
    border-right: none;
    border-bottom: none;

    .triangulated-list-item-text {
      display: inline-block;
      font-style: italic;

      &::before {
        content: '“';
      }

      &::after {
        content: '”';
      }
    }

    .triangulated-similarity-bar-holder {
      height: 1.5em;
      background-color: #eee;
    }
  }
}
</style>
