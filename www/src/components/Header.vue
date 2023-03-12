<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, computed } from 'vue';

const elemSpacer = ref();
const elemHeader = ref();

function adjustSpacerSizeToMatchHeader(this: Window, event: Event) {
  if (!elemHeader.value || !elemSpacer.value) {
    return;
  }
  elemSpacer.value.style.height = `${elemHeader.value.offsetHeight}px`;
}

onMounted(() => {
  window.addEventListener('scroll', adjustSpacerSizeToMatchHeader);
  window.addEventListener('resize', adjustSpacerSizeToMatchHeader);
  adjustSpacerSizeToMatchHeader.bind(window)(new Event('scroll'));
});

onBeforeUnmount(() => {
  window.removeEventListener('scroll', adjustSpacerSizeToMatchHeader);
  window.removeEventListener('resize', adjustSpacerSizeToMatchHeader);
});

const emit = defineEmits<{}>();
</script>

<template>
  <div class="header-magic-static-spacer" ref="elemSpacer"></div>
  <header ref="elemHeader">
    <div class="header-contents">
      <div class="header-title">
        GPT, What are You Doing<span class="animated-punctuation-holder"
          ><span class="animated-punctuation">?</span
          ><span style="animation-delay: 0.33s" class="animated-punctuation">!</span
          ><span style="animation-delay: 1.4s" class="animated-punctuation">?</span>
        </span>
      </div>

      <div class="header-text">
        A playpen for visualizing some of GPT's inner workings.
        <div style="font-size: 0.75rem; display: flex">
          <a href="mailto:perceptronviz@gmail.com">Contact the developer</a>
          <div style="width: 100%"></div>
          <a target="_blank" href="https://github.com/omedalus/gptwyd">See the source code</a>
        </div>
      </div>

      <div class="header-controls"></div>
    </div>
  </header>
</template>

<style scoped lang="scss">
.header-magic-static-spacer {
  display: block;
}

header {
  background-color: #ff8;
  color: #660;

  text-align: center;
  position: relative;
  padding: 0;
  border-bottom: 2px solid #aa0;
  width: 100%;

  position: fixed;
  top: 0;
  left: 0;
  z-index: 9999;

  .header-contents {
    max-width: 1024px;
    margin: auto;
    min-height: 3em;
    padding: 0;

    display: flex;
    flex-direction: row;
    align-items: center;

    @media screen and (max-width: 1024px) {
      display: inline-block;
      padding: 0 1ex 0.5ex;
    }
  }
}

.header-title {
  font-size: 1.5rem;
  font-weight: bold;
  margin-right: auto;
  white-space: nowrap;

  .animated-punctuation-holder {
    display: inline-block;
    position: relative;
    left: -0.5ex;
    transform: scale(1.2);
  }
}
.header-text {
  a {
    white-space: nowrap;
  }

  @media screen and (max-width: 1024px) {
    padding-bottom: 1ex;
  }
}

@keyframes animated-punctuation {
  0% {
    transform: rotate(-30deg);
    left: 0;
    top: 0;
  }
  25% {
    transform: rotate(30deg);
    top: -0.25ex;
  }
  50% {
    transform: rotate(-30deg);
    left: 1ex;
    top: 0;
  }
  75% {
    transform: rotate(30deg);
    top: 0.25ex;
  }
  100% {
    transform: rotate(-30deg);
    left: 0;
    top: 0;
  }
}

.animated-punctuation {
  display: inline-block;
  position: relative;
  animation: animated-punctuation 2s infinite;
}
</style>
