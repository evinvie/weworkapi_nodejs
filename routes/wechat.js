'use strict'
var express = require('express');
var router = express.Router();
var WXBizMsgCrypt = require('wechat-crypto');
var xml2js = require('xml2js');
var ejs = require('ejs');
var request = require('request');
var config = require('../config');
var corpId = config.appid;
var token = config.token;
var EncodingAESKey = config.encodingAESKey;


router.use('/', function (req, res, next) {
  var method = req.method;
  var sVerifyMsgSig = req.query.msg_signature;
  var sVerifyTimeStamp = req.query.timestamp;
  var sVerifyNonce = req.query.nonce;
  var sVerifyEchoStr = decodeURIComponent(req.query.echostr);
  var sEchoStr;
  //服务商使用解密库时候，应当注意，get请求传入的是corpid，post请求时候需传入suiteid，需要将此函数放置到对应的post请求下面执行
  var cryptor = new WXBizMsgCrypt(token, EncodingAESKey, corpId);
  /* GET home page. */
  if (method == 'GET') {
    var MsgSig = cryptor.getSignature(sVerifyTimeStamp, sVerifyNonce, sVerifyEchoStr);
    if (sVerifyMsgSig == MsgSig) {
      sEchoStr = cryptor.decrypt(sVerifyEchoStr).message;
      res.send(sEchoStr);
    } else {
      res.send("-40001_invaild MsgSig")
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
          var emptyErr = new Error('-40002_body is empty');
          emptyErr.name = 'weChat';

        }
        xml2js.parseString(xml, {
          trim: true
        }, function (err, result) {
          if (err) {
            var parseErr = new Error('-40008_parse xml error');
            parseErr.name = 'weChat';
          }
          var xml = formatMessage(result.xml);
          var encryptMessage = xml.Encrypt;
          if (sVerifyMsgSig != cryptor.getSignature(sVerifyTimeStamp, sVerifyNonce, encryptMessage)) {
            //console.log("fail");
            return;
          }
          var decrypted = cryptor.decrypt(encryptMessage);
          var messageWrapXml = decrypted.message;
          if (messageWrapXml === '') {
            res.status(401).end('-40005_Invalid corpId');
            return;
          }
          xml2js.parseString(messageWrapXml, {
            trim: true
          }, function (err, result) {
            if (err) {
              var parseErr = new Error('-40008_BadMessage:' + err.name);
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

/*
 * 接收数据块
 */
function load(stream, callback) {
  var buffers = [];
  stream.on('data', function (trunk) {
    buffers.push(trunk)
  });
  stream.on('end', function () {
    callback(null, Buffer.concat(buffers));
  });
  stream.once('error', callback);
}
/*!
 * 将xml2js解析出来的对象转换成直接可访问的对象
 */
function formatMessage(result) {
  let message = {};
  if (typeof result === 'object') {
    for (var key in result) {
      if (!Array.isArray(result[key]) || result[key].length === 0) {
        continue;
      }
      if (result[key].length === 1) {
        let val = result[key][0];
        if (typeof val === 'object') {
          message[key] = formatMessage(val);
        } else {
          message[key] = (val || '').trim();
        }
      } else {
        message[key] = [];
        result[key].forEach(function (item) {
          message[key].push(formatMessage(item));
        });
      }
    }
  }
  return message;
}

/*!
 * 将回复消息封装成xml格式，其他类型，请按照业务需求重写该函数，或重新构造一个函数来进行业务支持
 */
function reply(fromUsername, toUsername) {
  var info = {};
  info.msgType = type;
  info.createTime = new Date().getTime();
  info.toUsername = toUsername;
  info.fromUsername = fromUsername;
  var body = '<xml>' +
    '<ToUserName><![CDATA[' + info.fromUsername + ']]></ToUserName>' +
    '<FromUserName><![CDATA[' + info.toUsername + ']]></FromUserName>' +
    '<CreateTime>' + info.createTime + '</CreateTime>' +
    '<MsgType><![CDATA[text]]></MsgType>' +
    '<Content><![CDATA[你好，同学！]]></Content>' +
    '</xml>';
  return body;
}
/*
 * 回复消息 将消息打包成xml并加密返回给用户
 * */
function send(fromUsername, toUsername) {

  var xml = reply(fromUsername, toUsername);
  var cryptor = new WXBizMsgCrypt(token, EncodingAESKey, corpId);
  var encrypt = cryptor.encrypt(xml);
  var nonce = parseInt((Math.random() * 100000000000), 10);
  var timestamp = new Date().getTime();
  var signature = cryptor.getSignature(timestamp, nonce, encrypt);
  var wrapTpl = '<xml>' +
    '<Encrypt><![CDATA[' + encrypt + ']]></Encrypt>' +
    ' <MsgSignature><![CDATA[' + signature + ']]></MsgSignature>' +
    '<TimeStamp>' + timestamp + '</TimeStamp>' +
    '<Nonce><![CDATA[' + nonce + ']]></Nonce>' +
    '</xml>';
  return wrapTpl;
}
module.exports = router
