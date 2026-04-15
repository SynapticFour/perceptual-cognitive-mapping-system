export async function register() {
  // Intentionally empty: preloading the question bank here pulls `fs` through Webpack’s
  // client graph in Next 16 + `--webpack` and breaks `next build`. The bank loads on
  // demand from `/api/questions` and `question-loader-browser` on the client.
}
