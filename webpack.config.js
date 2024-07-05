import { fileURLToPath } from 'url'
import path from 'path'
import HtmlWebpackPlugin from 'html-webpack-plugin'
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default {
    mode: 'development',
    // 入口文件
    entry: './src/main.js',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'bundle.js',
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /(node_modules|packages)/,
                use: 'hand-write-vue-compiler'
            }
        ]
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: './public/index.html'
        })
    ]
}