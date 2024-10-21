# TODO List：
执行任务前端：发帖时间显示
可以编辑回帖内容：直接编辑 or 让AI重新生成


2，将接口定义拆分到不同的模块或文件中是一种更好的做法。你可以创建一个 routes 文件夹,在其中定义不同功能模块的路由和处理函数。

# tips
许多网站使用 CAPTCHA 来阻止机器人。如果经常遇到 CAPTCHA，考虑使用第三方服务（如 2Captcha、Anti-Captcha）来自动识别和绕过 CAPTCHA。

# 运行项目
## 首先把依赖都安装了，根据package.json里的配置
运行：npm install

## 运行服务端：
先启动后端服务：在 backend 里运行：npm run build 先构建js代码，然后npm start
如果是想要修改代码后自动重启，运行：npm run dev

运行测试：
   ```
   npm test
   ```
   或者在开发过程中持续运行测试：
   ```
   npm run test:watch
   ```

## 运行前端：
再启动前端服务：在 frontend里运行：PORT=3001 npm start 
（指定在3001端口运行，因为3000被backend用了）

## 运行测试：
指定某个测试文件运行：npx jest tests/robots/zhihuRobot.test.ts
运行所有测试：npx jest

## 获取帖子数据：
### 1，获取各平台热点数据：
https://github.com/ourongxing/newsnow/blob/main/server/sources/zhihu.ts
### 2，获取指定关键词帖子：
要不找开源，要不自己问AI怎么找，要不用playwright

## 关于数据库：
### 给表添加字段：
ALTER TABLE 表名称 ADD COLUMN 字段名称 字段类型;
ALTER TABLE task_executions ADD COLUMN account_id INTEGER;

## 本地llama运行命令
命令：ollama run llama3.1

## 记得安装playwright需要的浏览器：
仅安装指定浏览器：npx playwright install chromium
安装全部浏览器：npx playwright install

## 打印目录树的命令
tree -I 'node_modules' （忽略node_modules,如果还有忽略的用“|”隔开）
tree -I 'node_modules|logs|dist'

## 每日热点的免费接口
1，当前在用的：https://luckycola.com.cn/public/docs/shares/api/hotnews.html，每个月需要重新获取一下接口key
2，备用每天50次请求的：https://www.juhe.cn/docs/api/id/739
3，已经被充值了体验的：https://www.tophubdata.com/dashboard

## 人家写的把chatGPT web做成API的服务：
开源方案合集：https://linux.do/t/topic/62560
1，浏览器配合油猴脚本方案：https://github.com/zsodur/chatgpt-api-by-browser-script
2，web2API的go方案：https://github.com/aurora-develop/aurora
3，web2API的Python方案：https://github.com/LanQian528/chat2api
- 获取device tocken：https://www.blueskyxn.com/202408/7098.html
- 获取RefreshToken：https://www.blueskyxn.com/202408/7101.html

## 使用chatGPT：
### 关于账号：
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
【账号】hcb655715@hotmail.com
【密码】Store.sorryios.com430
11,
【账号】byi493032@hotmail.com
【密码】Store.sorryios.com630
12,
【账号】wdach703251@outlook.com
【密码】Store.sorryios.com523
13，
【账号】wkfxhjq6360299@outlook.com
【密码】Store.sorryios.com372

### 关于接口：

#### apiClient.js里的AI服务地址
如果您想使用特定的 AI 服务，可以这样调用：
const response = await requestAIService("Your message here", "Default AI");
如果不指定服务名称，它将默认使用 "Default AI" 服务。

请求：
curl -X POST http://localhost:8766/v1/chat/completions \
-H "Content-Type: application/json" \
-d '{
  "messages": [
    {
      "role": "system",
      "content": "You are a helpful assistant."
    },
    {
      "role": "user",
      "content": "请把给你的数据做匹配，promotionItems是推广目标，hotPosts是热门帖子，将推广目标与帖子做关联，然后返回结果，这是推广目标与帖子的JSON{{json}},请将匹配结果返回为JSON格式，就像这样：{
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
}"
    }
  ]
}'

返回：
{"choices":[{"message":{"content":"好的，这是返回结果：{
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
}"},"delta":{"content":""}}]}%

返回需要的是：
return response["choices"][0]["message"]["content"]



## 各种prompt
### 1，开发项目的prompt：
#### 1.1，起项目的prompt：
我打算开发一个项目，功能是：每天自动爬取各大网站热门帖子，根据帖子内容从推广库里找对应的项目来作推广，就是回帖子的时候找个最相关的推广项目也巧妙的放进帖子里。我打算现在本地开发，测试完毕再部署到云端，你说作为开发小白的我，该怎么开始这个项目呢
#### 1.2，项目开发建议：
我正在开发一个项目，功能是：搜集网上帖子，然后匹配我要推广的正能量语句，AI会根据帖子与正能量语句自动为这个帖子生成回帖内容，包含满满的正能量的回帖。项目是用react框架写的，前后端都是，前端用了antDesign的UI组件。目前项目进展是：已经把搜罗网路帖子，管理正能量语句，匹配帖子与语句也做好了。接下来准备做自动回帖功能，打算用playwright来写。因为网罗了很多网站的帖子，不同网站需要用不同的发帖Robot来发，发帖Robot就是playwright写的程序。

你作为全球顶级的项目构架师与全站工程师，帮我想一下，接下来的功能该怎么组织代码，我把项目结构树发你看看，还有其他问题请直接问我。谢谢~
- 回答的claude：https://claude.ai/chat/b45a5eee-844b-4d41-85d8-ff94ab478148
- 回答的账号：avb607@thanksmac.com

### 2，与AI一起编程的：
- 最佳实践
- 注意代码可读性
- 仔细阅读项目代码，如果有需要澄清或补充的知识，请尽管问，在明确了背景知识后开始基于项目代码思考新功能方案
- 一步步思考，将大任务分解成小步骤,逐个完成
- 我是小白，请给与一些重要细节指导，以确保我可以正确使用代码让程序运行正确

### 3，推广标的与帖子匹配：
书写prompt与系统数遍拼接，用"{{json}}"代替

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


# 构架整个系统：




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
4，封装chatGPT的API
