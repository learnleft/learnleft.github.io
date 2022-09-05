
module.exports = {
    themeConfig: {// 主题设置
        nav: [// 导航栏
            {
                text: '概述',
                link: '/'
            }, {
                text: 'Vue 学习笔记',
                items:[
                    {text:'笔记', link: '/book/0-1'}, // 可不写后缀 .md
                    {text:'其它链接', link: 'https://www.baidu.com/'}// 外部链接
                ]
            }, {
                text: 'Typescript 学习笔记',
                items:[
                    {text:'笔记', link: '/'},// 以 ‘/’结束，默认读取 README.md
                    {text:'其它链接', link: 'https://www.baidu.com/'} // 外部链接
                ]
            }
        ]
...
}
