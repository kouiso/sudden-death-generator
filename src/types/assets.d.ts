// Farm がバンドル時に解決する CSS / フォントの side-effect import に型を与える。
// tsc 単体では実体を持たないモジュールなので、ambient module として宣言する。
declare module "*.css";
declare module "*.woff2" {
  const url: string;
  export default url;
}
