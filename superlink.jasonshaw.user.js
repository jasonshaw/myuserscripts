// ==UserScript==
// @name         聚bt秒传链接优化
// @namespace    jason.shaw
// @version      1.2.6
// @description  实现聚bt的115和百度网盘妙传链接，文件名的自动化处理（将完整的名字引入，将密码内嵌），以及关键信息的悬停复制
// @note         1.2.6版本 优化增强：对多115秒链增加自动创建目录功能（先转存，再转移合并-》自动归入目录）
// @note         1.2.5版本 修正网站中有些115秒链，没有换行，造成多行错误融合的情况,顺道修正了无密码的情况
// @note         1.2.4版本 修正网站中没有秒链区块不存在或者innerText文本不存在，造成过度处理导致内容被过滤的问题
// @note         1.2.3版本 对于jubt bbs，个别秒链并不在pre标签内，增加倒数第四个p的选择
// @note         1.2.2版本 修正磁链超链正则，避免在磁链超链文本化时，匹配过渡（横跨多个链接），顺手支持
// @note         1.2.1版本 修正磁链正则，支持32位密钥，同时兼容&和&amp;，顺手支持pao8.gq
// @note         1.2.0版本 同逻辑支持聚bt姊妹站色聚seju.ga
// @note         1.1.7版本 修复多行秒传链接时，换行被消除的问题，以及正则匹配超过一行问题
// @note         1.1.6版本 百度秒链，个别文件名无扩展名问题
// @note         1.1.5版本 修复磁链超链化尾部问题（支持&dn=...型磁链）
// @note         1.1.4.1版本 支持的网址，排除列表，仅对单页处理
// @note         1.1.4版本 修复部分页面无磁链超链，正则引发假死问题（排除法）
// @note         1.1.3版本 增加过滤主标题中的&避免作为文件名无法保存或者破坏秒传链接
// @note         1.1.2版本 过滤主标题中的/与|#避免作为文件名无法保存或者破坏秒传链接
// @note         1.1版本对已经成为链接的磁链做特别处理，避免破坏原有链接
// @note         1.0版本增加了站内无秒传，但有磁链的处理——文本变链接，同时支持延时悬停复制，并优化了悬停代码
// @author       JasonShaw
// @include      https://bbs.ijubt.*/thread-*.htm
// @include      https://seju.ga/*
// @include      https://www.pao8.gq/*
// @include      https://1fuli.top/*
// @icon         https://bbs.ijubt.gq/favicon.ico
// @grant        GM_setClipboard
// ==/UserScript==


//学到了：
// 1、通过定时器可以实现延时响应，只要使用同一组定时器，那么就可以通过对比两次时间实现延时；
// 2、addEventListener 给元素添加监听事件，元素必须是单一Node，不支持NodeList，需要通过循环来实现，但是jquery，支持给一组元素添加监听事件；
// 3、querySelectorAll不空时，返回的是一个NodeList对象而不是一个数组，可以通过for(var i;i<XXX;i++) 形式按数据逻辑遍历，但是不能用for in 或者 foreeach，因为这样返回的不仅有节点还有其他属性和方法
// 4、replace(),结合正则可以实现替换，如需要不只替换第一个匹配的，那么需要加上g开关，如果涉及多行需要增加m开关，比如str.repalce(/\d+.\w*/gm,'')
// 5、高版本chrome和firefox浏览器都支持GM_setClipboard，无需任何特别操作
// 6、match(),不空且打开g开关，会返回所有匹配的结果（不含子匹配），用于判断匹配次数，如果不打开g开关，那么返回第一个匹配及其子匹配
// 7、通过编写超链的正则匹配，新get到，正则表达式中也可以通过\+数字的方式前向引用，这样可以实现“动态的匹配”，比如 要么双单引号，要么双双引号，解决成对出现问题
// 8、js 正则匹配，开启gm模式下，多行会一并参与匹配，当出现一次性过匹配时，需要做特别处理，比如[^\n]的添加规避换行符，将匹配限制在一行内
// 9、textContent仅捕获节点及其所有子节点的文本内容（仅限内含文本属性的节点，比如<img>之类会被完整过滤掉，而<script>和<style>标签页会包含在内，其html标签本身会被剔除仅保留文本本身，但换行信息会被忽略），而innerText也会去除html标签，但受样式影响，隐藏文本不会被不捕获，同时<script>和<style>也不会被捕获,但换行信息会被保留，而innerHTML是html文本全部，html标签（<script>和<style>也包含在内）、换行全部会被捕获
// 10、去除首尾空格用trim即可，而去除首尾空行，用replace(^\n+,"") 和replace(\n+$,"") 实现
// 11、字符串的replace函数，如果字符串提替换，其仅能替换第一个匹配，如果要实现全部匹配，全部提花，必须要正则模式进行替换，且需要g参数辅助，类如：str.replace("2","3") 仅替换第一个2，其余都未被替换，如果全部需要str.replace(/2/g,"3")，注意()在正则中需要转义，/\(\)/，才是()
// 12、js 正则z最新已经支持先行和后行断言，其实用人话来说，就是一个特殊的模式组，用于定位要匹配的内容的前面和后面满足一定条件，但这个条件满足的部分不是被捕获的部分，
// 比如要匹配 a字母前不是数字的：/(?<!\d)a/, 比如要匹配 a字母前 必须是@的：/(?<=@)a/
// 比如要匹配 a字母后面不是数字的：/a(?<!\d)/, 比如要匹配 a字母后面 必须是@的：/a(?=@)/
// 零宽度正预测先行断言 (?=exp)                                       //判断正则表达式中？的位置的右边符合表达式的条件。
// 零宽度负预测先行断言 (?!exp)                                        //判断正则表达式中？的位置的右边不符合表达式的条件。
// 零宽度正回顾后发断言 (?<=exp)                                     //判断正则表达式中？的位置的左边符合表达式的条件。
// 零宽度负回顾后发断言 (?<!exp)                                      //判断正则表达式中？的位置的左边不符合表达式的条件。
// 13、git支持多远程库，一次提交可以同时提交至两个远程库(已经测试成功，并撰写了日志文档，留档在有道云笔记中)

