{
    let view = {
        el: '#main',
        template: `\${data.map(post => post.getAbstract()).join('')}`,
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
            
            // 页面导航
            let existNav = this.pageNav()
            if (!existNav) {
                this.listPost({ pushState: false })
            }
            this.loadPostIndex()

            this.bindEvents()
            this.bindEventHub()
        },
        bindEvents() {
            $.bindEvent('.abstract-post .post-title h1, .read-more-btn, .nav-post-link', 'click', (e) => {
                e.preventDefault();
                let path = e.target.getAttribute('href');
                window.eventHub.emit('post-detail', { data: path, pushState: true })
            })
        },
        bindEventHub() {
            window.eventHub.on('post-list', (param) => {
                this.listPost(param)
            })
        },
        pageNav() {
            let path = window.location.href
            let url_segs = path.split('#')
            if (url_segs.length >= 3) {
                let cat = url_segs[1]
                let param = url_segs[2]
                if (cat === 'post') {
                    window.eventHub.emit('post-detail', { data: param, pushState: true })
                }
                return true
            } else {
                return false;
            }
        },
        loadPostIndex() {
            $.get(`./data/post/index.json?v=${version}`)
            .then(indexObj => {
                let postIndexHtml = Object.keys(indexObj).map(date => `
                <div class='post-index-grp'>
                    <div class='post-index-date'>${date}</div>
                    ${indexObj[date].map(post => `
                        <a class='nav-post-link' href ='${post.path}'>${post.title}</a>
                    `).join('')}
                </div>
                `).join('')
                $.el('#post-index').innerHTML = postIndexHtml
            })
           
        },
        listPost(param) {
            let script_list = ['./js/3rdparty/prism.js']
            let post_obj = {}
            $.get(`./data/post/index.json?v=${version}`)
                .then(indexObj => {
                    let indexList = Object.values(indexObj).slice(0, 9).flat().slice(0, 9).map(a => a.path)
                    indexList.forEach(async (fileName, idx) => {
                        let postText = await $.get(`./data/post/${fileName}.md`)
                        let post_info = $.mdParser(postText);
                        if (post_info.script) {
                            script_list.push(...post_info.script)
                        }
                        $.log(post_info)
                        let post = new Post(
                            post_info.meta.title,
                            fileName,
                            post_info.meta.author,
                            post_info.meta.date,
                            post_info.meta.date,
                            post_info.post,
                            null
                        )
                        post_obj[idx] = post
                        if (indexList.length === Object.keys(post_obj).length) {
                            this.model.data = Object.values(post_obj)
                            this.view.render(this.model.data)

                            if (param.pushState) {
                                history.pushState({ 'page_id': 0 }, null, './')
                            }
                            syncLoad(script_list, loadScript)
                        }
                    });
                })
        }
    }

    controller.init(view, model)
}
