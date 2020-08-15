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

    getHtml() {
        return `<div class="post">
        <div class="post-title">
            <h2><a title="${this.title}" href="${this.title}">${this.title}</a></h2>
            <div class="title-meta">
                <span class="meta-key">时间</span>
                <span class="meta-value">${this.updateDate || this.createDate}</span>
                <span class="meta-key">作者</span>
                <span class="meta-value">${this.author}</span>
            </div>
        </div>
        <div class="post-content">${this.content}</div>
        <div class="post-image"></div>
        <button class="read-more-btn border-g">查看全文</button>
    </div>`
    }
}