(function() {
    'use strict';

    var timer = null;
    var mainTitleObj = document.querySelector('h4.break-all')||document.querySelector('h1.article-title');//兼容
    var mainTitle = mainTitleObj.textContent.trim().replace(/(\s+)|\/|\||#]/g,'-').replace(/&/g,'+');
    hoverDelayCopy(mainTitleObj,500,mainTitle);//增加延时悬停复制功能
    //console.log(mainTitle);
    //处理磁力链
    //#body > div > div > div.col-lg-9.main > div.card.card-thread > div > div.message.break-all
    var messageObj = document.querySelector('div.message.break-all')||document.querySelector('article.article-content');
    //console.log(messageObj.innerHTML);
    //先把已经是链接的磁链文本还原为文本（去超链），然后再统一将问题处理掉
    //magnet:?xt=urn:btih:d694dec90bdeef39de2e898c8ddc165241282992
    if(document.querySelector('a[href^="magnet:?xt=urn:btih:"]')){//先判断是否存在超链的磁力链接，然后再处理，避免卡死
        //console.log(123);
        messageObj.innerHTML = messageObj.innerHTML.replace(/<[Aa]\s+([^<>]*?\s+)*?href\s*=\s*(['"])(magnet:\?xt=urn:btih:.+?)\2(\s+.*?\s*)*?>.+?<\/[Aa]>/gm,'$3');
    }
    //console.log(messageObj.innerHTML);
    messageObj.innerHTML = messageObj.innerHTML.replace(/(magnet:\?xt=urn:btih:[0-9a-zA-Z]{32,40})((&amp;|&)\w+=[^<\s]+)*/gm,'<a href="$1$2" class="magnet">$1$2</a>');
    //console.log(messageObj.innerHTML);
    var magnetsArr = document.querySelectorAll(".magnet");
    //alert(magnetsArr.length);
    for(let i = 0;i < magnetsArr.length; i++){
        //console.log(typeof magnetsArr[i]);
        hoverDelayCopy(magnetsArr[i],500,magnetsArr[i].href);//增加延时悬停复制功能
    }

    try {
        var superlinkObj = document.querySelector('pre')||document.querySelector('div.message.break-all p:nth-last-child(4)');//pre.prettyprint
        if(!superlinkObj) return false;//如果秒链区块整体不存在，则无需再做处理
        var pwObj = superlinkObj.nextElementSibling;
        var pw = pwObj ? pwObj.textContent.trim():'';
        pw = pw.indexOf('密码') > -1? pw :'';
        if(pwObj) {
            hoverDelayCopy(pwObj,500,pw);//增加延时悬停复制功能
        }
        // console.log(pw);
        //alert(superlinkObj);
        if (superlinkObj.innerText !=null) { {
            //console.log(superlinkObj.textContent);
            var superLinks = superlinkObj.innerText + '';//隐式将不论 null或者空字符串都转换为字符串，保证trim函数不报错，且.length属性不报错
            //console.log(superlinkObj.textContent);
            //console.log(superlinkObj.innerText);
            //console.log(superlinkObj.innerHTML);
            //console.log(2222);
            if(superLinks.trim().length < 1) return false;//秒链所在区块文本不存在的时，无需再做秒链处理
            // 正则
            //example:115://第二季.7z|2078850179|C1E9424C4364633F9D1A6B3B21B60A8F36A8B0F6|5387B728D892280CA68225852124AEC2733B6BE9
            //example:ef1d6a999fd2aa8ac4900ffce0b96458#dbdca099b7139cf80bccf0e985fece64#17185558819#BP754-1.7z删除
            //845463feca6f7304b88ae5bf27c72ac9#aed6dae1198a3f103098f8abbce45ba3#2024439483#千舞樱洛1.7z
            //028b8ee487d0a98dcc264b82c1c39b77#bb8872b2a8a77c18783c1c1116d5c91e#2878075115#千舞樱洛2.7z
            //a7e5ab1baa562fdc2719b6e82197f472#2df822d96f545d38d43e614bafa34715#734003200#108MBJ02
            //115://英文写作训练.7z.003|5242880000|05D9D91F76D7448869085C4D486F9A4FB707853D|52A0FB2674C1AF5318688A46CF8A3C6424367C4C
            //115://英文写作训练.7z.001|5242880000|50725607312E0BAAAA1712423CCF81B59C053448|07A2F81F93E5B43DA10E2F62E782994DCEAE66B9
            //115://英文写作训练.7z.002|5242880000|53E116CE8AD2A05741BDB7DC0B84856694AECF11|52CAB47B716A1C1328FA4577F9FA12CDB33F3A69
            //115://英文写作训练 .7z.004|676896723|F211E14EF361513BD0F39915C35F6B501B0032B5|0DE04BEEF9E8FBE32BDFB474B0902E9B60CA98
            //115://全球顶尖英文写作教材《write-source》Grade-1-12(解压密码：ixue.io).004|676896723|F211E14EF361513BD0F39915C35F6B501B0032B5|0DE04BEEF9E8FBE32BDFB474B0902E9B60CA9848
            // 带目录的115秒传
            // 115://0001.jpg|1301656|D67148312310A01D3FAC9F8F39578C22F2DAB338|B811A9C5FE668996E0C926EE85B011E3A3A2B44E|[AYW爱尤物] No.1875 爱你晴空
            // 115://0002.jpg|1268560|894CAF6321356675A79CEFC09CAB3A800651A355|F5FB5B9B25D3C64BFA236AB3C340160BFFF0B746|[AYW爱尤物] No.1875 爱你晴空
            // 115://0003.jpg|1314748|4F01310383BAF158CD5AC686136691EFC9B67471|5D030035FAF326A27EADC76C34EA0F5E27EF978A|[AYW爱尤物] No.1875 爱你晴空
            var re115 = /115:\/\/(.*?)(\.[^\|\n]+\|)(\d+\|[0-9A-Z]+\|[0-9A-Z]+)(\|[^\|\n]+)?/gm;
            var reBd =/(.*#.*#.*#)([^\.\n]*)(\..*)?/gm;
            var arr = superLinks.match(re115);
            if(arr && arr.length > 0){
                if(arr.length == 1){//仅有一个115秒传链接，则替换文件名为主标题+密码
                    superLinks = superLinks.replace(re115,"115://"+mainTitle+"("+pw+")$2$3");
                }
                else {//超过1个115秒传，则替换文件名为原文件名,放在在“mainTitle+密码”目录里
                    superLinks = superLinks.replace(/(?<!\n)115:\/\//g,"\n115://").replace(/^\n/,'');//零宽负向先行断言,去除头部无意义空行
                    //superLinks = superLinks.replace(re115,"115://$1("+pw+")$2");  //测试连接：https://bbs.ijubt.gq/thread-3719.htm
                    superLinks = superLinks.replace(re115,"115://$1$2$3|"+mainTitle+"("+pw+")");//在以“|”分割的第四节后增加第五节作为目录，让多个115妙传自动归入同一目录
                }
            }
            arr = superLinks.match(reBd);
            if(arr && arr.length > 0){
                if(arr.length == 1){//仅有一个百度秒传链接，则替换文件名为主标题+密码
                    superLinks = superLinks.replace(reBd,"$1"+mainTitle+"("+pw+")$3");
                } else {//超过1个百度秒传，则替换文件名为原文件名+密码
                    superLinks = superLinks.replace(reBd,"\n$1$2("+pw+")$3").replace(/^\n/,'');
                }
            }
            superLinks = superLinks.replace(/\(\)/g,'');//如果无密码，则会出现空括号，这里去除掉
            //console.log(superLinks);
            superlinkObj.innerHTML = superLinks;
            GM_setClipboard(superLinks);
            console.log("秒传链接已复制："+superLinks);
            hoverDelayCopy(superlinkObj,500,superLinks);//增加延时悬停复制功能

        }
    } catch(e){
        console.log(e);
    }
    function hoverDelayCopy(obj,ms,text){
        try{
            //增加延时悬停复制功能，超过500毫秒（0.5s）悬停，则复制，否则不复制,并在复制成功时变粉色示意（后恢复黑色）
            var oBackGround = obj.style.background;
            obj.addEventListener("mouseenter",function(event) {
                clearTimeout(timer);
                timer = setTimeout(function(){
                    GM_setClipboard(text);
                    event.target.style.background = "pink";
                },ms);
            }, false);
            obj.addEventListener("mouseleave",function(event) {
                clearTimeout(timer);
                event.target.style.background = oBackGround;
            }, false);
        } catch(e){console.error(e);}
    }

})();