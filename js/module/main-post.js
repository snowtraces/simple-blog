{
    let view = {
        el: '#main',
        template: `\${data.map(post => post.getHtml()).join('')}`,
        render(data) {
            debugger
            $.el(this.el).innerHTML = $.evalTemplate(this.template, data)
            syncLoad(['./js/3rdparty/prism.js'], loadScript)
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

        },
        bindEventHub() {

        },
        listPost() {
            $.get('./data/post/index.json')
                .then(indexList => {
                    indexList.forEach(async (fileName, idx) => {
                        let postText = await $.get(`./data/post/${fileName}.md`)
                        let post_info = $.mdParser(postText);
                        $.log(post_info)
                        let post = new Post(
                            post_info.meta.title,
                            '',
                            post_info.meta.author,
                            post_info.meta.date,
                            post_info.meta.date,
                            post_info.post.join(''),
                            null
                        )
                        this.model.data.push(post)
                        if (indexList.length - 1 === idx) {
                            this.view.render(this.model.data)
                        }
                    });
                })
        }
    }

    controller.init(view, model)
}
