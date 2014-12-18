// ==UserScript==
// @name  批量打开本页全部链接
// @namespace  snaplinks.jasonshaw
// @version    0.1
// @description  批量打开本页全部链接,升级于tusi8的批量打开
// @include      http://*.tusi8.com/*/*.html
// @include      http://www.737cn.com/*/*.html
// @include      http://www.taotu8.net/*
// @include      http://sc.chinaz.com/*/*
// @include      http://www.zei8.com/*
// @include      http://www.wrshu.com/xiaoshuo/special/*.html
// @Grant        GM_openInTab
// @Grant        GM_notification
// @copyright  2014+, jasonshaw
// ==/UserScript==


(function(){ //已知bug就是不能调用打开链接在后台，用uc脚本或者扩展可以实现，暂时如果需要将打开的链接放置在后台标签则可以通过tu临时设置所有标签都在后台打开
    var configs = {
		'737cn': {//tusi8
			startReg: /http:\/\/.*\.737cn\.com\/([^\/]+\/){1,2}[^\/]+\.html/i,
			btnPosIn:['p.lm_pager_box','beforeend'],
			chkPosIn:['div.yuanma_downlist_box h4:nth-child(1)','afterbegin'],
			alinks:'div.yuanma_downlist_box h4:nth-child(1) strong a',
		},
		'chinaz': {//chinaz
			startReg: /http:\/\/sc\.chinaz\.com\/([^\/]+\/){1,2}([^\/]+\.html)?/i,
			btnPosIn:['div.fenye','beforebegin'],
			chkPosIn:['div[class="box picblock col3 masonry-brick"] > p','afterbegin'],
			alinks:'div[class="box picblock col3 masonry-brick"] > p > a:nth-child(1)',
			filter:function(obj){ if(obj.parentNode.parentNode.querySelector('div.framework_require').innerHTML.indexOf('jquery') < 0 ) return true;else return false; },//obj为checkbox的任意一个dom对象
		},
		'zei8': {//贼吧网电子书下载
			startReg: /^http:\/\/www\.zei8\.com\/txt\/\d+\/list_\d+_\d+\.html$/i,
			btnPosIn:['ul.pagelist','beforeend'],
			chkPosIn:['ul.e2 > li > dl','afterbegin'],
			alinks:'ul.e2 > li > dl > a.title',
		},
		'wrshu': {//wrshu电子书下载
			startReg: /^http:\/\/www\.wrshu\.com\/xiaoshuo\/special\/.+\.html$/i,
			btnPosIn:['div.pagebox','afterbegin'],
			chkPosIn:['div.soft_list > dl > dt > a','beforebegin'],
			alinks:'div.soft_list > dl > dt > a',
		},
		'taotu8': {
			startReg: /^http:\/\/www\.taotu8\.net\/.+\/(list_\d+_\d+.html)?$/i,
			btnPosIn:['div.pages','beforeend'],
			chkPosIn:['ul#need > li > div.addtime','afterbegin'],
			alinks:'ul#need > li > a',	
		},
	};
	var reg=null,btnPosIn=[],chkPosIn=[],objs=[],Attrs=[],Filter=null,delayMs=i=0,alinks,len;
	for (var key in configs) {
		var r = window.location.href.match(configs[key].startReg);
		if(r != null){ reg = configs[key].startReg; alinks = configs[key].alinks; btnPosIn = configs[key].btnPosIn; chkPosIn = configs[key].chkPosIn;if(configs[key].filter instanceof Function) Filter = configs[key].filter;break;}
	}
	if(reg==null) return false;
	var r = window.location.href.match(reg);
	if(r == null) return false;
	var divs = document.querySelectorAll(btnPosIn[0]),i,h4;//xpath('//p[@class="lm_pager_box"]')
	if(divs.length < 1) return false;
	var str = '<input type="checkbox" id="snaplinks_selectAll" checked style="vertical-align:middle;" title="全选"/> <a href="#" id="snaplinks_openAll">打开</a>';
	if(Filter!=null) str +=' <a href="#" id="snaplinks_filter">过滤</a>';
	for(i=0;i<divs.length;i++) divs[i].insertAdjacentHTML(btnPosIn[1],str);//有四种值可用：beforeBegin: 插入到标签开始前 afterBegin:插入到标签开始标记之后 beforeEnd:插入到标签结束标记前 afterEnd:插入到标签结束标记后
	var divs1 = document.querySelectorAll(chkPosIn[0]),as = document.querySelectorAll(alinks);
	var sLinks = divs1.length;
	if(sLinks < 1) return false;
	for(i=0;i<sLinks;i++) {
		divs1[i].insertAdjacentHTML(chkPosIn[1],'<input type="checkbox" name="snaplinks_chk" checked style="vertical-align:middle;" ahref="'+as[i].href+'"/> ');
		//as[i].target = "_blank";
	}
	var win = (typeof unsafeWindow !== "undefined") ? unsafeWindow : window;
	document.getElementById("snaplinks_selectAll").addEventListener("click", function (event) { 
		var obj = event.target;//alert(event.keyCode); 
		var chks = document.getElementsByName('snaplinks_chk'),len = chks.length,selectAll = false;
		if(obj.checked == true) selectAll = true;
		for(var i=0;i<len;i++) chks[i].checked = selectAll;
	}, false);
	document.getElementById("snaplinks_openAll").addEventListener("click", function (event) {
		event.stopPropagation();event.preventDefault();
		var chks = document.getElementsByName('snaplinks_chk'),len = chks.length,url,i,alink,queue=[];
		for(i=0;i<len;i++) {//&&i<6单次操作弹出页面超过6个就会造成被firefox默认阻止
			if(chks[i].checked != true) continue;
			chks[i].checked = false;
			alink = chks[i].getAttribute('ahref');
			GM_openInTab(alink);
		}
	}, false);
	if(Filter==null) return;
	document.getElementById("snaplinks_filter").addEventListener("click", function (event) {
		event.stopPropagation();event.preventDefault();
		var chks = document.getElementsByName('snaplinks_chk'),len = chks.length;
		for(i=0;i<len;i++) {
			//if(chks[i].checked != true) continue;
			if(Filter(chks[i]))	chks[i].checked = !chks[i].checked;//false
			else chks[i].checked = false;
			//alink = chks[i].getAttribute('ahref');
			//GM_openInTab(alink);
		}
	}, false);
})();
