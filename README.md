# 运行项目
## 运行服务端：
先启动后端服务：在 backend 里运行：npm start
如果是想要修改代码后自动重启，运行：npm run dev

## 运行前端：
再启动前端服务：在 frontend里运行：PORT=3001 npm start 
（指定在3001端口运行，因为3000被backend用了）

网罗天下 - 热门帖子 页面：http://localhost:3000/net-world/hot-posts

## 本地llama运行命令
命令：ollama run llama3.1


## 打印目录树的命令
tree -I 'node_modules' （忽略node_modules,如果还有忽略的用“|”隔开）

## 每日热点的免费接口
1，当前在用的：https://luckycola.com.cn/public/docs/shares/api/hotnews.html，每个月需要重新获取一下接口key
2，备用每天50次请求的：https://www.juhe.cn/docs/api/id/739
3，已经被充值了体验的：https://www.tophubdata.com/dashboard

## 人家写的把chatGPT web做成API的服务：
1，浏览器配合油猴脚本方案：https://github.com/zsodur/chatgpt-api-by-browser-script
2，web2API：https://github.com/xqdoo00o/ChatGPT-to-API/tree/master

## 历史用过的chatGPT账号：
1，独立的：
【账号】altitudedaniel1216@hotmail.com
【密码】qBkaisox1d@e
【邮箱密码】sonk9485
2，
【账号】vetvbfpzzz10@hotmail.com 
【密码】Store.sorryios.com689
3，
【账号】skc532481@hotmail.com
【密码】Store.sorryios.com810
4，
【账号】sapplegdmochealo@mail.com
【密码】Store.sorryios.com252
5，
【账号】amatprimmiva@mail.com
【密码】Store.sorryios.com982
6，
【账号】bordaTemple@hotmail.com
【密码】Store.sorryios.com834
7，
【账号】tipsroldlomerhy@mail.com
【密码】Store.sorryios.com835
8，
【账号】roverlawachel@mail.com
【密码】Store.sorryios.com
9，
【账号】dicatyweedju@mail.com
【密码】Store.sorryios.com240
10，



## 各种prompt
### 1，Prompt起项目：
我打算开发一个项目，功能是：每天自动爬取各大网站热门帖子，根据帖子内容从推广库里找对应的项目来作推广，就是回帖子的时候找个最相关的推广项目也巧妙的放进帖子里。我打算现在本地开发，测试完毕再部署到云端，你说作为开发小白的我，该怎么开始这个项目呢
### 2，与AI一起编程的：
- 最佳实践
- 注意代码可读性
- 仔细阅读项目代码，如果有需要澄清或补充的知识，请尽管问，在明确了背景知识后开始基于项目代码思考新功能方案
- 一步步思考，将大任务分解成小步骤,逐个完成
- 我是小白，请给与一些重要细节指导，以确保我可以正确使用代码让程序运行正确

### 3，推广标的与帖子匹配：
# Matching Promotional Items with Posts

You are an AI assistant tasked with matching promotional items with relevant online posts. Your goal is to create meaningful connections between the items and the posts based on their content.

## Input Format
You will be provided with two types of JSON strings:

1. Promotional items:
```json
[
  {
    "id": "item1",
    "name": "产品名称1",
    "description": "产品描述1",
    "type": "产品类型1"
  },
  {
    "id": "item2",
    "name": "产品名称2",
    "description": "产品描述2",
    "type": "产品类型2"
  }
]
```

2. Posts:
```json
[
  {
    "id": "post1",
    "title": "帖子标题1"
  },
  {
    "id": "post2",
    "title": "帖子标题2"
  }
]
```

## Task
Your task is to:
1. Analyze each promotional item and each post.
2. Determine which posts are relevant to each promotional item.
3. Create a JSON output that shows the matches.

## Matching Criteria
Consider the following when making matches:
- Relevance of the post title to the promotional item's name, description, or type
- Potential use cases of the promotional item implied by the post title
- Similar themes or topics between the promotional item and the post title

## Output Format
Provide a JSON output with the following structure:
```json
{
  "matches": [
    {
      "promotional_item_id": "string",
      "post_id": "string"
    },
    // ... more matches
  ]
}
```

## Example
Input:
Promotional Items:
```json
[
  {
    "id": "promo001",
    "name": "FitTrack Pro",
    "description": "An AI-powered fitness app for personalized workouts",
    "type": "Mobile App"
  },
  {
    "id": "promo002",
    "name": "EcoClean",
    "description": "Eco-friendly all-purpose cleaner",
    "type": "Household Product"
  }
]
```

Posts:
```json
[
  {
    "id": "post001",
    "title": "Need help staying motivated with my workout routine"
  },
  {
    "id": "post002",
    "title": "Looking for natural cleaning solutions for my home"
  },
  {
    "id": "post003",
    "title": "Best apps for tracking fitness progress?"
  }
]
```

Expected Output:
```json
{
  "matches": [
    {
      "promotional_item_id": "promo001",
      "post_id": "post001"
    },
    {
      "promotional_item_id": "promo001",
      "post_id": "post003"
    },
    {
      "promotional_item_id": "promo002",
      "post_id": "post002"
    }
  ]
}
```

Please analyze the provided promotional items and posts, then generate a JSON output following this format, showing all relevant matches.

### 生成帖子的：
考虑加一个匹配分：1~10，用于筛选发帖量，如果匹配太多，就挑匹配分高的发帖；这个放在生成的时候，让AI努力想匹配点，嘿嘿，也许可以搞出来意想不到的跟帖内容



# 注意事项：
1，匹配时需要时间，匹配弹窗关闭不了，有进度提示
我有两份数据，一份是用于推广的商品标题/app名称/服务名称等，一份是互联网帖子，我需要将两份数据作关联匹配。

2，待做：进行匹配的弹窗：
- 输入prompt，提交
- Tampermonkey脚本
- 拿到返回结果
- 开始拼装prompt
- 拿到结果存储到数据库
匹配的全部工程：https://claude.ai/chat/6ca1372a-27af-43b4-bd56-31db86a440ac

3，playwright需要增加一些随机性；
