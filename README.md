# About
weworkapi_nodejs 是为了简化开发者对企业微信API回调接口的使用而设计的
本库仅做示范用，并不保证完全无bug；
另外，作者会不定期更新本库，但不保证与官方API接口文档同步，因此一切以官方文档为准。

更多来自个人开发者的其它语言的库推荐：</br>
python : https://github.com/sbzhu/weworkapi_python </br>
ruby ： https://github.com/mycolorway/wework </br>
php : https://github.com/sbzhu/weworkapi_php </br>

# 搭建环境
需要搭建nodejs+express开发环境，参阅<a href="https://nodejs.org/en/">nodejs官方文档</a>以及<a href='https://expressjs.com/'>express的配置</a>
本文基于linux环境下的开发</br>
# 接入过程
首先，如果你没有企业微信的话，需要在<a href="https://work.weixin.qq.com/">企业微信官网</a>进行注册一个企业</br>
在<a href='https://work.weixin.qq.com/api/doc#10025'>自建应用</a>，点击“接收消息”的“设置API接收”按钮，进入配置页面。</br>
要求填写应用的URL、Token、EncodingAESKey三个参数</br>
<pre><code>URL是企业后台接收企业微信推送请求的访问协议和地址，支持http或https协议。</br>
Token可由企业任意填写，用于生成签名。</br>
EncodingAESKey用于消息体的加密，是AES密钥的Base64编码。</br>
</code></pre>
记录这些参数，配置到../config.js文件中</br>
express快速构建一个可启动的项目
<pre><code>$ express -e wework_server
$ cd wework_server && npm install
</code></pre>
安装<strong>wechat-crypto</strong>模块，这是用于和微信服务器进行加解密的Nodejs模块
<pre><code>npm install --save wechat-crypto</code></pre>
<strong>Director</strong>
.</br>
├── --express的配置，可修改对应的端口以及启动信息</br>
├── node_modules  --nodejs模块</br>
├── public        --静态资源文件</br>
├── routes        --路由</br>
├── views         --视图</br>
├── app.js        --应用核心配置文件</br>
└── config.js     --项目依赖配置及开发者信息</br>

以下是该加解密关键部分代码../router/wechat.js
<pre><code>
router.use('/', function (req, res, next) {
    var method = req.method;
    //获取url上的签名字段
    var sVerifyMsgSig = req.query.msg_signature;
    //获取url上的时间戳
    var sVerifyTimeStamp = req.query.timestamp;
    //获取url上的随机数
    var sVerifyNonce = req.query.nonce;
    //获取url上的echostr，当请求为get请求时，有该参数
    var sVerifyEchoStr = decodeURIComponent(req.query.echostr);
    var sEchoStr;
    var cryptor = new WXBizMsgCrypt(token, EncodingAESKey, corpId);
    /* GET home page. */
    if (method == 'GET') {
      var MsgSig = cryptor.getSignature(sVerifyTimeStamp, sVerifyNonce, sVerifyEchoStr);
      if (sVerifyMsgSig == MsgSig) {
        sEchoStr = cryptor.decrypt(sVerifyEchoStr).message;
        res.send(sEchoStr);
      } else {
        res.send("invaild MsgSig")
      }
    }
    /* POST home page. */
    else if (method == 'POST') {
      load(req, function (err, buff) {
        try {
          if (err) {
            var loadErr = new Error('weChat load message error');
            loadErr.name = 'weChat';
          }
          var xml = buff.toString('utf-8');
          if (!xml) {
            var emptyErr = new Error('body is empty');
            emptyErr.name = 'weChat';

          }
          xml2js.parseString(xml, {
            trim: true
          }, function (err, result) {
            if (err) {
              var parseErr = new Error('parse xml error');
              parseErr.name = 'weChat';
            }
            var xml = formatMessage(result.xml);
            var encryptMessage = xml.Encrypt;
            if (sVerifyMsgSig != cryptor.getSignature(sVerifyTimeStamp, sVerifyNonce, encryptMessage)) {
              console.log("fail");
              return;
            }
            var decrypted = cryptor.decrypt(encryptMessage);
            var messageWrapXml = decrypted.message;
            if (messageWrapXml === '') {
              res.status(401).end('Invalid corpId');
              return;
            }
            xml2js.parseString(messageWrapXml, {
              trim: true
            }, function (err, result) {
              if (err) {
                var parseErr = new Error('BadMessage:' + err.name);
                parseErr.name = 'weChat';
              }
              var message = formatMessage(result.xml);
              var msgType = message.MsgType;
              var fromUsername = message.ToUserName;
              var toUsername = message.FromUserName;

              switch (msgType) {
                case 'text':
                  var sendContent = send(fromUsername, toUsername);
                  res.status(200).end(sendContent);
                  break;
                  //其他逻辑根据业务需求进行处理
                case 'image':
                  break;
                case 'video':
                  break;
                case 'voice':
                  break;
                case 'location':
                  break;
                case 'link':
                  break;
                case 'event':
                  var event = message.Event;
                  console.log(event);
                  break;
              }

            });
          });


        } catch (err) {
          res.status(401).end('System Busy');
          return;
        }
      })
    }
  })
</code></pre>
修改app.js文件，引入对应的模块和更改路由,例如我配置的url是http://api.3dept.com/wechat/qy/
<code><pre>
var wechatRouter= require('./routes/wechat')</br>
app.use('/wechat/qy',wechatRouter)
</code></pre>
修改完之后，运行项目
<code><pre>npm start</code></pre>
在设置API接收页面点击保存，回调完成，此时发送一条文本消息，会回复“你好，同学！”
其他代码逻辑，根据业务需求，重构对应的函数或模块
# Contact us
v_zexyao@tencent.com
