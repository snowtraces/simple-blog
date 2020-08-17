{
    let view = {
        el: '#main',
        template: `\${data.map(post => post.getHtml()).join('')}`,
        render(data) {
            $.el(this.el).innerHTML = $.evalTemplate(this.template, data)
        }
    }

    let model = {
        data: []
    }

    let controller = {
        init(view, model) {
            this.view = view
            this.model = model

            this.listPost()
            // this.view.render(this.model.data)
            this.bindEvents()
            this.bindEventHub()
        },
        bindEvents() {
            $.bindEvent('.post pre[class*="language-"]::before', 'click', (e) => alert(e.path[0]))
        },
        bindEventHub() {

        },
        listPost() {
            let script_list = ['./js/3rdparty/prism.js']
            $.get('./data/post/index.json')
                .then(indexList => {
                    indexList.forEach(async (fileName, idx) => {
                        let postText = await $.get(`./data/post/${fileName}.md`)
                        let post_info = $.mdParser(postText);
                        if (post_info.script) {
                            script_list.push(...post_info.script)
                        }
                        $.log(post_info)
                        let post = new Post(
                            post_info.meta.title,
                            '',
                            post_info.meta.author,
                            post_info.meta.date,
                            post_info.meta.date,
                            post_info.post.length >= 2 ? post_info.post.slice(0, 2).join('') : post_info.post.slice(0, 2).join(''),
                            null
                        )
                        this.model.data.push(post)
                        if (indexList.length - 1 === idx) {
                            this.view.render(this.model.data)
                            syncLoad(script_list, loadScript)
                        }
                    });
                })
        }
    }

    controller.init(view, model)
}
