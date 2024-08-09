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
            window.eventHub.on('post-detail', (param) => {
                this.openPost(param)
            })
        },
        openPost(param) {
            let script_list = ['./js/3rdparty/prism.js']

            $.get(`./data/post/${param.data}.md`)
                .then((postText) => {
                    let post_info = $.mdParser(postText);
                    if (post_info.script) {
                        script_list.push(...post_info.script)
                    }
                    $.log(post_info)
                    let post = new Post(
                        post_info.meta.title,
                        param.data,
                        post_info.meta.author,
                        post_info.meta.date,
                        post_info.meta.date,
                        post_info.post,
                        null
                    )
                    this.model.data = post
                    this.view.render(this.model.data)

                    if (param.pushState) {
                        history.pushState({ 'page_id': post_info.meta.id || 0 }, null, './#post#' + param.data)
                    }
                    $.el('.container').scroll(0, 0)
                    $.el('.main-content').scroll(0, 0)
                    syncLoad(script_list, loadScript)
                })
        }
    }

    controller.init(view, model)
}
