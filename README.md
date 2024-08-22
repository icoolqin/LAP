# 运行项目
## 运行服务端：
先启动后端服务：在 backend 里运行：npm start

## 运行前端：
再启动前端服务：在 frontend里运行：PORT=3001 npm start 
（指定在3001端口运行，因为3000被backend用了）

网罗天下 - 热门帖子 页面：http://localhost:3000/net-world/hot-posts


## 打印目录树的命令
tree -I 'node_modules' （忽略node_modules,如果还有忽略的用“|”隔开）

## 每日热点的免费接口
1，当前在用的：https://luckycola.com.cn/public/docs/shares/api/hotnews.html
2，备用每天50次请求的：https://www.juhe.cn/docs/api/id/739
3，已经被充值了体验的：https://www.tophubdata.com/dashboard

## AI营销系统的prompt
Prompt起项目：我打算开发一个项目，功能是：每天自动爬取各大网站热门帖子，根据帖子内容从推广库里找对应的项目来作推广，就是回帖子的时候找个最相关的推广项目也巧妙的放进帖子里。我打算现在本地开发，测试完毕再部署到云端，你说作为开发小白的我，该怎么开始这个项目呢
