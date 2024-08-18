let jsList = [
    './js/util/function.js',
    './js/util/markdown.js',
    './js/util/event-hub.js',

    './js/entity.js',
    './js/module/main-post.js',
    './js/module/main-post-detail.js',
]

let developModel = true;

if (developModel) {
    jsList.push('./js/module/builder.js')
}

let cssList = [
    './css/hight.css',
]

let version = developModel ? new Date().getTime() : '1.0.3';

function loadScript(url) {
    if (document.querySelector(`script[src="${url}?version=${version}"]`)) {
        return
    }

    let script = document.createElement('script');
    script.src = `${url}?version=${version}`;
    let body = document.querySelector('body');
    body.append(script);

    return script;
}
function loadCss(url) {
    if (document.querySelector(`link[href="${url}?version=${version}"]`)) {
        return
    }

    let link = document.createElement('link');
    link.rel = 'stylesheet'
    link.href = `${url}?version=${version}`;
    let head = document.querySelector('head');
    head.append(link);

    return link;
}

function syncLoad(urlList, loadFunction) {
    let len = urlList.length;
    if (len === 0) {
        return
    }
    let el = loadFunction(urlList[0]);
    if (el) {
        el.onerror = () => {
            urlList.shift()
            syncLoad(urlList, loadFunction)
        }
        el.onload = () => {
            urlList.shift()
            syncLoad(urlList, loadFunction)
        }
    } else {
        urlList.shift()
        syncLoad(urlList, loadFunction)
    }

}

window.onload = function () {
    syncLoad(cssList, loadCss)
    syncLoad(jsList, loadScript)
}
