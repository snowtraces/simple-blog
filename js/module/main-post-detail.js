{
    let view = {
        el: '#main',
        template: `\${data.getHtml()}`,
        render(data) {
            $.el(this.el).innerHTML = $.evalTemplate(this.template, data)
        }
    }

    let model = {
        data: {}
    }

    let controller = {
        init(view, model) {
            this.view = view
            this.model = model

            this.bindEvents()
            this.bindEventHub()
        },
        bindEvents() {

        },
        bindEventHub() {
            window.eventHub.on('post-detail', (path) => {
                this.openPost(path)
            })
        },
        openPost(path) {
            let script_list = ['./js/3rdparty/prism.js']

            $.get(`./data/post/${path}.md`)
                .then((postText) => {
                    let post_info = $.mdParser(postText);
                    if (post_info.script) {
                        script_list.push(...post_info.script)
                    }
                    $.log(post_info)
                    let post = new Post(
                        post_info.meta.title,
                        path,
                        post_info.meta.author,
                        post_info.meta.date,
                        post_info.meta.date,
                        post_info.post,
                        null
                    )
                    this.model.data = post
                    this.view.render(this.model.data)
                    history.pushState({ 'page_id':  post_info.meta.id || 0}, null, './#post#' + path)
                    syncLoad(script_list, loadScript)
                })
        }
    }

    controller.init(view, model)
}
