<template>
  <v-container class="container">
    <v-row>
      <v-col cols="12">
        <v-form @submit.prevent="generateText">
          <v-textarea
            v-model="inputText"
            label="ここにテキストを入力"
            outlined
            rows="4"
          ></v-textarea>
          <v-btn type="submit" color="primary" class="mt-4">生成</v-btn>
        </v-form>
      </v-col>
    </v-row>
    <v-row class="mt-4">
      <v-col cols="12">
        <v-checkbox v-model="vertical" label="縦書き(V)"></v-checkbox>
        <v-checkbox v-model="padding" label="余白(P)"></v-checkbox>
        <v-checkbox v-model="textFormat" label="テキスト形式(R)"></v-checkbox>
        <v-radio-group v-model="shape" row>
          <v-radio label="通常(N)" value="normal"></v-radio>
          <v-radio label="四角形(4)" value="square"></v-radio>
          <v-radio label="短冊(T)" value="tanzaku"></v-radio>
          <v-radio label="ストレス(S)" value="stress"></v-radio>
          <v-radio label="突然の死(SD)" value="suddenDeath"></v-radio>
        </v-radio-group>
      </v-col>
    </v-row>
    <v-row class="mt-4">
      <v-col cols="12">
        <div :class="['text-container', { vertical, padding, textFormat, [shape]: true }]">
          <div v-html="formattedText"></div>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
export default {
  name: 'IndexPage',
  data() {
    return {
      vertical: false,
      padding: false,
      textFormat: false,
      shape: 'normal',
      inputText: '',
      formattedText: ''
    }
  },
  methods: {
    generateText() {
      let formattedText = '';
      const lines = this.inputText.split('\n');

      switch (this.shape) {
        case 'normal':
          formattedText = lines.join('<br>');
          break;
        case 'square':
          formattedText = lines.map(line => `＿${line}＿`).join('<br>');
          break;
        case 'tanzaku':
          formattedText = lines.map(line => `＞${line}＜`).join('<br>');
          break;
        case 'stress':
          formattedText = lines.map(line => `！！${line}！！`).join('<br>');
          break;
        case 'suddenDeath':
          formattedText = `＿人人人人人人人＿<br>＞　${lines.join('　')}　＜<br>￣Y^Y^Y^Y^Y^Y^Y^￣`;
          break;
        default:
          formattedText = lines.join('<br>');
      }

      if (this.vertical) {
        formattedText = formattedText.split('<br>').map(line => line.split('').join('<br>')).join('<br>');
      }

      if (this.padding) {
        formattedText = `<div style="padding: 20px;">${formattedText}</div>`;
      }

      if (this.textFormat) {
        formattedText = `<div style="font-family: monospace;">${formattedText}</div>`;
      }

      this.formattedText = formattedText;
    }
  }
}
</script>

<style scoped>
.container {
  text-align: center;
  font-size: 2rem;
  margin-top: 20vh;
}
.text-container {
  display: inline-block;
}
.vertical {
  writing-mode: vertical-rl;
}
.padding {
  padding: 20px;
}
.textFormat {
  font-family: monospace;
}
.normal {
  /* 通常のスタイル */
}
.square {
  border: 1px solid black;
  padding: 10px;
}
.tanzaku {
  border: 1px solid black;
  padding: 10px;
  width: 100px;
}
.stress {
  color: red;
  font-weight: bold;
}
.suddenDeath {
  font-size: 1.5rem;
  text-align: center;
}
</style>