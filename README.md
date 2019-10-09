# About

weworkapi_nodejs 是为了简化开发者对企业微信API回调接口的使用而设计的。

本库仅做示范用，并不保证完全无bug。

另外，作者会不定期更新本库，但不保证与官方API接口文档同步，因此一切以官方文档为准。

更多来自个人开发者的其它语言的库推荐：

- python: https://github.com/sbzhu/weworkapi_python
- ruby: https://github.com/mycolorway/wework
- php: https://github.com/sbzhu/weworkapi_php
- golang : https://github.com/doubliekill/EnterpriseWechatSDK 1006401052yh@gmail.com

Requirement

# 搭建环境

需要搭建nodejs+express开发环境，参阅[nodejs官方文档]以及[express的配置]。本文基于linux环境开发。

[nodejs官方文档]: https://nodejs.org/en/
[express的配置]: https://expressjs.com/

# 接入过程

首先，如果你没有企业微信的话，需要在[企业微信官网]注册一个企业。

在[自建应用]详情页，点击“接收消息”的“设置API接收”按钮，进入配置页面。

按要求填写应用的URL、Token以及EncodingAESKey：

- __URL__ 是企业后台接收企业微信推送请求的访问协议和地址，支持http或https协议
- __Token__ 可由企业任意填写，用于生成签名
- __EncodingAESKey__ 用于消息体的加密，是AES密钥的Base64编码

随后记录这些参数，将其填写到 `config.js` 的对应字段。

[企业微信官网]: https://work.weixin.qq.com/
[自建应用]: https://work.weixin.qq.com/api/doc#10025

## 初始化node项目

在命令行窗口执行以下命令：

```bash
git clone https://github.com/evinvie/weworkapi_nodejs.git wework_server
cd wework_server
npm install
```

随后可在 `app.js` 中更改项目的路由配置。以应用配置URL为 `http://api.3dept.com/wechat/qy/` 为例，`app.js` 中的代码为：

```javascript
var wechatRouter= require('./routes/wechat')

app.use('/wechat/qy', wechatRouter)
```

项目主要逻辑封装在 [routes/wechat.js]，我们可以根据实际场景修改其中逻辑。

项目配置完成后，我们可以使用以下命令运行server：

```bash
npm start
```

在设置API接收页面点击保存，回调完成，此时在应用中发送一条文本消息，应用会回复 `你好，同学！`。

其他代码逻辑，根据业务需求，修改对应的函数或模块。

[routes/wechat.js]: https://github.com/evinvie/weworkapi_nodejs/blob/master/routes/wechat.js

## 项目目录结构

```
.
├── bin           -- express的配置，可修改对应的端口以及启动信息
├── node_modules  -- nodejs模块
├── public        -- 静态资源文件
├── routes        -- 路由
├── views         -- 视图
├── app.js        -- 应用核心配置文件
├── package.json  -- 相关nodejs模板以及作者信息
└── config.js     -- 项目依赖配置及开发者信息
```

# Contact us

zexinyao@tencent.com
