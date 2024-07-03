import http from 'http'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import mime from 'mime'
// import child_process from 'child_process'

const server = http.createServer((req, res) => {
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = path.dirname(__filename)
  const filePath = path.join(__dirname, 'dist', req.url === '/' ? 'index.html' : req.url)
  const fileExt = path.extname(filePath)
  
  // 设置默认Content-Type
  res.setHeader('Content-Type', mime.getType(fileExt) || 'application/octet-stream')
  
  // 读取文件并发送给客户端
  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.statusCode = 404
        res.end('File not found')
      } else {
        res.statusCode = 500
        res.end('Internal Server Error')
      }
      return
    }
    res.end(data)
  })
})

server.listen(3000, () => {
  console.log('Server is running on port 3000')
  console.log('Open http://localhost:3000 in the browser')
  
  // 打开默认浏览器
  // child_process.exec('start http://localhost:3000')
})