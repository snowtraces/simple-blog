{
    let view = {
        el: '#main',
        template: `\${data.map(post => post.getHtml()).join('')}`,
        render(data) {
            $.el(this.el).innerHTML = $.evalTemplate(this.template, data)
        }
    }

    let model = {
        data: [
            new Post(
                '将进酒',
                '/',
                '李白',
                '2020-08-14',
                '2020-08-14',
                '君不见黄河之水天上来 奔流到海不复回\n君不见高堂明镜悲白发 朝如青丝暮成雪\n人生得意须尽欢 莫使金樽空对月\n天生我材必有用 千金散尽还复来\n烹羊宰牛且为乐 会须一饮三百杯\n岑夫子 丹丘生 将进酒 杯莫停\n与君歌一曲 请君为我倾耳听\n钟鼓馔玉不足贵 但愿长醉不复醒\n古来圣贤皆寂寞 惟有饮者留其名\n陈王昔时宴平乐 斗酒十千恣欢谑\n主人何为言少钱 径须沽取对君酌\n五花马 千金裘\n呼儿将出换美酒 与尔同销万古愁',
                null
            ),
            new Post(
                '将进酒',
                '/',
                '李白',
                '2020-08-14',
                '2020-08-14',
                '君不见黄河之水天上来 奔流到海不复回\n君不见高堂明镜悲白发 朝如青丝暮成雪\n人生得意须尽欢 莫使金樽空对月\n天生我材必有用 千金散尽还复来\n烹羊宰牛且为乐 会须一饮三百杯\n岑夫子 丹丘生 将进酒 杯莫停\n与君歌一曲 请君为我倾耳听\n钟鼓馔玉不足贵 但愿长醉不复醒\n古来圣贤皆寂寞 惟有饮者留其名\n陈王昔时宴平乐 斗酒十千恣欢谑\n主人何为言少钱 径须沽取对君酌\n五花马 千金裘\n呼儿将出换美酒 与尔同销万古愁',
                null
            )
        ]

    }

    let controller = {
        init(view, model) {
            this.view = view
            this.model = model
            this.view.render(this.model.data)
            this.bindEvents()
            this.bindEventHub()
        },
        bindEvents() {

        },
        bindEventHub() {

        }
    }

    controller.init(view, model)
}
