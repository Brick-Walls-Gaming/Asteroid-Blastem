const path = require("path");
const imagemin = require("imagemin-webpack-plugin").default;

module.exports = {
  // 1
  entry: path.resolve(__dirname, "./src/index.js"),
  // 2
  module: {
    rules: [
      {
        test: /\.(js)$/,
        exclude: /node_modules/,
        use: ["babel-loader"],
      },
      {
        test: /\.(css)$/,
        use: ["style-loader", "css-loader"],
      },
      {
        test: /\.(png|jp(e*)g|svg)$/,
        use: [
          {
            loader: "file-loader",
          },
        ],
      },
    ],
  },
  plugins: [
    // Make sure that the plugin is after any plugins that add images
    new imagemin({
      disable: true,
      pngquant: {
        quality: [0.3, 0.5],
      },
    }),
  ],
  resolve: {
    extensions: ["*", ".js"],
  },
  // 3
  output: {
    path: path.resolve(__dirname, "./dist"),
    filename: "bundle.js",
  },
  // 4
  devServer: {
    contentBase: path.resolve(__dirname, "./dist"),
  },
};
