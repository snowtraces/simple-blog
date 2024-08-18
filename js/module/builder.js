{
    let view = {
        el: '#main',
        template: ``,
        render(data) {
            $.el(this.el).innerHTML = $.evalTemplate(this.template, data)
        }
    }

    let model = {
        pages: [
        ],
        htmlMap: {}
    }

    let controller = {
        init(view, model) {
            this.view = view
            this.model = model
            syncLoad(['./js/3rdparty/jszip.min.js', './js/util/saveData.js'], loadScript)
            this.initPages()
            this.bindEvents()
            this.bindEventHub()
        },
        initPages() {
            $.get(`./data/post/index.json?v=${version}`)
            .then(indexObj => {
                this.model.pages = Object.values(indexObj).flat().map(a => a.path)
            })
        },
        bindEvents() {
            $.el('#build-html').classList.remove('hide')

            // 静态页面生成
            $.bindEvent('#build-html', 'click', () => {
                // 首页开始
                // 1. 获取当前页面
                this.model.htmlMap['index'] = '<!DOCTYPE html>\n' + $.el('html').outerHTML
                .replace(/<script[^>]*main\.js[^>]*><\/script>/, '')
                .replace(/<script[^>]*nav\.js[^>]*><\/script>/, '')
                .replace(/<script[^>]*builder\.js[^>]*><\/script>/, '')
                .replace(/<script[^>]*main-post\.js[^>]*><\/script>/, '')
                .replace(/<script[^>]*main-post-detail\.js[^>]*><\/script>/, '')
                .replace(/<script[^>]*jszip.min\.js[^>]*><\/script>/, '')
                .replace(/script src=".\//g, 'script src="/')
                .replace(/rel="stylesheet" href=".\//g, 'rel="stylesheet" href="/')
                .replace(/.*id="build-html".*/, '')
                // .replace(/<a href="\/">寻觅<\/a>/, '<a href="/post/">寻觅</a>')
                .replace(/class="nav-post-link" href="([^"]+)">/g, 'class="nav-post-link" href="/post/$1.html">')
                .replace(/(<h1><a title="[^"]+" href=")([^"]+)(">)/g, '$1/post/$2.html$3')
                .replace(/<button class="read-more-btn" href="([^"]+)">查看全文/g, '<button class="read-more-btn" href="/post/$1.html"><a href="/post/$1.html">查看全文</a>')

                // 2. 切换页面
                window.eventHub.emit('post-detail', { data: this.model.pages[0] })

            })
        },
        arrRemove(arr, val) {
            var index = arr.indexOf(val);
            if (index > -1) {
                arr.splice(index, 1);
            }
        },
        zipFileAndDownload() {
            let zip = new JSZip();
            Object.keys(this.model.htmlMap).forEach(key => {
                let value = this.model.htmlMap[key]
                zip.file(`${key}.html`, value)
            })

            zip.generateAsync({ type: "blob" })
                .then(function (content) {
                    saveData.setDataConver({
                        name: `html.zip`,
                        data: content
                    })
                });
        },
        bindEventHub() {
            window.eventHub.on('loadingOff', (type) => {
                this.model.htmlMap[type] = '<!DOCTYPE html>\n' + $.el('html').outerHTML
                    .replace(/<script[^>]*main\.js[^>]*><\/script>/, '')
                    .replace(/<script[^>]*nav\.js[^>]*><\/script>/, '')
                    .replace(/<script[^>]*builder\.js[^>]*><\/script>/, '')
                    .replace(/<script[^>]*main-post\.js[^>]*><\/script>/, '')
                    .replace(/<script[^>]*main-post-detail\.js[^>]*><\/script>/, '')
                    .replace(/<script[^>]*jszip.min\.js[^>]*><\/script>/, '')
                    .replace(/script src=".\//g, 'script src="/')
                    .replace(/rel="stylesheet" href=".\//g, 'rel="stylesheet" href="/')
                    .replace(/.*id="build-html".*/, '')
                    // .replace(/<a href="\/">寻觅<\/a>/, '<a href="/post/">寻觅</a>')
                    .replace(/class="nav-post-link" href="([^"]+)">/g, 'class="nav-post-link" href="/post/$1.html">')

                this.arrRemove(this.model.pages, type)
                if (this.model.pages.length) {
                    window.eventHub.emit('post-detail', { data: this.model.pages[0] })
                } else {
                    // 页面遍历结束
                    // $.log(JSON.stringify(this.model.htmlMap, null, 2))
                    this.zipFileAndDownload()
                }
            })
        }
    }

    controller.init(view, model)
}