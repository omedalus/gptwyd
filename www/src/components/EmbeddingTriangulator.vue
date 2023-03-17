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
  variableTexts.value.forEach((vt) => {
    vt.affinityLeft = 0;
    if (embeddingRefLeft.value !== null) {
      vt.affinityLeft = _dot(vt.embedding, embeddingRefLeft.value) || 0;
      vt.affinityTotal = vt.affinityLeft + vt.affinityRight;
    }
  });
  updateViz();
});
watch(textRefRight, async (newval) => {
  embeddingRefRight.value = await _getEmbeddingVectorForText(newval);
  variableTexts.value.forEach((vt) => {
    vt.affinityRight = 0;
    if (embeddingRefRight.value !== null) {
      vt.affinityRight = _dot(vt.embedding, embeddingRefRight.value) || 0;
      vt.affinityTotal = vt.affinityLeft + vt.affinityRight;
    }
  });
  updateViz();
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
  affinityLeft: number;
  affinityRight: number;
  affinityTotal: number;
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
  variableTexts.value.unshift(newVT);

  newVT.embedding = await _getEmbeddingVectorForText(text);
  newVT.affinityLeft = _dot(newVT.embedding, embeddingRefLeft.value) || 0;
  newVT.affinityRight = _dot(newVT.embedding, embeddingRefRight.value) || 0;
  newVT.affinityTotal = newVT.affinityLeft + newVT.affinityRight;

  updateViz();
};

const updateViz = () => {
  window.setTimeout(() => {
    updateStupidVizTrick.value = Math.random();
  }, 100);
};

const explanationShow = ref(true);
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
            <div style="padding: 0 1ex">
              The ideas expressed in these two texts have a similarity score of:
            </div>

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
          placeholder='Enter a phrase or sentence for the Right Reference Text, e.g. "The car stalled in the road."'
        ></textarea>
      </div>
      <div class="variable-input-fields">
        <textarea
          ref="elemVariableInput"
          placeholder='Enter a "Variable Text". We&apos;ll compare this text to the two Reference Texts. E.g. "The feline rested upon the floormat."'
        ></textarea>
        <div
          class="variable-input-button gptwyd-btn"
          @click="
            onVariableTextSubmitted(elemVariableInput.value);
            elemVariableInput.value = '';
          "
        >
          <span style="font-family: unset"> 🡇 </span>
          Compare this text to the two references
          <span style="font-family: unset"> 🡇 </span>
        </div>
      </div>
    </div>

    <div class="triangulated-variables">
      <div class="triangulated-list">
        <div class="triangulated-list-item" v-for="vt in variableTexts" :key="vt.text">
          <div class="triangulated-list-item-holder" v-if="updateStupidVizTrick">
            <div class="triangulated-list-item-text-holder">
              <div :style="{ flex: 0.01 + vt.affinityRight / vt.affinityTotal || 1 }"></div>
              <div class="triangulated-list-item-text">{{ vt.text }}</div>
              <div :style="{ flex: 0.01 + vt.affinityLeft / vt.affinityTotal || 1 }"></div>
            </div>
            <div class="triangulated-similarity-bar-holder">
              <div
                v-if="
                  vt.affinityLeft !== null &&
                  !isNaN(vt.affinityLeft) &&
                  vt.affinityRight !== null &&
                  !isNaN(vt.affinityRight) &&
                  vt.affinityTotal !== null &&
                  !isNaN(vt.affinityTotal)
                "
              >
                <div class="triangulated-similarity-bar">
                  <div
                    class="trisimbar triangulated-similarity-bar-left"
                    :style="{
                      backgroundColor: colorSimilarity(vt.affinityLeft),
                      flex: vt.affinityLeft / vt.affinityTotal
                    }"
                  >
                    {{ (100 * vt.affinityLeft).toFixed(2) }}%
                  </div>
                  <div
                    class="trisimbar triangulated-similarity-bar-right"
                    :style="{
                      backgroundColor: colorSimilarity(vt.affinityRight),
                      flex: vt.affinityRight / vt.affinityTotal
                    }"
                  >
                    {{ (100 * vt.affinityRight).toFixed(2) }}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="explanation explanation-what-is-embedding">
      <div class="explanation-showhide" style="text-align: right; padding-bottom: 0.5ex">
        <a v-if="explanationShow" @click="explanationShow = false">Hide explanation</a>
        <a v-if="!explanationShow" @click="explanationShow = true">Show explanation</a>
      </div>
      <div class="explanation-content" v-if="explanationShow">
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
        <p>
          This visualizer shows how GPT "conceptualizes" ideas expressed in text by comparing the
          similarities of their embeddings (i.e. the numerical representations of their
          "thoughtforms"). You can see how similarly GPT perceives two "reference texts" to one
          another, and how it perceives different "variable texts" relative to those reference
          texts.
        </p>
        <p>
          <strong
            >The percentages on the bars of the variable texts aren't supposed to add up to
            100%.</strong
          >
          The left and right percentages show how similar the variable text is to each of the left
          and right reference texts, respectively. The variable text could be very similar to both
          (i.e. high percentages on both sides), or to neither (i.e. low percentages on both sides).
          The
          <em>difference</em> in these percentages is how we visualize GPT's "judgment".
        </p>
      </div>
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
    position: relative;
    min-height: 15em;

    .triangulated-list {
      position: absolute;
      height: 100%;
      width: 100%;
      overflow-y: auto;
      overflow-x: hidden;
    }
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
        height: 5em;
        resize: none;
        background-color: #ffe;

        @media screen and (max-width: 1280px) {
          height: 7.5em;
        }

        &:active,
        &:focus {
          background-color: #fff;
        }
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

    .triangulated-list-item-text-holder {
      display: flex;
      flex-direction: row;
      width: 100%;

      .triangulated-list-item-text {
        display: inline-block;
        font-style: italic;
        color: #000;
        border: 1px solid #cc8;
        border-bottom: none;
        border-radius: 1ex 1ex 0 0;
        padding: 0.25ex 0.5ex;
        background-color: #ffe;

        max-width: 50%;
        min-width: 12em;
        flex: 0;

        &::before {
          content: '“';
        }

        &::after {
          content: '”';
        }
      }
    }

    .triangulated-similarity-bar-holder {
      height: 1.5em;
      background-color: #eee;

      .triangulated-similarity-bar {
        display: flex;
        flex-direction: row;

        .trisimbar {
          flex: 1;
          min-width: 5ex;
          padding: 0 0.5ex;
          font-weight: bold;
        }

        .triangulated-similarity-bar-left {
          text-align: left;
          border-right: 2px solid #000;
        }
        .triangulated-similarity-bar-right {
          text-align: right;
        }
      }
    }
  }
}
</style>
