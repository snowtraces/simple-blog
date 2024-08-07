class Post {
    constructor(title, url, author, createDate, updateDate, content, featureImg) {
        this.title = title
        this.url = url
        this.author = author
        this.createDate = createDate
        this.updateDate = updateDate
        this.content = content
        this.featureImg = featureImg
    }

    getAbstract() {
        return `<div class="post abstract-post">
        <div class="post-title">
            <h1><a title="${this.title}" href="${this.url}">${this.title}</a></h1>
            <div class="title-meta">
                <span class="meta-author">${this.author}</span> / <span class="meta-time">${this.updateDate || this.createDate}</span>
            </div>
        </div>
        <div class="post-content">${this.content.length >= 2 ? this.content.slice(0, 2).join('') : this.content.join('')}</div>
        <div class="post-image"></div>
        <button class="read-more-btn" href="${this.url}">查看全文</button>
    </div>`
    }

    getHtml() {
        return `<div class="post">
        <div class="post-title">
            <h1>${this.title}</h1>
            <div class="title-meta">
                <span class="meta-author">${this.author}</span> / <span class="meta-time">${this.updateDate || this.createDate}</span>
            </div>
        </div>
        <div class="post-content">
            ${this.content.join('')}
        </div>
        <div class="post-image"></div>
        <ul class="post-menu"></ul>
    </div>`
    }
}