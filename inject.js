var readyStateCheckInterval,
	locationChangeInterval,
	cxjtBoardWrapper,
	cxjtBoardHeaderWrapper,
	cxjtBoardHeader,
	cxjtBoardHeaderOriginalClassName;
var cxjtClassNameForHiddenBoardHeader = 'hideBoardHeader';
var cookiename = 'cxjtPreferences';

chrome.extension.sendMessage({}, function(response) {
	waitPageToLoad(true);
});

function waitPageToLoad(fistPageLoad) {
	readyStateCheckInterval = setInterval(function() {
		if (document.querySelector('div[style="height: 100%; flex: 1 0 auto; position: relative;"]')) {
			clearInterval(readyStateCheckInterval);
			if (fistPageLoad) {
				initJiraTweaks();
			}
			else {
				initElementClasses();
				setupInitialUIState();
			}
		}
	}, 10);
}

function initJiraTweaks() {
	initElementClasses();
	addShortcuts();
	addToolbar();
	setupInitialUIState();
	listenPageNavigations();
}

function setupInitialUIState() {
	if (getPreference('hideBoardHeader')) {
		hideBoardHeader();
	}
}

function listenPageNavigations() {
	// unfortunately there is no proper urlchange/history change model other than polling
	var currentPageUrl = window.location.href.split('?')[0];
	locationChangeInterval = setInterval(function() {
		if (window.location.href.split('?')[0] !== currentPageUrl) {
			console.log(currentPageUrl, window.location.href.split('?')[0]);
			pageStateChanged();
			currentPageUrl = window.location.href.split('?')[0];
		}
	}, 500);
}

function pageStateChanged() {
	// console.log('page state changed...');
	clearInterval(readyStateCheckInterval);
	waitPageToLoad(false);
}

function initElementClasses() {
	/*
	
	To navigate to the board header area:
		navigate board's child
			document.querySelector('div[style="height: 100%; flex: 1 0 auto; position: relative;"]')
		go up to it's first parent
			el.parentNode
		move to previous sibling
			el.parentNode.previousSibling
	
	*/

	cxjtBoardWrapper = document.querySelector('div[style="height: 100%; flex: 1 0 auto; position: relative;"]');
	cxjtBoardHeaderWrapper = cxjtBoardWrapper.parentNode.previousSibling;
	cxjtBoardHeader = cxjtBoardHeaderWrapper.children[0];
	cxjtBoardHeaderOriginalClassName = cxjtBoardHeader.className;
	cxjtBoardHeader.className += " cxjtBoardHeader";
}

function hasClass(el, classToSearch) {
	return el.className.indexOf(classToSearch) !== -1;
}

function addClass(el, classToAdd) {
	el.className += " " + classToAdd;
}

function removeClass(el, classToRemove) {
	el.className = el.className.replace(classToRemove, '');
}

function showBoardHeader() {
	removeClass(cxjtBoardHeader, cxjtClassNameForHiddenBoardHeader);
	setPreference('hideBoardHeader', false);
}

function hideBoardHeader() {
	setTimeout(function(){
		addClass(cxjtBoardHeader, cxjtClassNameForHiddenBoardHeader);
		setPreference('hideBoardHeader', true);
	}, 1);
}

function addToolbar() {
	var toolbar = document.createElement('div');
	toolbar.className = "cxjtToolbar";
	document.body.appendChild(toolbar);
	
	var btn = document.createElement('a');
	btn.innerHTML = "Toggle Header"
	btn.onclick = function () {
		if (hasClass(cxjtBoardHeader, cxjtClassNameForHiddenBoardHeader)) showBoardHeader();
		else hideBoardHeader();
	}
	toolbar.appendChild(btn);

	setTimeout(function(){
		document.querySelector('.cxjtToolbar').className += ' peek';
	}, 2000);
}

function addShortcuts(){
	document.onkeydown = function(e) {
		// console.log('meta ctrl alt shift code', e.metaKey, e.ctrlKey, e.altKey, e.shiftKey, e.which)
		if (e.altKey && e.which == 49) { // alt + 1
			// console.log('go to BOARD view');
			toggleBoardAndBacklog();
		}
		else if (e.altKey && e.which == 50) { // alt + 2
			// console.log('go to BACKLOG view');
			toggleBoardAndBacklog(true);
		}
	};
}

function toggleBoardAndBacklog(toBacklog){
	var currentPageUrl = window.location.href.split('?')[0];
	if (toBacklog) {
		if (document.querySelector('#backlog')) {
			document.querySelector('#backlog').click();
		}
		else {
			if (currentPageUrl.indexOf('/backlog') === -1)
				window.location.href = currentPageUrl + '/backlog';
		}
	}
	else {
		if (document.querySelector('#active-sprints')) {
			document.querySelector('#active-sprints').click();
		}
		else {
			var updatedUrl = currentPageUrl.replace('/backlog', '');
			if (updatedUrl !== currentPageUrl) window.location.href = updatedUrl;
		}
	}
}

function getPreferences() {
    var v = document.cookie.match('(^|;) ?' + cookiename + '=([^;]*)(;|$)');
	var value = v ? v[2] : null;
	return JSON.parse(value);
}

function getPreference(name) {
    var data = getPreferences();
	return data && data[name];
}

function setPreference(name, value) {
	var data = getPreferences() || {};
	data[name] = value;
	var cookievalue = JSON.stringify(data);

	var days = 1000; // 3yrs
    var d = new Date;
    d.setTime(d.getTime() + 24*60*60*1000*days);
    document.cookie = cookiename + "=" + cookievalue + ";path=/;expires=" + d.toGMTString();
}
